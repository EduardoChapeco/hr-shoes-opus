-- ============================================================================
-- Hr Shoes Commerce — Migration 0051: POS Sale Atomic RPC
-- ============================================================================
-- 1. Creates process_pos_sale_transaction RPC for the physical POS/Caixa.
-- This ensures stock deduction, order creation, payment, and cash register
-- entries are executed atomically.

CREATE OR REPLACE FUNCTION public.process_pos_sale_transaction(
  p_register_id UUID,
  p_store_id UUID,
  p_seller_id UUID,
  p_customer_name TEXT,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount_cents INTEGER,
  p_items JSONB,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register RECORD;
  v_item RECORD;
  v_subtotal_cents INTEGER := 0;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_order_public_token TEXT;
  v_items_snapshot JSONB := '[]'::JSONB;
  v_payment_method_db TEXT;
  v_cash_entry_id UUID;
  v_has_negative_stock BOOLEAN := false;
  v_current_stock INTEGER;
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
      'orderId', v_order_id,
      'orderToken', v_order_public_token,
      'is_idempotent_replay', true
    );
  END IF;

  -- 2. Validate Register
  SELECT * INTO v_register
  FROM public.cash_registers
  WHERE id = p_register_id AND store_id = p_store_id AND status = 'open'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caixa inválido, fechado ou não pertence a esta loja.';
  END IF;

  -- 3. Calculate Totals and Build Snapshot
  FOR v_item IN (SELECT * FROM jsonb_array_elements(p_items)) LOOP
    v_subtotal_cents := v_subtotal_cents + ((v_item->>'qty')::INTEGER * (v_item->>'priceCents')::INTEGER);
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item->>'variantId',
      'qty', (v_item->>'qty')::INTEGER,
      'unit_price_cents', (v_item->>'priceCents')::INTEGER,
      'total_cents', ((v_item->>'qty')::INTEGER * (v_item->>'priceCents')::INTEGER),
      'product_title', v_item->>'title',
      'variant_sku', v_item->>'sku'
    );
  END LOOP;

  v_total_cents := v_subtotal_cents - COALESCE(p_discount_cents, 0);
  IF v_total_cents < 0 THEN
    v_total_cents := 0;
  END IF;

  -- 4. Create Order
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, seller_id, paid_at, delivered_at, customer_snapshot
  ) VALUES (
    p_store_id, p_customer_id, 'completed', v_items_snapshot,
    v_subtotal_cents, 0, COALESCE(p_discount_cents, 0), v_total_cents,
    'pickup', p_seller_id, now(), now(),
    jsonb_build_object('name', COALESCE(p_customer_name, 'Cliente Avulso'))
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 5. Create Order Items and Deduct Stock
  FOR v_item IN (SELECT * FROM jsonb_array_elements(v_items_snapshot)) LOOP
    -- Enforce Stock if needed. In POS we might allow negative stock, but let's record it.
    INSERT INTO public.order_items (
      order_id, variant_id, product_title, variant_sku,
      variant_attributes, image_url, qty, unit_price_cents, total_cents
    ) VALUES (
      v_order_id, (v_item->>'variant_id')::UUID, v_item->>'product_title', v_item->>'variant_sku',
      '{}'::JSONB, NULL, 
      (v_item->>'qty')::INTEGER, (v_item->>'unit_price_cents')::INTEGER, (v_item->>'total_cents')::INTEGER
    );
    
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item->>'variant_id')::UUID, p_store_id, 'sale', -1 * (v_item->>'qty')::INTEGER, 
      'order', v_order_id, 'PDV #' || v_order_public_token, p_seller_id
    );
    
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand - (v_item->>'qty')::INTEGER
    WHERE id = (v_item->>'variant_id')::UUID
    RETURNING stock_on_hand INTO v_current_stock;
    
    IF v_current_stock < 0 THEN
      v_has_negative_stock := true;
    END IF;
  END LOOP;

  -- 6. Record Payment
  IF p_payment_method = 'pix' THEN v_payment_method_db := 'pix';
  ELSIF p_payment_method IN ('credit', 'debit') THEN v_payment_method_db := 'credit_card';
  ELSE v_payment_method_db := 'manual'; END IF;

  INSERT INTO public.payments (
    order_id, store_id, method, status, amount_cents, idempotency_key, paid_at, provider_name
  ) VALUES (
    v_order_id, p_store_id, v_payment_method_db::public.payment_method, 'paid', v_total_cents, p_idempotency_key, now(), 'PDV Balcão'
  );

  -- 7. Add Cash Register Entry
  INSERT INTO public.cash_register_entries (
    register_id, order_id, amount_cents, method, description
  ) VALUES (
    p_register_id, v_order_id, v_total_cents, p_payment_method,
    'Venda PDV (' || COALESCE(p_customer_name, 'Cliente Avulso') || ') - Pedido: ' || v_order_public_token
  ) RETURNING id INTO v_cash_entry_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'receiptId', v_cash_entry_id,
    'orderId', v_order_id,
    'orderToken', v_order_public_token,
    'subtotalCents', v_subtotal_cents,
    'discountCents', COALESCE(p_discount_cents, 0),
    'totalCents', v_total_cents,
    'hasNegativeStock', v_has_negative_stock,
    'is_idempotent_replay', false
  );
END;
$$;

-- ============================================================================
-- 2. Creates process_checkout_transaction_v2 RPC for the E-commerce Checkout.
-- Wraps process_checkout_atomic to ALSO handle Gift Cards and Manual Payment 
-- Surcharges atomically inside PostgreSQL.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_checkout_transaction_v2(
  p_cart_id UUID,
  p_idempotency_key TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_document TEXT,
  p_customer_phone TEXT,
  p_shipping_method TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_gift_card_code TEXT,
  p_manual_payment_method_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkout_res JSONB;
  v_order_token TEXT;
  v_order_id UUID;
  v_store_id UUID;
  v_total_cents INTEGER;
  v_discount_cents INTEGER;
  v_surcharge_cents INTEGER := 0;
  v_gift_card_deduct INTEGER := 0;
  
  v_gift_card RECORD;
  v_manual_method RECORD;
  v_provider_name TEXT := NULL;
BEGIN
  -- 1. Run the base checkout atomic function
  -- This creates the order, deducts stock, uses coupon and creates pending payment
  v_checkout_res := public.process_checkout_atomic(
    p_cart_id, p_idempotency_key, p_customer_name, p_customer_email,
    p_customer_document, p_customer_phone, p_shipping_method,
    p_shipping_address, p_payment_method
  );
  
  IF v_checkout_res->>'status' != 'success' THEN
    RETURN v_checkout_res; -- Return error or idempotent replay
  END IF;
  
  IF (v_checkout_res->>'is_idempotent_replay')::BOOLEAN THEN
    RETURN v_checkout_res;
  END IF;

  v_order_token := v_checkout_res->>'orderToken';
  
  SELECT id, store_id, total_cents, discount_cents INTO v_order_id, v_store_id, v_total_cents, v_discount_cents
  FROM public.orders 
  WHERE public_token = v_order_token;

  -- 2. Apply Manual Payment Method Surcharges or Discounts (if any)
  IF p_manual_payment_method_id IS NOT NULL THEN
    SELECT * INTO v_manual_method
    FROM public.manual_payment_methods
    WHERE id = p_manual_payment_method_id;
    
    IF FOUND THEN
      v_provider_name := v_manual_method.name;
      IF v_manual_method.discount_percentage > 0 THEN
        v_surcharge_cents := -floor((v_total_cents + v_discount_cents) * (v_manual_method.discount_percentage / 100.0))::INTEGER;
      ELSIF v_manual_method.surcharge_percentage > 0 THEN
        v_surcharge_cents := floor((v_total_cents + v_discount_cents) * (v_manual_method.surcharge_percentage / 100.0))::INTEGER;
      END IF;
      
      v_total_cents := v_total_cents + v_surcharge_cents;
      IF v_surcharge_cents < 0 THEN
        v_discount_cents := v_discount_cents - v_surcharge_cents; -- Add to total discount
      END IF;
    END IF;
  END IF;

  -- 3. Apply Gift Card (if any) ATOMICALLY WITH LOCK
  IF p_gift_card_code IS NOT NULL AND v_total_cents > 0 THEN
    SELECT * INTO v_gift_card
    FROM public.gift_cards
    WHERE code = p_gift_card_code AND store_id = v_store_id
    FOR UPDATE;
    
    IF FOUND AND v_gift_card.status = 'active' AND v_gift_card.current_balance_cents > 0 THEN
      IF v_gift_card.expires_at IS NULL OR v_gift_card.expires_at > now() THEN
        v_gift_card_deduct := LEAST(v_total_cents, v_gift_card.current_balance_cents);
        v_total_cents := v_total_cents - v_gift_card_deduct;
        v_discount_cents := v_discount_cents + v_gift_card_deduct;
        
        UPDATE public.gift_cards
        SET current_balance_cents = current_balance_cents - v_gift_card_deduct,
            status = CASE WHEN current_balance_cents - v_gift_card_deduct = 0 THEN 'exhausted'::public.gift_card_status ELSE 'active'::public.gift_card_status END,
            updated_at = now()
        WHERE id = v_gift_card.id;
      END IF;
    END IF;
  END IF;

  -- 4. Update the order and payment with final calculated values
  UPDATE public.orders
  SET total_cents = GREATEST(0, v_total_cents),
      discount_cents = v_discount_cents
  WHERE id = v_order_id;
  
  UPDATE public.payments
  SET amount_cents = GREATEST(0, v_total_cents),
      provider_name = COALESCE(v_provider_name, provider_name)
  WHERE order_id = v_order_id;

  RETURN v_checkout_res;
END;
$$;
