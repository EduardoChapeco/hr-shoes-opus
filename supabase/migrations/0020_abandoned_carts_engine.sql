-- ============================================================================
-- Hr Shoes Commerce — Migration 0020: Abandoned Carts Engine
-- ============================================================================

-- 1. Capturar contato no carrinho de guests
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(50);

-- 2. Engine de processamento (Stored Procedure)
CREATE OR REPLACE FUNCTION public.process_abandoned_carts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$$
BEGIN
  -- Insere carrinhos inativos há > 2h e que possuem itens e informações de contato
  INSERT INTO public.abandoned_carts_log (
    store_id, cart_id, customer_id, guest_email, guest_phone,
    total_cents, items_snapshot, status
  )
  SELECT 
    c.store_id,
    c.id,
    c.customer_id,
    c.guest_email,
    c.guest_phone,
    COALESCE((
      SELECT SUM(ci.qty * ci.price_snapshot_cents)
      FROM public.cart_items ci
      WHERE ci.cart_id = c.id
    ), 0) AS total_cents,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'variant_id', ci.variant_id,
          'quantity', ci.qty,
          'price_cents', ci.price_snapshot_cents
        )
      )
      FROM public.cart_items ci
      WHERE ci.cart_id = c.id
    ), '[]'::jsonb) AS items_snapshot,
    'pending' AS status
  FROM public.carts c
  WHERE 
    c.updated_at < (now() - interval '2 hours')
    AND EXISTS (SELECT 1 FROM public.cart_items ci WHERE ci.cart_id = c.id)
    AND (
      c.guest_email IS NOT NULL 
      OR c.guest_phone IS NOT NULL 
      OR c.customer_id IS NOT NULL
    )
    -- Garante que não foi inserido antes
    AND NOT EXISTS (SELECT 1 FROM public.abandoned_carts_log acl WHERE acl.cart_id = c.id);

END;
$$$;
