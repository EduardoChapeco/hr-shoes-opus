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

    const { error } = await supabase
      .from("exchanges")
      .update(updates)
      .eq("id", exchangeId)
      .eq("store_id", identity.store_id);

    if (error) throw new Error("Erro ao atualizar status");

    return { status: "success" };
  });
