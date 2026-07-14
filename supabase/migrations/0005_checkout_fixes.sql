-- ============================================================================
-- Hr Shoes Commerce — Migration 0005: Checkout Fixes
-- ============================================================================
-- Schema: shipping_options
--
-- Rules:
--  - All money in integer cents + BRL.
--  - Provides canonical source for shipping calculation instead of hardcoding.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shipping_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
  min_days        INTEGER NOT NULL DEFAULT 1 CHECK (min_days >= 0),
  max_days        INTEGER NOT NULL DEFAULT 5 CHECK (max_days >= min_days),
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;

-- Everyone can read active shipping options
CREATE POLICY "shipping_options_public_read"
  ON public.shipping_options FOR SELECT
  USING (active = true);

-- Staff can read all and manage
CREATE POLICY "shipping_options_staff_all"
  ON public.shipping_options FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE TRIGGER shipping_options_updated_at
  BEFORE UPDATE ON public.shipping_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial data for the default store
INSERT INTO public.shipping_options (store_id, name, price_cents, min_days, max_days, active)
SELECT id, 'PAC (Econômico)', 2500, 7, 10, true FROM public.stores LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_options (store_id, name, price_cents, min_days, max_days, active)
SELECT id, 'Sedex (Expresso)', 4500, 2, 4, true FROM public.stores LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_options (store_id, name, price_cents, min_days, max_days, active)
SELECT id, 'Retirada na Loja', 0, 0, 1, true FROM public.stores LIMIT 1
ON CONFLICT DO NOTHING;
