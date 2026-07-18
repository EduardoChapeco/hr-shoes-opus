-- ============================================================================
-- Hr Shoes Commerce — Migration 0055: Checkout Revalidation Engine
-- ============================================================================
-- Resolve o problema de "Preço Congelado" e "Venda sem Estoque (Overselling)".

BEGIN;

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
  
  v_real_price INTEGER;
  v_has_active_reservation BOOLEAN;
  v_free_stock INTEGER;
BEGIN
  -- 1. Limpa reservas expiradas de forma preguiçosa
  PERFORM public.release_expired_reservations();

  -- 2. Idempotency Check
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

  -- 3. Lock the Cart
  SELECT * INTO v_cart
  FROM public.carts
  WHERE id = p_cart_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carrinho não encontrado ou já processado.';
  END IF;
  
  v_store_id := v_cart.store_id;
  v_shipping_cents := v_cart.shipping_cents;

  -- 4. Calculate Subtotal from Cart Items with STRICT REVALIDATION
  FOR v_item IN (
    SELECT ci.qty, ci.variant_id, 
           pv.sku, p.title as product_title, pv.attributes as variant_attributes,
           pm.url as image_url, pv.stock_on_hand, pv.stock_reserved,
           COALESCE(pv.price_override_cents, p.price_cents) as real_time_price
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
    v_real_price := v_item.real_time_price;
    
    -- STOCK VALIDATION: Does this cart have an active reservation for this qty?
    SELECT EXISTS (
      SELECT 1 FROM public.stock_reservations
      WHERE cart_id = p_cart_id AND variant_id = v_item.variant_id AND qty >= v_item.qty
    ) INTO v_has_active_reservation;
    
    IF NOT v_has_active_reservation THEN
      -- IF NO RESERVATION, verify if we can acquire the stock opportunistically right now
      v_free_stock := v_item.stock_on_hand - v_item.stock_reserved;
      IF v_free_stock < v_item.qty THEN
        RAISE EXCEPTION 'Item "%" não possui estoque disponível no momento.', v_item.product_title;
      END IF;
    END IF;

    v_subtotal_cents := v_subtotal_cents + (v_item.qty * v_real_price);
    
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item.variant_id,
      'qty', v_item.qty,
      'unit_price_cents', v_real_price,
      'total_cents', (v_item.qty * v_real_price),
      'product_title', v_item.product_title,
      'variant_sku', v_item.sku,
      'variant_attributes', COALESCE(v_item.variant_attributes, '{}'::jsonb),
      'image_url', v_item.image_url,
      'had_reservation', v_has_active_reservation
    );
  END LOOP;
  
  IF jsonb_array_length(v_items_snapshot) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio.';
  END IF;

  -- 5. Apply Coupon
  IF v_cart.coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE store_id = v_store_id AND code = v_cart.coupon_code AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cupom inválido ou inativo.'; END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN RAISE EXCEPTION 'Cupom expirado.'; END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN RAISE EXCEPTION 'Cupom atingiu o limite de usos.'; END IF;
    IF v_coupon.min_order_cents IS NOT NULL AND v_subtotal_cents < v_coupon.min_order_cents THEN RAISE EXCEPTION 'Valor mínimo não atingido.'; END IF;
    
    IF v_coupon.discount_type = 'percentage' THEN v_discount_cents := floor(v_subtotal_cents * (v_coupon.discount_value / 100.0))::INTEGER;
    ELSIF v_coupon.discount_type = 'fixed_amount' THEN v_discount_cents := floor(v_coupon.discount_value * 100)::INTEGER; IF v_discount_cents > v_subtotal_cents THEN v_discount_cents := v_subtotal_cents; END IF;
    ELSIF v_coupon.discount_type = 'free_shipping' THEN v_shipping_cents := 0; v_discount_cents := 0; END IF;
    
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = v_coupon.id;
  END IF;

  v_total_cents := v_subtotal_cents + v_shipping_cents - v_discount_cents;
  IF v_total_cents < 0 THEN v_total_cents := 0; END IF;

  -- 6. Create Order
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, shipping_address,
    customer_snapshot
  ) VALUES (
    v_store_id, v_cart.customer_id, 'awaiting_payment', v_items_snapshot,
    v_subtotal_cents, v_shipping_cents, v_discount_cents, v_total_cents,
    p_shipping_method, p_shipping_address,
    jsonb_build_object('name', p_customer_name, 'email', p_customer_email, 'document', p_customer_document, 'phone', p_customer_phone)
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 7. Insert Order Items, Adjust Stock, Clear Reservations
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
    
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item->>'variant_id')::UUID, v_store_id, 'sale', -1 * (v_item->>'qty')::INTEGER, 
      'order', v_order_id, 'Pedido #' || v_order_public_token, v_cart.customer_id
    );
    
    -- Se havia reserva, o reserved foi usado e diminui, assim como o on_hand.
    -- Se NÃO havia reserva, apenas o on_hand diminui.
    IF (v_item->>'had_reservation')::BOOLEAN THEN
       UPDATE public.product_variants
       SET stock_on_hand = stock_on_hand - (v_item->>'qty')::INTEGER,
           stock_reserved = GREATEST(0, stock_reserved - (v_item->>'qty')::INTEGER)
       WHERE id = (v_item->>'variant_id')::UUID;
    ELSE
       UPDATE public.product_variants
       SET stock_on_hand = stock_on_hand - (v_item->>'qty')::INTEGER
       WHERE id = (v_item->>'variant_id')::UUID;
    END IF;
  END LOOP;

  -- Limpa as reservas originais deste carrinho
  DELETE FROM public.stock_reservations WHERE cart_id = p_cart_id;

  -- 8. Create Payment Record (Awaiting)
  INSERT INTO public.payments (
    order_id, store_id, payment_method, amount_cents, status, idempotency_key
  ) VALUES (
    v_order_id, v_store_id, p_payment_method, v_total_cents, 'pending', p_idempotency_key
  );

  UPDATE public.carts SET status = 'abandoned', updated_at = now() WHERE id = p_cart_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'orderToken', v_order_public_token,
    'is_idempotent_replay', false
  );
END;
$$;

COMMIT;
