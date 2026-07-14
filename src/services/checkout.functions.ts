import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCart } from "./cart.functions";

const CheckoutSchema = z.object({
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  customerDocument: z.string().optional(),
  customerPhone: z.string().optional(),
  shippingMethod: z.enum(["delivery", "pickup", "manual_quote"]),
  shippingAddress: z.any().optional(),
  paymentMethod: z.enum(["pix", "manual", "credit_card", "boleto"]),
});

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const db = await getServerClient();
    const { data } = await db.from("orders").select("*").eq("public_token", token).single();
    return data;
  });

export const processCheckout = createServerFn({ method: "POST" })
  .validator(CheckoutSchema)
  .handler(async ({ data: params }) => {
    try {
      const db = await getServerClient();
      
      // 1. Get the current cart
      const cart = await getCart();
      if (!cart || cart.items.length === 0) {
        throw new Error("Carrinho vazio ou expirado");
      }
      
      // 2. Fetch the store
      const { data: store } = await db.from("stores").select("id").limit(1).single();
      if (!store) throw new Error("Loja não configurada");

      // 3. Create Order
      const totalCents = cart.subtotalCents + cart.shippingCents - cart.discountCents;
      
      // 4. Start RPC / Transaction to safely move from cart to order
      // Supabase has an RPC for this, or we just insert it (since we are admin)
      const { data: order, error: orderError } = await db
        .from("orders")
        .insert({
          store_id: store.id,
          status: "awaiting_payment", // Initial state
          total_cents: totalCents,
          subtotal_cents: cart.subtotalCents,
          shipping_cents: cart.shippingCents,
          discount_cents: cart.discountCents,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_document: params.customerDocument || null,
          customer_phone: params.customerPhone || null,
          shipping_method: params.shippingMethod,
          shipping_address: params.shippingAddress || {},
        })
        .select("id, public_token")
        .single();
        
      if (orderError || !order) throw new Error("Erro ao criar pedido: " + orderError?.message);

      // 5. Move Cart Items to Order Items and Reserve Stock permanently
      for (const item of cart.items) {
        // Create order item
        await db.from("order_items").insert({
          order_id: order.id,
          variant_id: item.variantId,
          product_title: item.productTitle,
          variant_sku: item.variantSku,
          quantity: item.qty,
          unit_price_cents: item.priceCents,
          total_price_cents: item.lineTotalCents,
        });

        // Delete temporary reservation
        await db.from("stock_reservations")
          .delete()
          .eq("cart_id", cart.id)
          .eq("variant_id", item.variantId);

        // Deduct from stock (permanent sale)
        // Adjust stock will insert movement and update counters
        await db.rpc("adjust_stock", {
          p_variant_id: item.variantId,
          p_qty: item.qty,
          p_movement_type: "sale",
          p_note: `Pedido #${order.public_token}`,
          p_reference_type: "order",
          p_reference_id: order.id
        });
      }

      // 6. Create Payment record
      await db.from("payments").insert({
        order_id: order.id,
        store_id: store.id,
        amount_cents: totalCents,
        method: params.paymentMethod,
        status: "pending",
        provider: "manual"
      });

      // 7. Clear Cart
      await db.from("cart_items").delete().eq("cart_id", cart.id);
      await db.from("carts").update({ status: "completed" }).eq("id", cart.id);

      return { status: "success", orderToken: order.public_token };
    } catch (e: any) {
      console.error("[checkout.functions] processCheckout:", e.message);
      return { status: "error", message: e.message || "Erro no checkout" };
    }
  });
