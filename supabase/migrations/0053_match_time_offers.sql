-- ============================================================================
-- Hr Shoes Commerce — Migration 0053: Match Time Offers (Microfase 5)
-- ============================================================================
-- Cria a tabela de ofertas geradas pelo algoritmo do Match Time.
-- Essas ofertas possuem vida curta (ex: 15 minutos) e aplicam desconto a um produto.

BEGIN;

CREATE TABLE IF NOT EXISTS public.match_time_offers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id       UUID NOT NULL REFERENCES public.match_time_sessions(id) ON DELETE CASCADE,
  
  -- Offer details
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_time_offers ENABLE ROW LEVEL SECURITY;

-- Customer can read their own offers
CREATE POLICY "match_time_offers_customer_read"
  ON public.match_time_offers FOR SELECT
  USING (customer_id = auth.uid());

-- Staff can read all offers
CREATE POLICY "match_time_offers_staff_read"
  ON public.match_time_offers FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- Link cart to match time offer
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS match_time_offer_id UUID REFERENCES public.match_time_offers(id) ON DELETE SET NULL;

COMMIT;
