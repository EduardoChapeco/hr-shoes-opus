-- ============================================================================
-- Hr Shoes Commerce â€” Migration 0071: Checkout Logistics Snapshot
-- ============================================================================
-- Capture physical dimensions and weight during checkout so that Fulfillment 
-- always has access to the exact logistics data at the time of purchase.
-- ============================================================================

CREATE OR REPLACE FUNCTION process_checkout_atomic(p_cart_id UUID, p_customer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart RECORD;
  v_item RECORD;
  v_subtotal_cents INTEGER := 0;
  v_total_cents INTEGER := 0;
  v_items_snapshot JSONB := '[]'::jsonb;
  v_order_id UUID;
  v_tenant_id UUID;
  v_store_id UUID;
BEGIN
  -- 1. Get Cart
  SELECT c.id, c.organization_id, c.store_id, c.discount_cents, c.shipping_cents, c.shipping_zipcode, c.shipping_method
    INTO v_cart
    FROM public.carts c
   WHERE c.id = p_cart_id AND c.status = 'active'
     FOR UPDATE;
     
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carrinho invÃ¡lido ou inativo.';
  END IF;

  v_tenant_id := v_cart.organization_id;
  v_store_id := v_cart.store_id;

  -- 2. Process Items and Lock Rows
  FOR v_item IN
    SELECT 
      ci.variant_id, 
      ci.qty, 
      pv.sku, 
      pv.stock_on_hand,
      pv.stock_reserved,
      COALESCE(pv.price_override_cents, p.price_cents) AS price_snapshot_cents,
      pv.attributes AS variant_attributes,
      p.title AS product_title,
      p.weight_kg,
      p.width_cm,
      p.height_cm,
      p.length_cm,
      p.is_physical,
      (SELECT url FROM public.product_media pm WHERE pm.product_id = p.id AND (pm.variant_id = pv.id OR pm.variant_id IS NULL) ORDER BY sort_order ASC LIMIT 1) as image_url
    FROM public.cart_items ci
    JOIN public.product_variants pv ON ci.variant_id = pv.id
    JOIN public.products p ON pv.product_id = p.id
    WHERE ci.cart_id = p_cart_id
      AND p.status = 'published'
      AND pv.status = 'active'
      AND ci.qty > 0
    FOR UPDATE OF pv
  LOOP
    IF v_item.stock_on_hand - v_item.stock_reserved < v_item.qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto % (Tamanho: %).', v_item.product_title, COALESCE(v_item.variant_attributes->>'tamanho', 'Ãšnico');
    END IF;

    UPDATE public.product_variants
       SET stock_reserved = stock_reserved + v_item.qty
     WHERE id = v_item.variant_id;

    v_subtotal_cents := v_subtotal_cents + (v_item.qty * v_item.price_snapshot_cents);
    
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item.variant_id,
      'qty', v_item.qty,
      'unit_price_cents', v_item.price_snapshot_cents,
      'total_cents', (v_item.qty * v_item.price_snapshot_cents),
      'product_title', v_item.product_title,
      'variant_sku', v_item.sku,
      'variant_attributes', COALESCE(v_item.variant_attributes, '{}'::jsonb),
      'image_url', v_item.image_url,
      'weight_kg', v_item.weight_kg,
      'width_cm', v_item.width_cm,
      'height_cm', v_item.height_cm,
      'length_cm', v_item.length_cm,
      'is_physical', v_item.is_physical
    );
  END LOOP;
  
  IF jsonb_array_length(v_items_snapshot) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio.';
  END IF;

  v_total_cents := (v_subtotal_cents + COALESCE(v_cart.shipping_cents, 0)) - COALESCE(v_cart.discount_cents, 0);
  IF v_total_cents < 0 THEN v_total_cents := 0; END IF;

  -- 3. Create Order
  INSERT INTO public.orders (
    organization_id,
    store_id,
    customer_id,
    cart_id,
    subtotal_cents,
    shipping_cents,
    discount_cents,
    total_cents,
    items_snapshot,
    status
  ) VALUES (
    v_tenant_id,
    v_store_id,
    p_customer_id,
    p_cart_id,
    v_subtotal_cents,
    v_cart.shipping_cents,
    v_cart.discount_cents,
    v_total_cents,
    v_items_snapshot,
    'pending_payment'
  ) RETURNING id INTO v_order_id;

  -- 4. Mark Cart as Completed
  UPDATE public.carts 
     SET status = 'completed', 
         updated_at = NOW() 
   WHERE id = p_cart_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'total_cents', v_total_cents
  );
END;
$$;
