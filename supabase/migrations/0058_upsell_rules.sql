-- ============================================================================
-- Hr Shoes Commerce — Migration 0058: Upsell Rules (Microfase 7)
-- ============================================================================
-- Cria a tabela de regras de upsell no checkout.
-- Define RLS permitindo escrita apenas por staff e leitura pública de regras ativas.

BEGIN;

CREATE TABLE IF NOT EXISTS public.upsell_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trigger_product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  active              BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, trigger_product_id, offer_product_id)
);

ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;

-- 1. Public can read active upsell rules
CREATE POLICY "upsell_rules_public_read"
  ON public.upsell_rules FOR SELECT
  USING (active = true);

-- 2. Staff read all rules in their store
CREATE POLICY "upsell_rules_staff_read"
  ON public.upsell_rules FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 3. Staff write (insert, update, delete) for rules in their store
CREATE POLICY "upsell_rules_staff_write"
  ON public.upsell_rules FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS upsell_rules_store_active_idx ON public.upsell_rules (store_id, active);
CREATE INDEX IF NOT EXISTS upsell_rules_trigger_idx ON public.upsell_rules (trigger_product_id);

-- Trigger to maintain updated_at
CREATE TRIGGER upsell_rules_updated_at
  BEFORE UPDATE ON public.upsell_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
