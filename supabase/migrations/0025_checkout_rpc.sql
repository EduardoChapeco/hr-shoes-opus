-- ============================================================================
-- Hr Shoes Commerce — Migration 0025: Checkout RPC and Schema Fixes
-- ============================================================================
-- 1. Adds customer_snapshot to orders (was missing from 0003).
-- 2. Creates atomic process_checkout_atomic RPC.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.process_checkout_atomic(
  p_cart_id UUID,
  p_idempotency_key TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_document TEXT,
  p_customer_phone TEXT,
  p_shipping_method TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_cart RECORD;
  v_coupon RECORD;
  v_item RECORD;
  
  v_subtotal_cents INTEGER := 0;
  v_discount_cents INTEGER := 0;
  v_shipping_cents INTEGER := 0;
  v_total_cents INTEGER := 0;
  
  v_order_id UUID;
  v_order_public_token TEXT;
  v_items_snapshot JSONB := '[]'::JSONB;
BEGIN
  -- 1. Idempotency Check
  SELECT o.public_token, o.id INTO v_order_public_token, v_order_id
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.idempotency_key = p_idempotency_key
  LIMIT 1;
  
  IF v_order_public_token IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'orderToken', v_order_public_token,
      'is_idempotent_replay', true
    );
  END IF;

  -- 2. Lock the Cart
  SELECT * INTO v_cart
  FROM public.carts
  WHERE id = p_cart_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carrinho não encontrado ou já processado.';
  END IF;
  
  v_store_id := v_cart.store_id;
  v_shipping_cents := v_cart.shipping_cents;

  -- 3. Calculate Subtotal from Cart Items
  FOR v_item IN (
    SELECT ci.qty, ci.price_snapshot_cents, ci.variant_id, 
           pv.sku, p.title as product_title, pv.attributes as variant_attributes,
           pm.url as image_url, pv.stock_on_hand
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN LATERAL (
      SELECT url FROM public.product_media 
      WHERE product_id = p.id AND (variant_id = pv.id OR variant_id IS NULL)
      ORDER BY sort_order ASC LIMIT 1
    ) pm ON true
    WHERE ci.cart_id = p_cart_id
  ) LOOP
    v_subtotal_cents := v_subtotal_cents + (v_item.qty * v_item.price_snapshot_cents);
    
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item.variant_id,
      'qty', v_item.qty,
      'unit_price_cents', v_item.price_snapshot_cents,
      'total_cents', (v_item.qty * v_item.price_snapshot_cents),
      'product_title', v_item.product_title,
      'variant_sku', v_item.sku,
      'variant_attributes', COALESCE(v_item.variant_attributes, '{}'::jsonb),
      'image_url', v_item.image_url
    );
  END LOOP;
  
  IF jsonb_array_length(v_items_snapshot) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio.';
  END IF;

  -- 4. Revalidate and Apply Coupon
  IF v_cart.coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE store_id = v_store_id 
      AND code = v_cart.coupon_code 
      AND is_active = true
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom inválido ou inativo.';
    END IF;
    
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'Cupom expirado.';
    END IF;
    
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Cupom atingiu o limite de usos.';
    END IF;
    
    IF v_coupon.min_order_cents IS NOT NULL AND v_subtotal_cents < v_coupon.min_order_cents THEN
      RAISE EXCEPTION 'Valor mínimo do pedido não atingido para este cupom.';
    END IF;
    
    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
      v_discount_cents := floor(v_subtotal_cents * (v_coupon.discount_value / 100.0))::INTEGER;
    ELSIF v_coupon.discount_type = 'fixed_amount' THEN
      v_discount_cents := floor(v_coupon.discount_value * 100)::INTEGER;
      IF v_discount_cents > v_subtotal_cents THEN
        v_discount_cents := v_subtotal_cents;
      END IF;
    ELSIF v_coupon.discount_type = 'free_shipping' THEN
      v_shipping_cents := 0;
      v_discount_cents := 0;
    END IF;
    
    -- Increment coupon usage
    UPDATE public.coupons 
    SET uses_count = uses_count + 1 
    WHERE id = v_coupon.id;
  END IF;

  v_total_cents := v_subtotal_cents + v_shipping_cents - v_discount_cents;
  IF v_total_cents < 0 THEN
    v_total_cents := 0;
  END IF;

  -- 5. Create Order
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, shipping_address,
    customer_snapshot
  ) VALUES (
    v_store_id, v_cart.customer_id, 'awaiting_payment', v_items_snapshot,
    v_subtotal_cents, v_shipping_cents, v_discount_cents, v_total_cents,
    p_shipping_method, p_shipping_address,
    jsonb_build_object(
      'name', p_customer_name,
      'email', p_customer_email,
      'document', p_customer_document,
      'phone', p_customer_phone
    )
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 6. Insert Order Items, Adjust Stock, Clear Reservations
  FOR v_item IN (
    SELECT * FROM jsonb_array_elements(v_items_snapshot)
  ) LOOP
    INSERT INTO public.order_items (
      order_id, variant_id, product_title, variant_sku,
      variant_attributes, image_url, qty, unit_price_cents, total_cents
    ) VALUES (
      v_order_id, (v_item->>'variant_id')::UUID, v_item->>'product_title', v_item->>'variant_sku',
      (v_item->>'variant_attributes')::JSONB, v_item->>'image_url', 
      (v_item->>'qty')::INTEGER, (v_item->>'unit_price_cents')::INTEGER, (v_item->>'total_cents')::INTEGER
    );
    
    -- Insert Stock Movement
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item->>'variant_id')::UUID, v_store_id, 'sale', -1 * (v_item->>'qty')::INTEGER, 
      'order', v_order_id, 'Pedido #' || v_order_public_token, v_cart.customer_id
    );
    
    -- Update Stock On Hand Counters
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand - (v_item->>'qty')::INTEGER
    WHERE id = (v_item->>'variant_id')::UUID;
  END LOOP;
  
  -- Clear all reservations for this cart
  DELETE FROM public.stock_reservations WHERE cart_id = p_cart_id;

  -- 7. Create Payment Intent Record
  INSERT INTO public.payments (
    order_id, store_id, method, status, amount_cents, idempotency_key
  ) VALUES (
    v_order_id, v_store_id, p_payment_method::public.payment_method, 'pending', v_total_cents, p_idempotency_key
  );

  -- 8. Complete Cart
  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;
  UPDATE public.carts SET status = 'completed' WHERE id = p_cart_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'orderToken', v_order_public_token,
    'is_idempotent_replay', false
  );
END;
$$;
