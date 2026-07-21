import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";

// ---------------------------------------------------------------------------
// Order status enum (shared between validator and domain logic)
// ---------------------------------------------------------------------------

export const ORDER_STATUS_VALUES = [
  "draft",
  "awaiting_shipping_quote",
  "awaiting_payment",
  "payment_processing",
  "paid",
  "processing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "payment_failed",
  "return_requested",
  "returned",
  "refunded",
] as const;

// ---------------------------------------------------------------------------
// Handlers (decoupled for unit testing)
// ---------------------------------------------------------------------------

export async function listOrdersHandler() {
  const db = getServerClient();

  const { data, error } = await db
    .from("orders")
    .select(
      `
        id, public_token, status, total_cents, customer_snapshot, created_at, shipping_method,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOrderByIdHandler(orderId: string) {
  const db = getServerClient();

  const { data, error } = await db
    .from("orders")
    .select(
      `
      id, public_token, status, total_cents, subtotal_cents, shipping_cents,
      customer_snapshot, created_at, shipping_method, shipping_address,
      order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents )
    `,
    )
    .eq("id", orderId)
    .single();

  if (error) throw new Error("Pedido não encontrado");
  return data;
}

export async function updateOrderStatusHandler(
  orderId: string,
  status: (typeof ORDER_STATUS_VALUES)[number],
) {
  const db = getServerClient();

  if (status === "cancelled") {
    // Phase 4: Atomic cancellation with stock and commission reversals
    const { error: rpcError } = await db.rpc("cancel_order", {
      p_order_id: orderId,
      p_reason: "Cancelado pelo administrador.",
    });

    if (rpcError) {
      throw new Error("Erro ao cancelar o pedido: " + rpcError.message);
    }

    return { status: "ok" as const, message: "Pedido cancelado com sucesso." };
  }

  const { error } = await db.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
  return { status: "ok" as const, message: "Status do pedido atualizado." };
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await listOrdersHandler();
    return { status: "ok" as const, data };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[order.functions] listOrders:", e.message);
    return { status: "error" as const, message: "Erro ao buscar pedidos." };
  }
});

export const getOrderById = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const data = await getOrderByIdHandler(orderId);
      return { status: "ok" as const, data };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[order.functions] getOrderById:", e.message);
      return { status: "error" as const, message: e.message || "Pedido não encontrado." };
    }
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(ORDER_STATUS_VALUES),
    }),
  )
  .handler(async ({ data: params }) => {
    try {
      return await updateOrderStatusHandler(params.orderId, params.status);
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      console.error("[order.functions] updateOrderStatus:", e.message);
      return { status: "error" as const, message: "Erro ao atualizar pedido." };
    }
  });

export const listPayments = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getServerClient();

    const { data, error } = await db
      .from("orders")
      .select(
        `
          id, public_token, status, total_cents, customer_snapshot, created_at
        `,
      )
      .in("status", ["awaiting_payment", "payment_processing", "paid"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { status: "ok" as const, data: data || [] };
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
    console.error("[order.functions] listPayments:", e.message);
    return { status: "error" as const, message: "Erro ao buscar pagamentos." };
  }
});

// ---------------------------------------------------------------------------
// Customer-facing: fetch orders for the logged-in customer
// ---------------------------------------------------------------------------

export const listCustomerOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) throw new Error("Não autenticado");

    const { data, error } = await ssrClient
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, created_at,
        order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents )
      `,
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { status: "ok" as const, data: data || [] };
  } catch (e: any) {
    console.error("[order.functions] listCustomerOrders:", e.message);
    return { status: "error" as const, message: "Erro ao buscar seus pedidos." };
  }
});

export const getCustomerOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();

      if (!user) throw new Error("Não autenticado");

      const { data: order, error } = await ssrClient
        .from("orders")
        .select(
          `
          id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
          customer_snapshot, shipping_method, shipping_address, created_at,
          order_items ( id, product_title, variant_sku, qty, unit_price_cents, total_cents ),
          payments ( id, method, status, amount_cents, receipt_url, receipt_status )
        `,
        )
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (error) throw error;

      return { status: "ok" as const, data: order };
    } catch (e: any) {
      console.error("[order.functions] getCustomerOrder:", e.message);
      return {
        status: "error" as const,
        message: e.message || "Erro ao buscar detalhes do pedido.",
      };
    }
  });

export const listOrdersAwaitingShippingQuote = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = getServerClient();
      const { data, error } = await db
        .from("orders")
        .select(
          `
            id, public_token, status, subtotal_cents, discount_cents, total_cents,
            customer_snapshot, shipping_address, created_at, shipping_method
          `,
        )
        .eq("status", "awaiting_shipping_quote")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { status: "ok" as const, data: data || [] };
    } catch (e: any) {
      console.error("[order.functions] listOrdersAwaitingShippingQuote error:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao buscar solicitações de frete.",
      };
    }
  },
);

export const updateOrderShippingQuote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      shippingCents: z.number().int().min(0),
    }),
  )
  .handler(async ({ data: { orderId, shippingCents } }) => {
    try {
      const db = getServerClient();

      // Load current order
      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, subtotal_cents, discount_cents")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // Recalculate total
      const newTotal = order.subtotal_cents + shippingCents - order.discount_cents;

      // Update order status to awaiting_payment, set shipping_cents and total_cents
      const { error: updateError } = await db
        .from("orders")
        .update({
          shipping_cents: shippingCents,
          total_cents: newTotal >= 0 ? newTotal : 0,
          status: "awaiting_payment",
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Update associated payment amount
      const { error: payError } = await db
        .from("payments")
        .update({
          amount_cents: newTotal >= 0 ? newTotal : 0,
        })
        .eq("order_id", orderId);

      if (payError) throw payError;

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[order.functions] updateOrderShippingQuote error:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao atualizar frete do pedido.",
      };
    }
  });

// ---------------------------------------------------------------------------
// Customer-facing: get payment instructions (PIX key, instructions) for order
// Tenant-safe: reads store_id from the order, then fetches store config via
// service role. Customers cannot read the stores table directly via RLS.
// ---------------------------------------------------------------------------

export const getOrderPaymentInstructions = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const db = getServerClient();

      // Verify ownership via SSR client (RLS enforces customer_id = user.id)
      const { data: order, error: orderError } = await ssrClient
        .from("orders")
        .select("id, store_id")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) throw new Error("Pedido não encontrado");

      // Fetch store payment config via service role (stores table not exposed to customer RLS)
      const { data: store } = await db
        .from("stores")
        .select("pix_key, payment_instructions")
        .eq("id", order.store_id)
        .single();

      return {
        status: "ok" as const,
        data: {
          pix_key: store?.pix_key ?? null,
          payment_instructions: store?.payment_instructions ?? null,
        },
      };
    } catch (e: any) {
      console.error("[order.functions] getOrderPaymentInstructions:", e);
      return {
        status: "error" as const,
        message: e.message || "Erro ao buscar instruções de pagamento.",
      };
    }
  });
export const requestOrderReturn = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), reason: z.string().min(5, "Motivo muito curto") }))
  .handler(async ({ data: { orderId, reason } }) => {
    try {
      const ssrClient = getSSRClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Verify ownership and status
      const { data: order, error: orderError } = await ssrClient
        .from("orders")
        .select("id, status, store_id")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();
        
      if (orderError || !order) throw new Error("Pedido não encontrado");
      if (order.status !== "delivered") throw new Error("Apenas pedidos entregues podem ser devolvidos/trocados.");

      const db = getServerClient();
      const { error: updateError } = await db
        .from("orders")
        .update({ status: "return_requested" })
        .eq("id", orderId);
        
      if (updateError) throw updateError;
      
      // Optionally create a note for the admin
      await db.from("customer_notes").insert({
        store_id: order.store_id,
        customer_id: user.id,
        content: "Solicitação de Devolução/Troca (Pedido: " + orderId + ") - Motivo: " + reason
      });

      return { status: "success" as const };
    } catch (e: any) {
      console.error("[order.functions] requestOrderReturn:", e);
      return { status: "error" as const, message: e.message || "Erro ao solicitar devolução." };
    }
  });

