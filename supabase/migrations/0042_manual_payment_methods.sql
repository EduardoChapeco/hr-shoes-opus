-- ============================================================================
-- Hr Shoes Commerce — Migration 0042: Manual Payment Methods Table
-- ============================================================================
-- Adds the public.manual_payment_methods table to support custom manual Pix
-- and Ficha/Carnê payment options with custom surcharges and discounts.
-- ============================================================================

BEGIN;

  CREATE TABLE IF NOT EXISTS public.manual_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instructions TEXT,
    surcharge_percentage NUMERIC NOT NULL DEFAULT 0.0 CHECK (surcharge_percentage >= 0.0),
    discount_percentage NUMERIC NOT NULL DEFAULT 0.0 CHECK (discount_percentage >= 0.0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- RLS
  ALTER TABLE public.manual_payment_methods ENABLE ROW LEVEL SECURITY;

  -- Public read (storefront checkout)
  CREATE POLICY "manual_payment_methods_public_read"
    ON public.manual_payment_methods FOR SELECT
    USING (is_active = true);

  -- Admin/Staff write (ALL)
  CREATE POLICY "manual_payment_methods_staff_write"
    ON public.manual_payment_methods FOR ALL
    USING (
      store_id IN (
        SELECT store_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    );

  -- Set updated_at trigger
  CREATE TRIGGER manual_payment_methods_updated_at
    BEFORE UPDATE ON public.manual_payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
