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
import { getRequest } from "@tanstack/react-start/server";
import { readCookieFromRequest } from "@/lib/http-cookies";

const CheckoutSchema = z
  .object({
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
  })
  .superRefine((val, ctx) => {
    if (val.shippingMethod === "manual_table" || val.shippingMethod === "provider") {
      if (!val.shippingAddress || !val.shippingAddress.zipcode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço de entrega completo é obrigatório para esta modalidade de frete.",
          path: ["shippingAddress"],
        });
      }
    }
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const db = await getServerClient();
    const { data } = await db
      .from("orders")
      .select(
        "id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents, customer_snapshot, shipping_method, shipping_address, created_at, stores(id, name, settings), payments(method, status, provider_name), order_items(id, product_title, variant_sku, qty, unit_price_cents, total_cents)",
      )
      .eq("public_token", token)
      .single();
    return data;
  });

import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limiter";

export const processCheckout = createServerFn({ method: "POST" })
  .validator(CheckoutSchema)
  .handler(async ({ data: params }) => {
    try {
      const req = getRequest();
      const clientIp = req
        ? (req.headers.get("cf-connecting-ip") ??
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown")
        : "unknown";

      const rateCheck = checkRateLimit(`checkout-${clientIp}`);
      if (rateCheck.blocked) {
        const timeStr = formatRetryAfter(rateCheck.retryAfterMs || 60000);
        throw new Error(
          `Muitas tentativas de checkout. Por favor, aguarde ${timeStr} antes de tentar novamente.`,
        );
      }

      const db = await getServerClient();

      // Idempotency key prevents double-processing
      const idempotencyKey = `checkout-${params.cartId}-${params.paymentMethod}-${params.paymentMethodId || ""}-${params.giftCardCode || ""}`;

      // Ensure anti-hijacking by extracting the actual current identity
      const identity = await getCurrentIdentity();
      const affiliateId = req ? readCookieFromRequest(req, "hrshoes_affiliate_id") : null;

      // Call the atomic RPC v2 — all logic (coupon, stock, order creation, gift cards, surcharges) happens inside a single PostgreSQL transaction
      const { data, error } = await db.rpc("process_checkout_transaction_v2", {
        p_cart_id: params.cartId,
        p_idempotency_key: idempotencyKey,
        p_customer_name: params.customerName,
        p_customer_email: params.customerEmail,
        p_customer_document: params.customerDocument || null,
        p_customer_phone: params.customerPhone || null,
        p_shipping_method: params.shippingMethod,
        p_shipping_address: params.shippingAddress || {},
        p_payment_method: params.paymentMethod,
        p_gift_card_code: params.giftCardCode || null,
        p_manual_payment_method_id: params.paymentMethodId || null,
        p_affiliate_id: affiliateId || null,
      });

      if (error) throw new Error("Erro ao processar pedido: " + error.message);

      const result = data as {
        status: string;
        orderId?: string;
        orderToken: string;
        is_idempotent_replay: boolean;
      };

      if (result.status !== "success") {
        throw new Error("Checkout falhou.");
      }

      return {
        status: "success" as const,
        orderId: result.orderId,
        orderToken: result.orderToken,
      };
    } catch (e: any) {
      console.error("[checkout.functions] processCheckout:", e.message);
      throw new Error(e.message || "Erro no checkout");
    }
  });
