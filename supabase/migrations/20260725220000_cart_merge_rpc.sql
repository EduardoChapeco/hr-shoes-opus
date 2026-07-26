-- Migration: 20260725220000_cart_merge_rpc
-- Resolves N+1 Cart Merge issues during Login/Session Transition

CREATE OR REPLACE FUNCTION public.merge_guest_cart(
  p_guest_session TEXT,
  p_customer_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_cart_id UUID;
  v_user_cart_id UUID;
BEGIN
  -- 1. Find Guest Cart
  SELECT id INTO v_guest_cart_id
  FROM public.carts
  WHERE session_token = p_guest_session AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_guest_cart_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Find User Cart
  SELECT id INTO v_user_cart_id
  FROM public.carts
  WHERE customer_id = p_customer_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_cart_id IS NULL THEN
    -- No user cart exists. Simply claim the guest cart.
    UPDATE public.carts
    SET customer_id = p_customer_id, session_token = NULL
    WHERE id = v_guest_cart_id;
  ELSE
    -- User cart exists. Move items and sum quantities.
    INSERT INTO public.cart_items (cart_id, variant_id, qty, price_snapshot_cents)
    SELECT v_user_cart_id, variant_id, qty, price_snapshot_cents
    FROM public.cart_items
    WHERE cart_id = v_guest_cart_id
    ON CONFLICT (cart_id, variant_id) DO UPDATE
    SET qty = public.cart_items.qty + EXCLUDED.qty;

    -- Delete the guest cart (cascades or cleans up automatically)
    DELETE FROM public.cart_items WHERE cart_id = v_guest_cart_id;
    DELETE FROM public.carts WHERE id = v_guest_cart_id;
  END IF;
END;
$$;
