-- Migration 0078: Atomic Add to Cart (Best Practice e-commerce)
-- Removes hard stock reservation on "add to cart", validates availability instead,
-- and inserts/updates cart_items atomically to fix the 11-step waterfall delay.

CREATE OR REPLACE FUNCTION public.add_to_cart_atomic_v4(
  p_store_id      UUID,
  p_customer_id   UUID,
  p_session_token UUID,
  p_seller_id     UUID,
  p_variant_id    UUID,
  p_qty           INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id UUID;
  v_available INTEGER;
  v_existing_qty INTEGER;
  v_price_cents INTEGER;
BEGIN
  -- 1. Get or Create active Cart
  IF p_customer_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts 
    WHERE customer_id = p_customer_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
  ELSE
    SELECT id INTO v_cart_id FROM public.carts 
    WHERE session_token = p_session_token AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_cart_id IS NULL THEN
    INSERT INTO public.carts (store_id, customer_id, session_token, seller_id, status)
    VALUES (p_store_id, p_customer_id, p_session_token, p_seller_id, 'active')
    RETURNING id INTO v_cart_id;
  ELSIF p_seller_id IS NOT NULL THEN
    -- Update seller_id if newly provided
    UPDATE public.carts SET seller_id = p_seller_id WHERE id = v_cart_id AND seller_id IS DISTINCT FROM p_seller_id;
  END IF;

  -- 2. Validate Stock Availability (Soft Validation, NO HARD RESERVATION)
  -- BigTech best practice: check if it's available now, but only reserve on checkout
  SELECT (stock_on_hand - stock_reserved) INTO v_available
  FROM public.product_variants
  WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variante não encontrada.';
  END IF;

  -- Check existing qty in cart to ensure total doesn't exceed available
  SELECT qty INTO v_existing_qty 
  FROM public.cart_items 
  WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
  
  v_existing_qty := COALESCE(v_existing_qty, 0);

  IF v_available < (v_existing_qty + p_qty) THEN
    RAISE EXCEPTION 'Estoque insuficiente. Apenas % disponíveis.', v_available;
  END IF;

  -- 3. Resolve Price Snapshot (Priority: Variant override -> Product base)
  SELECT COALESCE(pv.price_override_cents, p.price_cents) INTO v_price_cents
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id;

  IF v_price_cents IS NULL THEN
    v_price_cents := 0;
  END IF;

  -- 4. Upsert Cart Item
  IF v_existing_qty > 0 THEN
    UPDATE public.cart_items 
    SET qty = qty + p_qty, price_snapshot_cents = v_price_cents
    WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
  ELSE
    INSERT INTO public.cart_items (cart_id, variant_id, qty, price_snapshot_cents)
    VALUES (v_cart_id, p_variant_id, p_qty, v_price_cents);
  END IF;

  RETURN v_cart_id;
END;
$$;
