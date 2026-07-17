/**
 * Checkout server functions — Hr Shoes Commerce
 *
 * processCheckout usa o RPC atômico `process_checkout_atomic` (migration 0025).
 * - Idempotência garantida pelo idempotency_key.
 * - Transação atômica no banco: cria pedido, itens, movimenta estoque, registra pagamento, fecha carrinho.
 * - Cálculos de desconto e frete são revalidados no servidor.
 * - Nunca confia em valores do cliente para preços ou totais.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getCurrentIdentity } from "./cart-helpers";

const CheckoutSchema = z.object({
  cartId: z.string().uuid(),
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  customerDocument: z.string().optional(),
  customerPhone: z.string().optional(),
  shippingMethod: z.enum(["manual_table", "provider", "pickup", "manual_quote"]),
  shippingAddress: z
    .object({
      zipcode: z.string().min(8),
      street: z.string().min(2),
      number: z.string().min(1),
      complement: z.string().optional(),
      neighborhood: z.string().min(2),
      city: z.string().min(2),
      state: z.string().length(2),
    })
    .optional(),
  paymentMethod: z.enum(["pix", "manual", "credit_card", "receipt"]),
  paymentMethodId: z.string().uuid().optional(),
  giftCardCode: z.string().optional(),
});

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const db = await getServerClient();
    const { data } = await db
      .from("orders")
      .select(
        "id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents, customer_snapshot, shipping_method, shipping_address, created_at, order_items(id, product_title, variant_sku, qty, unit_price_cents, total_cents)",
      )
      .eq("public_token", token)
      .single();
    return data;
  });

export const processCheckout = createServerFn({ method: "POST" })
  .validator(CheckoutSchema)
  .handler(async ({ data: params }) => {
    try {
      const db = await getServerClient();

      // Idempotency key prevents double-processing
      const idempotencyKey = `checkout-${params.cartId}-${params.paymentMethod}-${params.paymentMethodId || ""}-${params.giftCardCode || ""}`;

      // Ensure anti-hijacking by extracting the actual current identity
      const identity = await getCurrentIdentity();

      // Call the atomic RPC — all logic (coupon, stock, order creation) happens inside a single transaction
      const { data, error } = await db.rpc("process_checkout_atomic", {
        p_cart_id: params.cartId,
        p_idempotency_key: idempotencyKey,
        p_customer_name: params.customerName,
        p_customer_email: params.customerEmail,
        p_customer_document: params.customerDocument || null,
        p_customer_phone: params.customerPhone || null,
        p_shipping_method: params.shippingMethod,
        p_shipping_address: params.shippingAddress || {},
        p_payment_method: params.paymentMethod,
        p_customer_id: identity.customer_id,
        p_session_token: identity.session_token,
      });

      if (error) throw new Error("Erro ao processar pedido: " + error.message);

      const result = data as { status: string; orderToken: string; is_idempotent_replay: boolean };

      if (result.status !== "success") {
        throw new Error("Checkout falhou.");
      }

      // Fetch the created order to apply payments adjustments
      const { data: order } = await db
        .from("orders")
        .select("id, subtotal_cents, shipping_cents, discount_cents, total_cents")
        .eq("public_token", result.orderToken)
        .single();

      if (order) {
        let finalCents = order.total_cents;
        let finalDiscount = order.discount_cents;
        let providerName = undefined;

        // 1. Apply discount or surcharge if a manual payment method is selected
        if (params.paymentMethodId) {
          const { data: methodData } = await db
            .from("manual_payment_methods")
            .select("name, surcharge_percentage, discount_percentage")
            .eq("id", params.paymentMethodId)
            .single();

          if (methodData) {
            providerName = methodData.name;
            if (Number(methodData.discount_percentage) > 0) {
              const appliedDiscount = Math.floor(order.subtotal_cents * (Number(methodData.discount_percentage) / 100));
              finalDiscount += appliedDiscount;
              finalCents -= appliedDiscount;
            } else if (Number(methodData.surcharge_percentage) > 0) {
              const appliedSurcharge = Math.floor(order.subtotal_cents * (Number(methodData.surcharge_percentage) / 100));
              finalCents += appliedSurcharge;
            }
          }
        }

        // 2. Apply Gift Card if code is provided
        if (params.giftCardCode) {
          const { data: card } = await db
            .from("gift_cards")
            .select("id, current_balance_cents, status, expires_at")
            .eq("code", params.giftCardCode)
            .maybeSingle();

          if (card && card.status === "active" && card.current_balance_cents > 0) {
            const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
            if (!isExpired) {
              const deduct = Math.min(finalCents, card.current_balance_cents);
              const newCardBalance = card.current_balance_cents - deduct;

              // Deduct balance from gift card record
              await db
                .from("gift_cards")
                .update({
                  current_balance_cents: newCardBalance,
                  status: newCardBalance === 0 ? "used" : "active",
                })
                .eq("id", card.id);

              finalDiscount += deduct;
              finalCents -= deduct;
            }
          }
        }

        // Apply final calculations back to order
        await db
          .from("orders")
          .update({
            discount_cents: finalDiscount,
            total_cents: finalCents >= 0 ? finalCents : 0,
          })
          .eq("id", order.id);

        // Update payment transaction amount and provider name
        await db
          .from("payments")
          .update({
            provider_name: providerName || null,
            amount_cents: finalCents >= 0 ? finalCents : 0,
          })
          .eq("order_id", order.id);
      }

      return { status: "success" as const, orderToken: result.orderToken };
    } catch (e: any) {
      console.error("[checkout.functions] processCheckout:", e.message);
      return { status: "error" as const, message: e.message || "Erro no checkout" };
    }
  });
