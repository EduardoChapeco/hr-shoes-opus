/**
 * Cart server functions — Hr Shoes Commerce
 *
 * All cart and stock calculations happen here.
 * Never trust the client for prices or availability.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerClient } from "@/lib/supabase";
import { getGuestSession, getSellerRefCookie } from "@/lib/session";
import { getCurrentIdentity, mergeGuestCartLogic } from "./cart-helpers";
import type { CartDTO } from "@/types/orders";

// Helpers (getCurrentIdentity, mergeGuestCartLogic) live in ./cart-helpers
// because tss-serverfn-split strips sibling declarations from this file.

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
  const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja nÃ£o configurada");
    const store = { id: storeId };
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

export async function fetchCartDTO(identity: {
  customer_id: string | null;
  session_token: string | null;
}): Promise<CartDTO | null> {
  const supabase = getServerClient();

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
          price_override_cents,
          compare_at_cents,
          stock_on_hand,
          stock_reserved,
          sku,
          attributes,
          product:products (
            id,
            title,
            slug,
            price_cents,
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
      price_override_cents: number | null;
      compare_at_cents: number | null;
      stock_on_hand: number;
      stock_reserved: number;
      attributes: Record<string, string>;
      product: {
        id: string;
        title: string;
        slug: string;
        price_cents: number;
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
    const price = variant.price_override_cents ?? product.price_cents;
    const lineTotal = price * item.qty;
    totalCents += lineTotal;
    
    const availableStock = (variant.stock_on_hand || 0) - (variant.stock_reserved || 0);
    const isOutOfStock = availableStock < item.qty;

    return {
      id: item.id,
      variantId: item.variant_id,
      qty: item.qty,
      priceCents: price,
      compareAtCents: variant.compare_at_cents ?? null,
      lineTotalCents: lineTotal,
      productTitle: product.title ?? "",
      variantSku: variant.sku,
      variantAttributes: variant.attributes || {},
      coverUrl: image,
      isOutOfStock,
    };
  });
  // Dynamic Recalculation (M-08-F2)
  // Always recompute the discount based on the latest subtotal if a coupon is present.
  let dynamicDiscountCents = cart.discount_cents || 0;
  let currentCouponCode = cart.coupon_code;

  if (currentCouponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", currentCouponCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) < new Date()) || (coupon.min_order_cents && totalCents < coupon.min_order_cents)) {
      // Invalidated by qty change or expiration
      dynamicDiscountCents = 0;
      currentCouponCode = null;
      // Fire-and-forget DB update to clear the invalid coupon
      supabase.from("carts").update({ coupon_code: null, discount_cents: 0 }).eq("id", cart.id).then();
    } else {
      if (coupon.discount_type === "percentage") {
        dynamicDiscountCents = Math.floor(totalCents * (coupon.discount_value / 100));
      } else if (coupon.discount_type === "fixed_amount") {
        dynamicDiscountCents = Math.round(coupon.discount_value * 100);
        if (dynamicDiscountCents > totalCents) dynamicDiscountCents = totalCents;
      }
      
      // If the recomputed discount differs from the DB, update DB silently
      if (dynamicDiscountCents !== cart.discount_cents) {
         supabase.from("carts").update({ discount_cents: dynamicDiscountCents }).eq("id", cart.id).then();
      }
    }
  }

  return {
    id: cart.id,
    items,
    subtotalCents: totalCents,
    totalCents: Math.max(0, totalCents + cart.shipping_cents - dynamicDiscountCents),
    shippingCents: cart.shipping_cents,
    shippingMethod: cart.shipping_method,
    discountCents: dynamicDiscountCents,
    couponCode: currentCouponCode,
    itemCount: items.reduce((acc: number, item: { qty: number }) => acc + item.qty, 0),
  };
}

export const getCart = createServerFn({ method: "GET" }).handler(
  async (): Promise<CartDTO | null> => {
    const identity = await getCurrentIdentity();
    return fetchCartDTO(identity);
  },
);

const AddToCartSchema = z.object({
  variantId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  sellerId: z.string().uuid().optional(),
});

export const addToCart = createServerFn({ method: "POST" })
  .validator(AddToCartSchema)
  .handler(async ({ data: { variantId: inputVariantId, productId, quantity, sellerId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    const activeSellerId = sellerId || getSellerRefCookie();

    let targetVariantId = inputVariantId;

    // If only productId provided, fetch first available variant
    if (!targetVariantId && productId) {
      const { data: firstVariant } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstVariant) {
        targetVariantId = firstVariant.id;
      }
    }

    if (!targetVariantId) {
      throw new Error("Selecione uma opção de produto válida.");
    }
    const variantId = targetVariantId;

    // Check if store exists to use for cart
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja nÃ£o configurada");
    const store = { id: storeId };
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

    // 2. Tenta fazer a reserva atômica no banco de dados via RPC (Fase 12: Motor Transacional)
    // Se não houver estoque disponível (on_hand - reserved), a RPC lançará exceção e abortará
    const { error: reserveError } = await supabase.rpc("reserve_stock_for_cart", {
      p_cart_id: cartId,
      p_variant_id: variantId,
      p_qty: quantity,
      p_expires_in_minutes: 15,
    });

    if (reserveError) {
      throw new Error(reserveError.message || "Erro ao reservar estoque.");
    }

    // Find if item already in cart to check total requested
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartId)
      .eq("variant_id", variantId)
      .maybeSingle();

    const newTotalQty = existingItem ? existingItem.qty + quantity : quantity;

    // Fetch snapshot price for safety
    const { data: vInfo } = await supabase
      .from("product_variants")
      .select("price_cents, product_id, products(price_cents)")
      .eq("id", variantId)
      .single();

    const priceCents = vInfo?.price_cents ?? (vInfo?.products as any)?.price_cents ?? 0;

    // 4. Add or update item in cart
    if (existingItem) {
      await supabase.from("cart_items").update({ qty: newTotalQty }).eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cartId,
        variant_id: variantId,
        qty: quantity,
        price_snapshot_cents: priceCents,
      });
    }

    // Fetch and return the updated cart directly to bypass cookie race conditions on the frontend
    const updatedCart = await fetchCartDTO(identity);
    return { status: "success", cart: updatedCart, session_token: identity.session_token };
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

    if (!item) throw new Error("Item não encontrado" );

    // Soltar reserva via RPC para garantir a atomicidade do decremento de stock_reserved
    await supabase.rpc("release_stock_for_cart_item", {
      p_cart_id: item.cart_id,
      p_variant_id: item.variant_id,
    });

    // Delete item
    await supabase.from("cart_items").delete().eq("id", itemId);

    return { status: "success" };
  });

// mergeGuestCartLogic lives in ./cart-helpers (see import above).

export const mergeGuestCart = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string(),
      accessToken: z.string().optional(),
      guestSessionToken: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data: { customerId, accessToken, guestSessionToken } }) => {
    // If not explicitly passed, try to read it (safe if synchronous, but might fail if after async)
    const token = guestSessionToken !== undefined ? guestSessionToken : getGuestSession();
    return mergeGuestCartLogic(customerId, accessToken, token);
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
      await supabase.rpc("release_stock_for_cart_item", {
        p_cart_id: cart.id,
        p_variant_id: variantId,
      });
      await supabase.from("cart_items").delete().eq("id", existingItem.id);
      return { status: "success" };
    }

    if (delta > 0) {
      // Need to verify stock for the additional delta via RPC
      const { error: reserveError } = await supabase.rpc("reserve_stock_for_cart", {
        p_cart_id: cart.id,
        p_variant_id: variantId,
        p_qty: delta,
        p_expires_in_minutes: 15,
      });

      if (reserveError) throw new Error(reserveError.message || "Erro ao reservar estoque.");
    } else if (delta < 0) {
      // When reducing quantity, we need to release part of the stock reservation.
      // But our RPCs currently either add to the reservation or clear it completely.
      // Since it's a reduction, we can manually decrement the reservation and stock_reserved.
      // Or we can just let it expire. For correctness, let's just clear the full item reservation and re-reserve the correct amount.
      await supabase.rpc("release_stock_for_cart_item", {
        p_cart_id: cart.id,
        p_variant_id: variantId,
      });
      const { error: reReserveError } = await supabase.rpc("reserve_stock_for_cart", {
        p_cart_id: cart.id,
        p_variant_id: variantId,
        p_qty: newTotalQty,
        p_expires_in_minutes: 15,
      });
      if (reReserveError) throw new Error(reReserveError.message || "Erro ao atualizar estoque.");
    }

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
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja nÃ£o configurada");
    const store = { id: storeId };
    if (!store) throw new Error("Loja não configurada");

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", store.id)
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) throw new Error("Cupom inválido ou expirado." );

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error("Este cupom já expirou." );
    }

    // Check limits
    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      throw new Error("Este cupom atingiu o limite de usos." );
    }

    if (coupon.min_order_cents && cartDetails.subtotalCents < coupon.min_order_cents) {
      throw new Error(`Valor mínimo para este cupom é ${(coupon.min_order_cents / 100).toFixed(2)}`);
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

    return { message: "Cupom aplicado com sucesso!" };
  });

export const updateCartShipping = createServerFn({ method: "POST" })
  .validator(
    z.object({
      zipcode: z.string().min(8),
      method: z.string().min(2),
      cents: z.number().min(0),
    }),
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

export const updateCartContact = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      guestEmail: z.string().email().optional(),
      guestPhone: z.string().optional(),
    }),
  )
  .handler(async ({ data: { guestEmail, guestPhone } }) => {
    try {
      const identity = await getCurrentIdentity();
      const cartId = await getOrCreateCartId(identity);
      
      if (!cartId) {
        throw new Error('Nenhum carrinho ativo encontrado');
      }

      const db = getServerClient();
      const { error } = await db
        .from('carts')
        .update({
          guest_email: guestEmail,
          guest_phone: guestPhone,
        })
        .eq('id', cartId);

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('[cart] updateCartContact error:', e);
      throw new Error('Falha ao atualizar contato do carrinho');
    }
  });

export const triggerAbandonedCartsEngine = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      // Idealmente isto é restrito a service_role/admin/webhook auth
      const db = getServerClient();
      const { error } = await db.rpc('process_abandoned_carts');
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('[cart] triggerAbandonedCartsEngine error:', e);
      throw new Error('Falha ao disparar motor de carrinhos abandonados');
    }
  },
);

