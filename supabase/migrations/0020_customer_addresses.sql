-- ============================================================================
-- Hr Shoes Commerce — Migration 0020: Customer Addresses
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  zipcode         VARCHAR(20) NOT NULL,
  street          TEXT NOT NULL,
  number          VARCHAR(50) NOT NULL,
  complement      TEXT,
  neighborhood    TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           VARCHAR(2) NOT NULL,
  
  is_default      BOOLEAN NOT NULL DEFAULT false,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can read and manage their own addresses.
CREATE POLICY "customer_addresses_select"
  ON public.customer_addresses FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_insert"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_update"
  ON public.customer_addresses FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_delete"
  ON public.customer_addresses FOR DELETE
  USING (auth.uid() = customer_id);

CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON public.customer_addresses (customer_id);
