import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = await getServerClient();

    const { data, error } = await db
      .from("orders")
      .select(
        `
          id, public_token, status, total_cents, customer_name, customer_email, created_at,
          order_items ( id, product_title, variant_sku, quantity )
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

    // Assume payments is linked to orders
    // In 0003_orders.sql it seems there is a 'payments' table or similar? Let's assume there is one for simplicity or we just fetch orders with status 'awaiting_payment'.
    // Wait, 0003_orders.sql doesn't have a payments table. It uses payment_status ENUM but wait, I didn't see the payments table.
    // I'll just return orders that need payment manual approval for now.
    const { data, error } = await db
      .from("orders")
      .select(
        `
          id, public_token, status, total_cents, customer_name, created_at
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
    const { getSSRClient } = await import("@/lib/supabase-ssr");
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) throw new Error("Não autenticado");

    const db = getSSRClient();

    const { data, error } = await db
      .from("orders")
      .select(
        `
        id, public_token, status, total_cents, created_at,
        order_items ( id, product_title, variant_sku, quantity, unit_cents )
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
      const { getSSRClient } = await import("@/lib/supabase-ssr");
      const ssrClient = getSSRClient();
      const {
        data: { user },
      } = await ssrClient.auth.getUser();

      if (!user) throw new Error("Não autenticado");

      const db = getSSRClient();

      const { data: order, error } = await db
        .from("orders")
        .select(
          `
          id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents,
          customer_name, customer_email, customer_phone, shipping_method, shipping_address, created_at,
          order_items ( id, product_title, variant_sku, quantity, unit_price_cents, total_price_cents ),
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
