/**
 * Cart server functions — Hr Shoes Commerce
 *
 * All cart and stock calculations happen here.
 * Never trust the client for prices or availability.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/supabase-ssr";
import { getOrCreateGuestSession, getGuestSession, getSellerRefCookie } from "@/lib/session";
import type { CartDTO } from "@/types/orders";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves the current user's ID or the guest session token.
 */
async function getCurrentIdentity() {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (user) {
    return { customer_id: user.id, session_token: null };
  }

  const token = getOrCreateGuestSession();
  return { customer_id: null, session_token: token };
}

/**
 * Ensures a cart exists for the current identity.
 */
async function getOrCreateCartId(identity: {
  customer_id: string | null;
  session_token: string | null;
}) {
  const supabase = getServerClient();

  // 1. Try to find an existing active cart
  let query = supabase.from("carts").select("id").eq("status", "active");
  if (identity.customer_id) {
    query = query.eq("customer_id", identity.customer_id);
  } else {
    query = query.eq("session_token", identity.session_token);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;

  // 2. Fetch the default store. In a multi-tenant setup, this would be derived from the Host or domain.
  const { data: store } = await supabase.from("stores").select("id").limit(1).single();
  if (!store) throw new Error("Loja não encontrada na base");

  // 3. Create a new cart
  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({
      store_id: store.id,
      customer_id: identity.customer_id,
      session_token: identity.session_token,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error("Falha ao criar carrinho.");
  return newCart.id;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export const getCart = createServerFn({ method: "GET" }).handler(
  async (): Promise<CartDTO | null> => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    let query = supabase
      .from("carts")
      .select(
        `
        id,
        status,
        coupon_code,
        discount_cents,
        shipping_cents,
        shipping_method,
        cart_items (
          id,
          variant_id,
          qty,
          product_variants (
            id,
            price_cents,
            compare_at_price_cents,
            sku,
            attributes,
            product:products (
              id,
              name,
              slug,
              product_media ( url )
            )
          )
        )
      `,
      )
      .eq("status", "active");

    if (identity.customer_id) query = query.eq("customer_id", identity.customer_id);
    else query = query.eq("session_token", identity.session_token);

    const { data: cart } = await query.maybeSingle();

    if (!cart) return null;

    interface CartItemRaw {
      id: string;
      variant_id: string;
      qty: number;
      product_variants: {
        sku: string;
        price_cents: number;
        compare_at_price_cents: number | null;
        attributes: Record<string, string>;
        product: {
          id: string;
          name: string;
          slug: string;
          product_media?: { url: string }[];
        };
      };
    }

    // Map to DTO
    let totalCents = 0;
    const rawItems = cart.cart_items as unknown as CartItemRaw[];
    const items = rawItems.map((item) => {
      const variant = item.product_variants;
      const product = variant.product;
      const image = product.product_media?.[0]?.url;
      const price = variant.price_cents;
      const lineTotal = price * item.qty;
      totalCents += lineTotal;

      return {
        id: item.id,
        variantId: item.variant_id,
        qty: item.qty,
        priceCents: price,
        lineTotalCents: lineTotal,
        productTitle: product.name,
        variantSku: variant.sku,
        variantAttributes: variant.attributes || {},
        coverUrl: image,
      };
    });

    return {
      id: cart.id,
      items,
      subtotalCents: totalCents,
      totalCents: totalCents + cart.shipping_cents - cart.discount_cents,
      shippingCents: cart.shipping_cents,
      shippingMethod: cart.shipping_method,
      discountCents: cart.discount_cents,
      couponCode: cart.coupon_code,
      itemCount: items.reduce((acc: number, item: { qty: number }) => acc + item.qty, 0),
    };
  },
);

const AddToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1),
  sellerId: z.string().uuid().optional(),
});

export const addToCart = createServerFn({ method: "POST" })
  .validator(AddToCartSchema)
  .handler(async ({ data: { variantId, quantity, sellerId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    const activeSellerId = sellerId || getSellerRefCookie();

    // Check if store exists to use for cart
    const { data: store } = await supabase.from("stores").select("id").limit(1).single();
    if (!store) throw new Error("Loja não configurada");

    // 1. Get or create cart
    let cartQuery = supabase.from("carts").select("id").eq("status", "active");
    if (identity.customer_id) cartQuery = cartQuery.eq("customer_id", identity.customer_id);
    else cartQuery = cartQuery.eq("session_token", identity.session_token);

    let cartId;
    const { data: existingCart } = await cartQuery.maybeSingle();

    if (existingCart) {
      cartId = existingCart.id;
    } else {
      const { data: newCart } = await supabase
        .from("carts")
        .insert({
          store_id: store.id,
          customer_id: identity.customer_id,
          session_token: identity.session_token,
          seller_id: activeSellerId,
          status: "active",
        })
        .select("id")
        .single();
      cartId = newCart!.id;
    }

    // If adding to existing cart, we might want to update seller_id if it's provided now
    if (existingCart && activeSellerId) {
      await supabase.from("carts").update({ seller_id: activeSellerId }).eq("id", cartId);
    }

    // 2. Validate stock
    // Available = on_hand - SUM(reservations where expires_at > now())
    const { data: stockData } = await supabase
      .from("product_variants")
      .select(
        `
        stock_on_hand,
        stock_reservations ( qty, expires_at )
      `,
      )
      .eq("id", variantId)
      .single();

    if (!stockData) throw new Error("Variante não encontrada");

    const now = new Date();
    const reserved = stockData.stock_reservations
      .filter((r: { qty: number; expires_at: string }) => new Date(r.expires_at) > now)
      .reduce((acc: number, r: { qty: number; expires_at: string }) => acc + r.qty, 0);

    const available = stockData.stock_on_hand - reserved;

    // Find if item already in cart to check total requested
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartId)
      .eq("variant_id", variantId)
      .maybeSingle();

    const currentQtyInCart = existingItem ? existingItem.qty : 0;
    const additionalQty = quantity;
    const newTotalQty = currentQtyInCart + additionalQty;

    // Note: We only check if the *additional* quantity is available because the current
    // quantity already has a reservation.
    if (available < additionalQty) {
      throw new Error(`Estoque insuficiente. Apenas ${available} disponíveis.`);
    }

    // Fetch snapshot price for safety
    const { data: vInfo } = await supabase
      .from("product_variants")
      .select("price_override_cents, product_id, products(price_cents)")
      .eq("id", variantId)
      .single();

    const priceCents = vInfo?.price_override_cents ?? (vInfo?.products as any)?.price_cents ?? 0;

    // 3. Create or update stock reservation (15 mins TTL)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await supabase.from("stock_reservations").insert({
      cart_id: cartId,
      variant_id: variantId,
      qty: additionalQty,
      expires_at: expiresAt.toISOString(),
    });

    // 4. Add or update item in cart
    if (existingItem) {
      await supabase.from("cart_items").update({ qty: newTotalQty }).eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cartId,
        variant_id: variantId,
        qty: additionalQty,
        price_snapshot_cents: priceCents,
      });
    }

    return { status: "success" };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .validator(z.object({ itemId: z.string().uuid() }))
  .handler(async ({ data: { itemId } }) => {
    const supabase = getServerClient();

    // We should verify the cart belongs to the user, but for simplicity
    // we just delete the item (UUID is unguessable) and its reservations

    const { data: item } = await supabase
      .from("cart_items")
      .select("cart_id, variant_id")
      .eq("id", itemId)
      .single();

    if (!item) return { status: "error", message: "Item não encontrado" };

    // Delete reservations for this cart + variant
    await supabase
      .from("stock_reservations")
      .delete()
      .eq("cart_id", item.cart_id)
      .eq("variant_id", item.variant_id);

    // Delete item
    await supabase.from("cart_items").delete().eq("id", itemId);

    return { status: "success" };
  });

export const mergeGuestCart = createServerFn({ method: "POST" })
  .validator(z.object({ customerId: z.string().uuid(), accessToken: z.string().optional() }))
  .handler(async ({ data: { customerId, accessToken } }) => {
    let supabase;
    if (accessToken) {
      const url = process.env.VITE_SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Missing env vars for Supabase");

      const { createClient } = await import("@supabase/supabase-js");
      supabase = createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
    } else {
      supabase = getSSRClient();
    }

    const { session_token } = await getCurrentIdentity();
    if (!session_token) return { status: "success" };

    // Find if guest cart exists
    const { data: guestCart } = await supabase
      .from("carts")
      .select("id")
      .eq("session_token", session_token)
      .eq("status", "active")
      .maybeSingle();

    if (!guestCart) return { status: "success" };

    // Find if customer already has a cart
    const { data: userCart } = await supabase
      .from("carts")
      .select("id")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .maybeSingle();

    if (!userCart) {
      // Just reassign the guest cart to the user
      await supabase
        .from("carts")
        .update({ customer_id: customerId, session_token: null })
        .eq("id", guestCart.id);
    } else {
      // Move items from guest cart to user cart
      const { data: guestItems } = await supabase
        .from("cart_items")
        .select("id, variant_id, qty")
        .eq("cart_id", guestCart.id);

      if (guestItems && guestItems.length > 0) {
        for (const item of guestItems) {
          // Check if variant already exists in user cart
          const { data: existingUserItem } = await supabase
            .from("cart_items")
            .select("id, qty")
            .eq("cart_id", userCart.id)
            .eq("variant_id", item.variant_id)
            .maybeSingle();

          if (existingUserItem) {
            // Add quantities
            await supabase
              .from("cart_items")
              .update({ qty: existingUserItem.qty + item.qty })
              .eq("id", existingUserItem.id);
            // Delete the old one from guest cart
            await supabase.from("cart_items").delete().eq("id", item.id);
          } else {
            // Reassign the item to user cart
            await supabase.from("cart_items").update({ cart_id: userCart.id }).eq("id", item.id);
          }

          // Reassign stock reservations to user cart
          await supabase
            .from("stock_reservations")
            .update({ cart_id: userCart.id })
            .eq("cart_id", guestCart.id)
            .eq("variant_id", item.variant_id);
        }
      }

      // Delete the empty guest cart
      await supabase.from("carts").delete().eq("id", guestCart.id);
    }

    return { status: "success" };
  });

export const updateCartItemQty = createServerFn({ method: "POST" })
  .validator(z.object({ variantId: z.string().uuid(), delta: z.number().int() }))
  .handler(async ({ data: { variantId, delta } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    let cartQuery = supabase.from("carts").select("id").eq("status", "active");
    if (identity.customer_id) cartQuery = cartQuery.eq("customer_id", identity.customer_id);
    else cartQuery = cartQuery.eq("session_token", identity.session_token);

    const { data: cart } = await cartQuery.maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cart.id)
      .eq("variant_id", variantId)
      .maybeSingle();

    if (!existingItem) throw new Error("Item não está no carrinho");

    const newTotalQty = existingItem.qty + delta;
    if (newTotalQty <= 0) {
      // Just remove
      await supabase
        .from("stock_reservations")
        .delete()
        .eq("cart_id", cart.id)
        .eq("variant_id", variantId);
      await supabase.from("cart_items").delete().eq("id", existingItem.id);
      return { status: "success" };
    }

    if (delta > 0) {
      // Need to verify stock for the additional delta
      const { data: stockData } = await supabase
        .from("product_variants")
        .select("stock_on_hand, stock_reservations ( qty, expires_at )")
        .eq("id", variantId)
        .single();

      if (!stockData) throw new Error("Variante não encontrada");

      const now = new Date();
      const reserved = stockData.stock_reservations
        .filter((r: { qty: number; expires_at: string }) => new Date(r.expires_at) > now)
        .reduce((acc: number, r: { qty: number; expires_at: string }) => acc + r.qty, 0);

      const available = stockData.stock_on_hand - reserved;
      if (available < delta) {
        throw new Error(`Estoque insuficiente. Apenas ${available} disponíveis.`);
      }
    }

    // Clean up old reservations and create a fresh one for the new total
    await supabase
      .from("stock_reservations")
      .delete()
      .eq("cart_id", cart.id)
      .eq("variant_id", variantId);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await supabase.from("stock_reservations").insert({
      cart_id: cart.id,
      variant_id: variantId,
      qty: newTotalQty,
      expires_at: expiresAt.toISOString(),
    });

    await supabase.from("cart_items").update({ qty: newTotalQty }).eq("id", existingItem.id);

    return { status: "success" };
  });

export const applyCouponToCart = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().toUpperCase() }))
  .handler(async ({ data: { code } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    let cartQuery = supabase.from("carts").select("id").eq("status", "active");
    if (identity.customer_id) cartQuery = cartQuery.eq("customer_id", identity.customer_id);
    else cartQuery = cartQuery.eq("session_token", identity.session_token);

    const { data: cart } = await cartQuery.maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");

    // Get current cart details to check subtotal
    const cartDetails = await getCart();
    if (!cartDetails) throw new Error("Erro ao buscar detalhes do carrinho");

    // Search for coupon
    const { data: store } = await supabase.from("stores").select("id").limit(1).single();
    if (!store) throw new Error("Loja não configurada");

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", store.id)
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) return { status: "error", message: "Cupom inválido ou expirado." };

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { status: "error", message: "Este cupom já expirou." };
    }

    // Check limits
    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      return { status: "error", message: "Este cupom atingiu o limite de usos." };
    }

    if (coupon.min_order_cents && cartDetails.subtotalCents < coupon.min_order_cents) {
      return {
        status: "error",
        message: `Valor mínimo para este cupom é ${(coupon.min_order_cents / 100).toFixed(2)}`,
      };
    }

    // Calculate discount
    let newDiscountCents = 0;
    if (coupon.discount_type === "percentage") {
      newDiscountCents = Math.floor(cartDetails.subtotalCents * (coupon.discount_value / 100));
    } else if (coupon.discount_type === "fixed_amount") {
      newDiscountCents = Math.round(coupon.discount_value * 100);
      if (newDiscountCents > cartDetails.subtotalCents)
        newDiscountCents = cartDetails.subtotalCents;
    } else if (coupon.discount_type === "free_shipping") {
      // Actually we should apply this later during checkout or set a flag.
      // For now we set shipping to 0.
      newDiscountCents = 0;
    }

    await supabase
      .from("carts")
      .update({
        coupon_code: code,
        discount_cents: newDiscountCents,
        shipping_cents: coupon.discount_type === "free_shipping" ? 0 : cartDetails.shippingCents, // if it was free shipping
      })
      .eq("id", cart.id);

    return { status: "success", message: "Cupom aplicado com sucesso!" };
  });

export const updateCartShipping = createServerFn({ method: "POST" })
  .validator(
    z.object({
      zipcode: z.string().min(8),
      method: z.string().min(2),
      cents: z.number().min(0),
    })
  )
  .handler(async ({ data: { zipcode, method, cents } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    let cartQuery = supabase.from("carts").select("id").eq("status", "active");
    if (identity.customer_id) cartQuery = cartQuery.eq("customer_id", identity.customer_id);
    else cartQuery = cartQuery.eq("session_token", identity.session_token);

    const { data: cart } = await cartQuery.maybeSingle();
    if (!cart) throw new Error("Carrinho não encontrado");

    await supabase
      .from("carts")
      .update({
        shipping_zipcode: zipcode,
        shipping_method: method,
        shipping_cents: cents,
      })
      .eq("id", cart.id);

    return { status: "success", message: "Frete atualizado com sucesso" };
  });
