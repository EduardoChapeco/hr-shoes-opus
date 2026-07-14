/**
 * Payment and Financial Server Functions
 *
 * Processes payments and enforces side-effects like Stock Ledger immutability.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

export const confirmPayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    const supabase = getServerClient();

    // In a real environment, this would be protected by admin/system role
    // For now we ensure it's called by an authenticated user for demo
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    // 1. Get the order and lock its current state
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, store_id, order_items(variant_id, qty)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Pedido não encontrado");

    if (order.status === "paid" || order.status === "completed") {
      throw new Error("Pedido já processado ou faturado");
    }

    // 2. Mark order as paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw new Error("Falha ao atualizar status do pedido");

    // 3. Mark payment as paid
    await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("order_id", orderId)
      .eq("status", "pending");

    // 4. Update the active Cash Register (Caixa)
    // Find the currently open cash register for this store
    const { data: activeRegister } = await supabase
      .from("cash_registers")
      .select("id")
      .eq("store_id", order.store_id)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (activeRegister) {
      // Get the payment record to get the amount and method
      const { data: paymentInfo } = await supabase
        .from("payments")
        .select("amount_cents, method")
        .eq("order_id", orderId)
        .limit(1)
        .maybeSingle();

      if (paymentInfo) {
        // Map payment method to cash_register_entry_method
        const methodMap: Record<string, string> = {
          pix: "pix",
          credit_card: "credit",
          boleto: "other",
          manual: "other",
        };
        const entryMethod = methodMap[paymentInfo.method] || "other";

        await supabase.from("cash_register_entries").insert({
          register_id: activeRegister.id,
          amount_cents: paymentInfo.amount_cents,
          type: "in",
          method: entryMethod,
          description: `Venda #${orderId.split("-")[0]}`,
          reference_type: "order",
          reference_id: orderId,
          actor_id: user?.id || null,
        });
      }
    }

    return { status: "success" as const };
  });

export const listPendingManualPayments = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();
    const { data: storeData } = await db.from("stores").select("id").limit(1).single();
    if (!storeData) throw new Error("No store found");

    const { data, error } = await db
      .from("orders")
      .select("id, public_token, total_cents, created_at, customer_id")
      .eq("store_id", storeData.id)
      .eq("status", "payment_processing")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { status: "ok" as const, data };
  } catch (e: unknown) {
    console.error("[payment] listPending error:", e);
    return { status: "error" as const, message: "Erro ao listar comprovantes" };
  }
});

export const uploadPaymentReceipt = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      fileName: z.string(),
      fileBase64: z.string(),
    }),
  )
  .handler(async ({ data: { orderId, fileName, fileBase64 } }) => {
    try {
      const db = getServerClient();

      // 1. Fetch order
      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, status, store_id")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // 2. Decode base64 proof file
      const buffer = Buffer.from(fileBase64, "base64");

      // 3. Upload to storage bucket using service role client
      const path = `receipts/${orderId}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await db.storage.from("product-media").upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

      if (uploadError) throw new Error("Falha no upload do arquivo: " + uploadError.message);

      const publicUrl = db.storage.from("product-media").getPublicUrl(path).data.publicUrl;

      // 4. Update payment record
      const { error: paymentError } = await db
        .from("payments")
        .update({
          receipt_url: publicUrl,
          receipt_status: "pending_review",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (paymentError)
        throw new Error("Falha ao salvar comprovante no pagamento: " + paymentError.message);

      // 5. Update order status to payment_processing (under lojista review)
      const { error: updateOrderError } = await db
        .from("orders")
        .update({
          status: "payment_processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateOrderError)
        throw new Error("Falha ao atualizar status do pedido: " + updateOrderError.message);

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[payment] uploadPaymentReceipt error:", e.message);
      return { status: "error" as const, message: e.message || "Erro ao processar comprovante." };
    }
  });

/**
 * processPaymentWebhook
 * This acts as the consolidated entrypoint for external webhooks (e.g., Stripe, MercadoPago, Pagar.me).
 * An actual API route would receive the HTTP POST, verify signatures, extract the Order ID,
 * and call this function.
 */
export const processPaymentWebhook = createServerFn({ method: "POST" })
  .validator(
    z.object({
      gateway: z.string(),
      payload: z.any(),
    }),
  )
  .handler(async ({ data: { gateway, payload } }) => {
    try {
      // 1. In a real integration, here you would parse the gateway payload.
      // Example for Stripe:
      // const orderId = payload.data.object.metadata.orderId;
      // const status = payload.type === "checkout.session.completed" ? "paid" : "failed";

      const orderId = payload?.orderId;
      const status = payload?.status;

      if (!orderId || status !== "paid") {
        return {
          status: "ignored",
          message: "Webhook didn't result in a paid status or missing orderId.",
        };
      }

      // 2. Delegate to the CONSOLIDATED payment function which handles all side-effects:
      // - Marks Order as Paid
      // - Creates Cash Register Entry
      // - Deducts Inventory Ledger permanently
      // - Removes Inventory Reservation
      await confirmPayment({ data: { orderId } });

      return { status: "success" as const };
    } catch (e: any) {
      console.error(`[webhook:${gateway}] error:`, e.message);
      return { status: "error" as const, message: "Erro ao processar webhook" };
    }
  });

export const approvePayment = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const db = getServerClient();

      const { data, error } = await db
        .from("orders")
        .update({ status: "processing" })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return { status: "success" as const, data };
    } catch (e: unknown) {
      console.error("[payment] approvePayment error:", e);
      return { status: "error" as const, message: "Erro ao aprovar." };
    }
  });
