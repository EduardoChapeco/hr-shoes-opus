/**
 * Checkout server functions — Hr Shoes Commerce
 *
 * Handles the conversion of a Cart to an Order.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";
import { getCart } from "./cart.functions";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CheckoutShippingSchema = z.object({
  zipcode: z.string().min(8, "CEP inválido"),
});

const CreateOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipcode: z.string().min(8),
  }),
  shippingOptionId: z.string().uuid(),
  paymentMethod: z.enum(["credit_card", "pix", "boleto"]),
});

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export const calculateShipping = createServerFn({ method: "POST" })
  .validator(CheckoutShippingSchema)
  .handler(async ({ data: { zipcode } }) => {
    const supabase = getServerClient();

    // Fetch active shipping options from canonical source
    const { data: options, error } = await supabase
      .from("shipping_options")
      .select("id, name, price_cents, min_days, max_days")
      .eq("active", true)
      .order("price_cents", { ascending: true });

    if (error || !options) {
      return { options: [] };
    }

    // Map to the expected DTO
    return {
      options: options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        priceCents: opt.price_cents,
        days: opt.max_days, // simplifying to max_days for display
      })),
    };
  });

export const createOrder = createServerFn({ method: "POST" })
  .validator(CreateOrderSchema)
  .handler(async ({ data: { shippingAddress, shippingOptionId, paymentMethod } }) => {
    const supabase = getServerClient();

    // 1. Get the current cart
    const cart = await getCart();
    if (!cart || cart.items.length === 0) {
      throw new Error("Carrinho vazio ou não encontrado.");
    }

    // 2. Identify the customer
    const ssrClient = getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    const customerId = user ? user.id : null;

    // Fetch the store ID properly
    const { data: store } = await supabase.from("stores").select("id").limit(1).single();
    if (!store) throw new Error("Loja não encontrada.");

    // 3. Verify shipping option
    const { data: shippingOption } = await supabase
      .from("shipping_options")
      .select("price_cents, name")
      .eq("id", shippingOptionId)
      .eq("active", true)
      .single();

    if (!shippingOption) {
      throw new Error("Opção de frete inválida ou indisponível.");
    }

    // Order totals
    const shippingCents = shippingOption.price_cents;
    const itemsTotalCents = cart.subtotalCents;
    const totalCents = itemsTotalCents + shippingCents;

    // 4. Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        customer_id: customerId,
        status: "awaiting_payment", // Initial status
        items_snapshot: cart.items, // JSONB snapshot
        subtotal_cents: itemsTotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        shipping_method: "delivery", // Standardizing for now
        shipping_address: shippingAddress,
      })
      .select("id, public_token")
      .single();

    if (orderError || !order) {
      throw new Error("Falha ao criar o pedido. Tente novamente.");
    }

    // 4. Insert order items (Using correct mapping: qty, price_snapshot_cents)
    const orderItems = cart.items.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      qty: item.qty,
      price_snapshot_cents: item.priceCents,
      product_title: item.productTitle,
      variant_sku: item.variantSku,
      variant_attributes: item.variantAttributes,
      image_url: item.coverUrl,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items error", itemsError);
      // Should Ideally rollback the order, but we lack full backend transactions here.
      throw new Error("Falha ao registrar itens do pedido.");
    }

    // 5. Update stock reservations to link to order
    // They are currently linked to the cart. We transfer them to the order.
    await supabase
      .from("stock_reservations")
      .update({ order_id: order.id, cart_id: null })
      .eq("cart_id", cart.id);

    // 6. Create payment intent
    await supabase.from("payments").insert({
      order_id: order.id,
      amount_cents: totalCents,
      method: paymentMethod,
      status: "pending",
      idempotency_key: crypto.randomUUID(), // Ensures we don't double charge if retried
    });

    // 7. Mark cart as completed
    await supabase.from("carts").update({ status: "completed" }).eq("id", cart.id);

    return {
      status: "success" as const,
      orderToken: order.public_token,
      orderId: order.id,
    };
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const supabase = getServerClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, public_token, items_snapshot")
      .eq("public_token", token)
      .single();

    if (!order) return null;
    return order;
  });
