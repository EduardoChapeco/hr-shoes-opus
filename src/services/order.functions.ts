import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = await getServerClient();

    // customer_name/email stored in customer_snapshot JSONB (migration 0025).
    // order_items uses qty (not quantity) and total_cents (not total_price_cents).
    const { data, error } = await db
      .from("orders")
      .select(
        `
          id, public_token, status, total_cents, customer_snapshot, created_at,
          order_items ( id, product_title, variant_sku, qty )
        `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { status: "ok", data: data || [] };
  } catch (e: any) {
    console.error("[order.functions] listOrders:", e.message);
    return { status: "error", message: "Erro ao buscar pedidos." };
  }
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      status: z.enum([
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
      ]),
    }),
  )
  .handler(async ({ data: params }) => {
    try {
      const db = await getServerClient();

      const { error } = await db
        .from("orders")
        .update({ status: params.status })
        .eq("id", params.orderId);

      if (error) throw error;

      return { status: "ok", message: "Status do pedido atualizado." };
    } catch (e: any) {
      console.error("[order.functions] updateOrderStatus:", e.message);
      return { status: "error", message: "Erro ao atualizar pedido." };
    }
  });

export const listPayments = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = await getServerClient();

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

    return { status: "ok", data: data || [] };
  } catch (e: any) {
    console.error("[order.functions] listPayments:", e.message);
    return { status: "error", message: "Erro ao buscar pagamentos." };
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
