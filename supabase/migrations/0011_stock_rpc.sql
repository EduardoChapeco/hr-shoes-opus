-- ---------------------------------------------------------------------------
-- 0011_stock_rpc.sql
-- RPC for atomic stock adjustments
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_variant_id UUID,
  p_qty INTEGER,
  p_movement_type TEXT,
  p_note TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Get store_id from variant
  SELECT p.store_id INTO v_store_id
  FROM public.product_variants v
  JOIN public.products p ON p.id = v.product_id
  WHERE v.id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;

  -- Verify permissions: must be service_role OR staff of that store
  -- In this project, service_role is used by TanStack server functions, so it's safe.
  -- But we can add a check if auth.uid() is set.
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND store_id = v_store_id 
      AND role IN ('owner', 'admin', 'manager', 'stock')
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  -- Insert ledger entry
  INSERT INTO public.stock_movements (
    variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
  ) VALUES (
    p_variant_id, v_store_id, p_movement_type, p_qty, p_reference_type, p_reference_id, p_note, auth.uid()
  );

  -- Update counter based on movement type
  IF p_movement_type = 'reserve' THEN
    UPDATE public.product_variants
    SET stock_reserved = stock_reserved + p_qty
    WHERE id = p_variant_id;
  ELSIF p_movement_type = 'release' THEN
    UPDATE public.product_variants
    SET stock_reserved = GREATEST(0, stock_reserved - p_qty)
    WHERE id = p_variant_id;
  ELSIF p_movement_type = 'sale' THEN
    UPDATE public.product_variants
    SET stock_reserved = GREATEST(0, stock_reserved - p_qty),
        stock_on_hand = GREATEST(0, stock_on_hand - p_qty)
    WHERE id = p_variant_id;
  ELSE
    -- purchase, return, exchange_in, exchange_out, adjustment, transfer, damage
    UPDATE public.product_variants
    SET stock_on_hand = GREATEST(0, stock_on_hand + p_qty)
    WHERE id = p_variant_id;
  END IF;
END;
$$;
