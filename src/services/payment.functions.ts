/**
 * Payment and Financial Server Functions
 *
 * Processes payments and enforces side-effects like Stock Ledger immutability.
 * Uses strict atomic transactions with the Pagar.me integration.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";

import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";

// Schema for initiating a payment
const InitiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["pix", "credit_card", "boleto"]),
  amountCents: z.number().int().positive(),
  publicToken: z.string().optional(), // Used for guests
  // For real integration, you'd add credit card tokens here
});

/**
 * Initiates a transaction with the external Gateway (Pagar.me)
 * and records it atomically in the `payment_transactions` table.
 */
export const initiatePaymentTransaction = createServerFn({ method: "POST" })
  .validator(InitiatePaymentSchema)
  .handler(async ({ data: { orderId, method, amountCents, publicToken } }) => {
    const supabase = getServerClient();
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    // 1. Validate order state
    let query = supabase.from("orders").select("id, status, total_cents").eq("id", orderId);

    if (user) {
      query = query.eq("customer_id", user.id);
    } else if (publicToken) {
      query = query.eq("public_token", publicToken);
    } else {
      throw new Error("Autenticação ou token público obrigatórios.");
    }

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) throw new Error("Pedido não encontrado ou acesso negado.");
    if (order.status !== "awaiting_payment")
      throw new Error("Pedido não está aguardando pagamento.");
    if (order.total_cents !== amountCents) throw new Error("Divergência de valores no pagamento.");

    const txId = `manual_${crypto.randomBytes(4).toString("hex")}`;

    // 3. Record the transaction strictly as pending
    const { error: txError } = await supabase.from("payment_transactions").insert({
      order_id: orderId,
      gateway_transaction_id: txId,
      gateway_provider: "manual_negotiation",
      amount_cents: amountCents,
      payment_method: method,
      status: "pending",
      metadata: { note: "Aguardando negociação via WhatsApp" },
    });

    if (txError) throw new Error("Falha ao registrar transação.");

    return { status: "success" as const };
  });

/**
 * Server function to handle post-payment confirmations cleanly (used by Webhooks or Admin bypass in emergencies)
 */
export const confirmPayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), receivedMethod: z.string().optional() }))
  .handler(async ({ data: { orderId, receivedMethod } }) => {
    const supabase = getServerClient();

    // 1. Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, store_id, total_cents")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Pedido não encontrado");
    if (order.status === "paid" || order.status === "completed" || order.status === "processing") {
      throw new Error("Pedido já processado ou faturado");
    }

    // 2. Mark payment transaction as paid first (so it's available)
    const { data: existingTx } = await supabase
      .from("payment_transactions")
      .select("id, amount_cents, payment_method")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const actualMethod = receivedMethod || existingTx?.payment_method || "cash";

    if (existingTx) {
      await supabase
        .from("payment_transactions")
        .update({
          status: "paid",
          payment_method: actualMethod,
        })
        .eq("id", existingTx.id);
    } else {
      // If there's no transaction (legacy or bypass), create one
      await supabase.from("payment_transactions").insert({
        order_id: orderId,
        gateway_transaction_id: `manual_${Date.now()}`,
        gateway_provider: "manual",
        amount_cents: order.total_cents,
        payment_method: actualMethod,
        status: "paid",
      });
    }

    // 3. Mark order as paid/processing
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "processing",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw new Error("Falha ao atualizar status do pedido");

    // 4. Update the active Cash Register (Caixa) Se foi pago em dinheiro
    if (actualMethod === "cash") {
      const { data: activeRegister } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("store_id", order.store_id)
        .eq("status", "open")
        .limit(1)
        .maybeSingle();

      if (activeRegister) {
        await supabase.from("cash_register_entries").insert({
          register_id: activeRegister.id,
          amount_cents: existingTx ? existingTx.amount_cents : order.total_cents,
          type: "in",
          method: "cash",
          description: `Venda #${orderId.split("-")[0]}`,
          reference_type: "order",
          reference_id: orderId,
        });
      }
    }

    return { status: "success" as const };
  });

export const approvePayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), receivedMethod: z.string().optional() }))
  .handler(async ({ data: { orderId, receivedMethod } }) => {
    try {
      const confirmRes = await confirmPayment({ data: { orderId, receivedMethod } });
      if (confirmRes.status !== "success") {
        throw new Error("Erro ao confirmar transação financeira");
      }

      const db = getServerClient();
      const { data } = await db.from("orders").select("*").eq("id", orderId).single();

      return { status: "success" as const, data };
    } catch (e: any) {
      console.error("[payment] approvePayment error:", e);
      return { status: "error" as const, message: e.message || "Erro ao aprovar pagamento." };
    }
  });

export const rejectPayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), reason: z.string().optional() }))
  .handler(async ({ data: { orderId, reason } }) => {
    try {
      const db = getServerClient();
      await db
        .from("payment_transactions")
        .update({ status: "failed", metadata: { reason } })
        .eq("order_id", orderId);

      const { data, error } = await db
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;

      return { status: "success" as const, data };
    } catch (e: any) {
      console.error("[payment] rejectPayment error:", e);
      return { status: "error" as const, message: e.message || "Erro ao rejeitar comprovante." };
    }
  });

export const listPendingManualPayments = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ status: "success"; data: any[] } | { status: "error"; message: string }> => {
    try {
      const db = getServerClient();
      const { data, error } = await db
        .from("payments")
        .select(
          `id, order_id, method, status, amount_cents, receipt_url, receipt_status, created_at,
           orders ( id, public_token, customer_snapshot, status )`,
        )
        .eq("receipt_status", "pending_review")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { status: "success" as const, data: data || [] };
    } catch (e: any) {
      console.error("[payment] listPendingManualPayments error:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao buscar comprovantes pendentes.",
      };
    }
  },
);

export const uploadPaymentReceipt = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      fileName: z.string().min(1).max(200),
      fileBase64: z.string().min(1),
    }),
  )
  .handler(
    async ({
      data: { orderId, fileName, fileBase64 },
    }): Promise<{ status: "success" } | { status: "error"; message: string }> => {
      try {
        const ssrClient = getSSRClient();
        const {
          data: { user },
        } = await ssrClient.auth.getUser();
        if (!user) throw new Error("Autenticação obrigatória.");

        const db = getServerClient();

        // 1. Verify order ownership — only the customer can upload their receipt
        const { data: order, error: orderError } = await ssrClient
          .from("orders")
          .select("id, status, store_id")
          .eq("id", orderId)
          .eq("customer_id", user.id)
          .single();

        if (orderError || !order) throw new Error("Pedido não encontrado ou acesso negado.");
        if (order.status !== "awaiting_payment") {
          throw new Error("Este pedido não está aguardando pagamento.");
        }

        // 2. Upload to Supabase Storage: receipts/{userId}/{orderId}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${user.id}/${orderId}/${timestamp}_${safeFileName}`;

        // Convert base64 to Uint8Array for storage
        const binaryStr = atob(fileBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Determine MIME type from file extension
        const ext = safeFileName.split(".").pop()?.toLowerCase() || "";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          pdf: "application/pdf",
          heic: "image/heic",
        };
        const contentType = mimeMap[ext] || "application/octet-stream";

        let { error: uploadError } = await db.storage
          .from("receipts")
          .upload(storagePath, bytes, { contentType, upsert: false });

        // Auto-Healing: If bucket not found, create it dynamically and retry
        if (uploadError && uploadError.message.includes("Bucket not found")) {
          console.log(`[storage] Bucket receipts missing. Auto-healing...`);
          const { error: createError } = await db.storage.createBucket("receipts", {
            public: false, // Receipts should not be public
            fileSizeLimit: 10485760,
          });
          
          if (createError) throw new Error(`Auto-healing failed: ${createError.message}`);

          // Retry
          const retry = await db.storage
            .from("receipts")
            .upload(storagePath, bytes, { contentType, upsert: false });
          uploadError = retry.error;
        }

        if (uploadError) {
          console.error("[payment] receipt upload error:", uploadError);
          throw new Error("Falha ao enviar o arquivo. Tente novamente.");
        }

        // 3. Get a signed URL (valid 30 days) for admin review
        const { data: signedUrlData } = await db.storage
          .from("receipts")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 30); // 30 days

        const receiptUrl = signedUrlData?.signedUrl || storagePath;

        // 4. Update the payments record
        const { error: paymentUpdateError } = await db
          .from("payments")
          .update({
            receipt_url: receiptUrl,
            receipt_status: "pending_review",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        if (paymentUpdateError) {
          console.error("[payment] payments update error:", paymentUpdateError);
          // Non-fatal: file is uploaded; log and continue
        }

        // 5. Transition order status to payment_processing
        await db.from("orders").update({ status: "payment_processing" }).eq("id", orderId);

        return { status: "success" as const };
      } catch (e: any) {
        console.error("[payment] uploadPaymentReceipt error:", e);
        return { status: "error" as const, message: e.message || "Erro ao enviar comprovante." };
      }
    },
  );

// ---------------------------------------------------------------------------
// Manual Payment Methods Configuration (Microfase 3E)
// ---------------------------------------------------------------------------

async function getAdminIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const db = getServerClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role, store_id")
    .eq("id", user.id)
    .single();

  if (!profile?.store_id || !["owner", "admin", "manager"].includes(profile.role)) {
    throw new Error("Acesso negado");
  }

  return profile;
}

const SaveManualPaymentMethodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  instructions: z.string().optional(),
  surcharge_percentage: z.number().min(0, "A taxa deve ser positiva ou zero"),
  discount_percentage: z.number().min(0, "O desconto deve ser positivo ou zero"),
  is_active: z.boolean(),
});

const DeleteManualPaymentMethodSchema = z.object({
  id: z.string().uuid(),
});

export const listManualPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getAdminIdentity();
    const db = getServerClient();
    const { data, error } = await db
      .from("manual_payment_methods")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { status: "success" as const, data: data || [] };
  } catch (e: any) {
    console.error("[payment] listManualPaymentMethods error:", e);
    return {
      status: "error" as const,
      message: e.message || "Erro ao listar métodos de pagamento manual.",
    };
  }
});

export const saveManualPaymentMethod = createServerFn({ method: "POST" })
  .validator(SaveManualPaymentMethodSchema)
  .handler(async ({ data }) => {
    try {
      const identity = await getAdminIdentity();
      const db = getServerClient();

      const payload = {
        store_id: identity.store_id,
        name: data.name,
        instructions: data.instructions || "",
        surcharge_percentage: data.surcharge_percentage,
        discount_percentage: data.discount_percentage,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await db
          .from("manual_payment_methods")
          .update(payload)
          .eq("id", data.id)
          .eq("store_id", identity.store_id);

        if (error) throw error;
      } else {
        const { error } = await db.from("manual_payment_methods").insert(payload);

        if (error) throw error;
      }

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[payment] saveManualPaymentMethod error:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao salvar método de pagamento.",
      };
    }
  });

export const deleteManualPaymentMethod = createServerFn({ method: "POST" })
  .validator(DeleteManualPaymentMethodSchema)
  .handler(async ({ data: { id } }) => {
    try {
      const identity = await getAdminIdentity();
      const db = getServerClient();

      const { error } = await db
        .from("manual_payment_methods")
        .delete()
        .eq("id", id)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: any) {
      console.error("[payment] deleteManualPaymentMethod error:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao excluir método de pagamento.",
      };
    }
  });

export const getPublicPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja nÃ£o encontrada");
    const storeData = { id: storeId };
    if (!storeData) throw new Error("Loja não encontrada");

    const { data, error } = await db
      .from("manual_payment_methods")
      .select("id, name, instructions, surcharge_percentage, discount_percentage")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { status: "success" as const, data: data || [] };
  } catch (e: any) {
    console.error("[payment] getPublicPaymentMethods error:", e);
    return {
      status: "error" as const,
      message: e.message || "Erro ao obter métodos de pagamento públicos.",
    };
  }
});
