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
import { getEnvVar } from "@/lib/env";

// Schema for initiating a payment
const InitiatePaymentSchema = z.object({
  orderId: z.string().min(1),
  method: z.enum(["pix", "credit_card", "boleto"]),
  amountCents: z.number().int().positive(),
  publicToken: z.string().optional(),
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from("orders").select("id, status, total_cents, store_id");

    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("public_token", orderId);
    }

    const token = publicToken || (!isUuid ? orderId : undefined);

    if (user) {
      query = query.eq("customer_id", user.id);
    } else if (token) {
      query = query.eq("public_token", token);
    }

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) throw new Error("Pedido não encontrado ou acesso negado.");
    if (order.status !== "awaiting_payment")
      throw new Error("Pedido não está aguardando pagamento.");
    if (order.total_cents !== amountCents) throw new Error("Divergência de valores no pagamento.");

    const pagarmeSecretKey = getEnvVar("PAGARME_SECRET_KEY");
    if (!pagarmeSecretKey) {
      throw new Error(
        "unconfigured_integration: As chaves do gateway de pagamento não estão configuradas na nuvem. Pagamento bloqueado.",
      );
    }

    // --- AVOID DUPLICATE PAYMENTS ---
    // The Checkout RPC already creates a 'pending' payment record to guarantee atomic integrity.
    // Here, we just retrieve it to avoid generating duplicates.
    const { data: existingPayment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError || !existingPayment) {
      throw new Error("Não foi encontrada intenção de pagamento válida para este pedido.");
    }

    // --- GATEWAY INTEGRATION (Pagar.me V5) ---
    // Fetch required data for Pagar.me
    const { data: fullOrder } = await supabase.from("orders").select("*").eq("id", order.id).single();

    const pagarmePayload: any = {
      items: (fullOrder.items_snapshot || []).map((item: any) => ({
        amount: item.unit_price_cents,
        description: item.product_title || "Produto",
        quantity: item.qty || 1,
      })),
      customer: {
        name: fullOrder.customer_snapshot?.name || "Cliente",
        email: fullOrder.customer_snapshot?.email || "email@desconhecido.com",
        type: "individual",
        document: fullOrder.customer_snapshot?.document || "00000000000",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: "11",
            number: "999999999",
          }
        }
      },
      payments: []
    };

    if (method === "pix") {
      pagarmePayload.payments.push({
        payment_method: "pix",
        pix: { expires_in: 86400 }
      });
    } else if (method === "boleto") {
      pagarmePayload.payments.push({
        payment_method: "boleto",
        boleto: { instructions: "Pagar até o vencimento" }
      });
    } else {
      throw new Error("Integração de cartão de crédito via Server Function exige tokenização prévia no Frontend.");
    }

    const auth = Buffer.from(`${pagarmeSecretKey}:`).toString('base64');
    const response = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(pagarmePayload)
    });

    const pagarmeRes = await response.json();

    if (!response.ok) {
      console.error("[PAGARME] Erro na requisição:", JSON.stringify(pagarmeRes));
      throw new Error("Falha de integração com Pagar.me: " + (pagarmeRes.message || "Erro desconhecido"));
    }

    const transactionId = pagarmeRes.id;
    let qrCode = null;
    let qrCodeUrl = null;

    if (method === "pix" && pagarmeRes.charges && pagarmeRes.charges[0]) {
      const charge = pagarmeRes.charges[0];
      if (charge.last_transaction && charge.last_transaction.qr_code) {
        qrCode = charge.last_transaction.qr_code;
        qrCodeUrl = charge.last_transaction.qr_code_url;
      }
    }

    // Update internal payment transaction with provider reference
    await supabase.from("payments").update({ 
      provider_name: "pagarme",
      provider_ref: transactionId,
      metadata: {
        pagarme_order_id: transactionId,
        qr_code: qrCode,
        qr_code_url: qrCodeUrl
      }
    }).eq("id", existingPayment.id);

    // [CRITICAL FIX] We DO NOT update the order status to "processing" here anymore.
    // The order stays "awaiting_payment". It will transition only when the Webhook arrives.

    return {
      status: "success",
      paymentId: existingPayment.id,
      qrCode,
      qrCodeUrl,
      message: "Cobrança gerada com sucesso. Efetue o pagamento para liberar o pedido.",
    };
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
      .from("payments")
      .select("id, amount_cents, method")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const actualMethod = receivedMethod || existingTx?.method || "cash";

    if (existingTx) {
      await supabase
        .from("payments")
        .update({
          status: "paid",
          method: actualMethod,
          paid_at: new Date().toISOString(),
        })
        .eq("id", existingTx.id);
    } else {
      // If there's no transaction (legacy or bypass), create one
      await supabase.from("payments").insert({
        order_id: orderId,
        store_id: order.store_id,
        idempotency_key: `manual_${Date.now()}`,
        provider_ref: `manual_${Date.now()}`,
        provider_name: "manual",
        amount_cents: order.total_cents,
        method: actualMethod,
        status: "paid",
        paid_at: new Date().toISOString(),
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

      return data;
    } catch (e: any) {
      console.error("[payment] approvePayment error:", e);
      throw new Error(e.message || "Erro ao aprovar pagamento.");
    }
  });

export const rejectPayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), reason: z.string().optional() }))
  .handler(async ({ data: { orderId, reason } }) => {
    try {
      const db = getServerClient();
      await db
        .from("payments")
        .update({ status: "failed", failure_reason: reason, failed_at: new Date().toISOString() })
        .eq("order_id", orderId);

      const { data, error } = await db
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;

      return data;
    } catch (e: any) {
      console.error("[payment] rejectPayment error:", e);
      throw new Error(e.message || "Erro ao rejeitar comprovante.");
    }
  });

export const listPendingManualPayments = createServerFn({ method: "GET" }).handler(async () => {
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
    return data || [];
  } catch (e: any) {
    console.error("[payment] listPendingManualPayments error:", e);
    throw new Error(e.message || "Erro ao buscar comprovantes pendentes.");
  }
});

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
        throw new Error(e.message || "Erro ao enviar comprovante.");
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
    return data || [];
  } catch (e: any) {
    console.error("[payment] listManualPaymentMethods error:", e);
    throw new Error(e.message || "Erro ao listar métodos de pagamento manual.");
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
      throw new Error(e.message || "Erro ao salvar método de pagamento.");
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
      throw new Error(e.message || "Erro ao excluir método de pagamento.");
    }
  });

export const getPublicPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada");
    const storeData = { id: storeId };
    if (!storeData) throw new Error("Loja não encontrada");

    const { data, error } = await db
      .from("manual_payment_methods")
      .select("id, name, instructions, surcharge_percentage, discount_percentage")
      .eq("store_id", storeData.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e: any) {
    console.error("[payment] getPublicPaymentMethods error:", e);
    throw new Error(e.message || "Erro ao obter métodos de pagamento públicos.");
  }
});

export const getGatewayStatus = createServerFn({ method: "GET" }).handler(async () => {
  // Returns true if the digital gateway (e.g. Pagar.me) has secrets configured
  const pagarmeSecretKey = getEnvVar("PAGARME_SECRET_KEY");
  return Boolean(pagarmeSecretKey && pagarmeSecretKey.length > 5);
});

export const getCustomerOrderPayments = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user?.id) {
    return [];
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, public_token, status, total_cents, created_at, payments(id, status, method, amount_cents, created_at)",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[payment] getCustomerOrderPayments error:", error);
    return [];
  }

  return orders || [];
});
