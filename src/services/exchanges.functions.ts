import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) return { id: null, role: "customer", store_id: null, customer_id: null };

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    customer_id: user.id, // For easy access
    role: profile?.role || "customer",
    store_id: profile?.store_id || null,
  };
}

export const requestExchange = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      reason: z.string().min(5),
    }),
  )
  .handler(async ({ data: { orderId, reason } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para solicitar uma troca");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, store_id, status")
      .eq("id", orderId)
      .eq("customer_id", identity.customer_id)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (["draft", "cancelled", "payment_failed"].includes(order.status)) {
      throw new Error("Este pedido não é elegível para troca.");
    }

    const { error: insertError } = await supabase.from("exchanges").insert({
      store_id: order.store_id,
      order_id: order.id,
      customer_id: identity.customer_id,
      reason,
      status: "requested",
      refund_amount_cents: 0,
    });

    if (insertError) {
      throw new Error("Erro ao solicitar troca: " + insertError.message);
    }

    return { status: "success" };
  });

export const listExchanges = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.store_id || identity.role === "customer") {
    throw new Error("Não autorizado");
  }

  const { data: exchanges, error } = await supabase
    .from("exchanges")
    .select(
      "id, status, reason, requested_at, orders(public_token, total_cents), profiles!exchanges_customer_id_fkey(full_name)",
    )
    .eq("store_id", identity.store_id)
    .order("requested_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar trocas");

  return exchanges.map((ex: any) => ({
    id: ex.id,
    status: ex.status,
    reason: ex.reason,
    requestedAt: ex.requested_at,
    orderToken: ex.orders?.public_token,
    orderTotal: ex.orders?.total_cents,
    customerName: ex.profiles?.full_name || "Cliente sem nome",
  }));
});

export const updateExchangeStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      exchangeId: z.string().uuid(),
      status: z.enum(["requested", "approved", "received", "rejected", "refunded"]),
      refundCents: z.number().int().optional(),
    }),
  )
  .handler(async ({ data: { exchangeId, status, refundCents } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.store_id || identity.role === "customer") {
      throw new Error("Não autorizado");
    }

    const updates: any = { status };
    if (refundCents !== undefined) {
      updates.refund_amount_cents = refundCents;
    }

    if (["rejected", "refunded", "received"].includes(status)) {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: exchange, error } = await supabase
      .from("exchanges")
      .update(updates)
      .eq("id", exchangeId)
      .eq("store_id", identity.store_id)
      .select("order_id")
      .single();

    if (error || !exchange) throw new Error("Erro ao atualizar status");

    // Side-effects
    if (status === "received") {
      // 1. Revert stock via adjust_stock(exchange_in)
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", exchange.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc("adjust_stock", {
            p_variant_id: item.variant_id,
            p_qty: item.quantity,
            p_movement_type: "exchange_in",
            p_note: `Troca/Devolução #${exchangeId.split("-")[0]}`,
            p_reference_type: "exchange",
            p_reference_id: exchangeId,
          });
        }
      }
    }

    if (status === "refunded") {
      // 2. Add cash register entry (outflow)
      const { data: activeRegister } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("store_id", identity.store_id)
        .eq("status", "open")
        .limit(1)
        .maybeSingle();

      if (activeRegister && refundCents) {
        await supabase.from("cash_register_entries").insert({
          register_id: activeRegister.id,
          amount_cents: refundCents,
          type: "out",
          method: "other",
          description: `Estorno Devolução #${exchangeId.split("-")[0]}`,
          reference_type: "exchange",
          reference_id: exchangeId,
          actor_id: identity.id,
        });
      }

      // Update order status to refunded
      await supabase.from("orders").update({ status: "refunded" }).eq("id", exchange.order_id);
    }

    return { status: "success" };
  });
