-- 20260728170000_cart_status_protection.sql
-- Fixes add_to_cart_atomic_v4 to ensure it respects variant status.
-- Variants marked as 'inactive' or 'archived' should not be purchasable.

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
    UPDATE public.carts SET seller_id = p_seller_id WHERE id = v_cart_id AND seller_id IS DISTINCT FROM p_seller_id;
  END IF;

  -- [NEW] Acquire Transaction-Level Advisory Lock based on cart_id and variant_id
  PERFORM pg_advisory_xact_lock(hashtext(v_cart_id::text || p_variant_id::text));

  -- 2. Validate Stock Availability, Tenant Isolation, AND Variant Status
  SELECT pv.stock_on_hand INTO v_available
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id 
    AND p.store_id = p_store_id 
    AND pv.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variante não encontrada, inativa ou não pertence a esta loja.';
  END IF;

  -- 3. Check requested quantity
  SELECT COALESCE(qty, 0) INTO v_existing_qty
  FROM public.cart_items
  WHERE cart_id = v_cart_id AND variant_id = p_variant_id;

  IF (v_existing_qty + p_qty) > v_available THEN
    RAISE EXCEPTION 'Estoque insuficiente para esta variação.';
  END IF;

  -- 4. Insert or Update Cart Item (Atomic)
  IF v_existing_qty > 0 THEN
    UPDATE public.cart_items 
    SET qty = qty + p_qty, updated_at = NOW()
    WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
  ELSE
    INSERT INTO public.cart_items (cart_id, variant_id, qty)
    VALUES (v_cart_id, p_variant_id, p_qty);
  END IF;

  -- Force carts updated_at trigger (useful for realtime cache invalidation)
  UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;

  RETURN v_cart_id;
END;
$$;
