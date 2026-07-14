-- ============================================================================
-- Hr Shoes Commerce — Migration 0006: Operation & Retention (Part 1)
-- ============================================================================
-- Schema: customers_crm, exchanges
--
-- Rules:
--  - LTV and Total Orders are calculated on-the-fly or via views, not stored statically, to avoid divergence.
--  - Exchanges are strictly linked to an existing order.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- customers_crm
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers_crm (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers_crm ENABLE ROW LEVEL SECURITY;

-- Customers can read their own crm profile (not strictly needed since they don't see notes/tags, but safe)
CREATE POLICY "customers_crm_customer_read"
  ON public.customers_crm FOR SELECT
  USING (auth.uid() = id);

-- Staff can read and write all CRM records for their store
CREATE POLICY "customers_crm_staff_all"
  ON public.customers_crm FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- ---------------------------------------------------------------------------
-- exchange_status
-- ---------------------------------------------------------------------------
CREATE TYPE public.exchange_status AS ENUM (
  'requested',
  'approved',
  'received',
  'rejected',
  'refunded'
);

-- ---------------------------------------------------------------------------
-- exchanges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exchanges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              public.exchange_status NOT NULL DEFAULT 'requested',
  reason              TEXT NOT NULL,
  -- Snapshot of requested item and qty (can be expanded to JSONB for multiple items)
  items_requested     JSONB NOT NULL DEFAULT '[]',
  refund_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (refund_amount_cents >= 0),
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ
);

ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

-- Customer can read and insert their own exchanges
CREATE POLICY "exchanges_customer_read"
  ON public.exchanges FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "exchanges_customer_insert"
  ON public.exchanges FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Staff can read and manage all exchanges in their store
CREATE POLICY "exchanges_staff_all"
  ON public.exchanges FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS customers_crm_store_idx ON public.customers_crm (store_id);
CREATE INDEX IF NOT EXISTS exchanges_order_idx ON public.exchanges (order_id);
CREATE INDEX IF NOT EXISTS exchanges_customer_idx ON public.exchanges (customer_id);

-- Triggers
CREATE TRIGGER customers_crm_updated_at
  BEFORE UPDATE ON public.customers_crm
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER exchanges_updated_at
  BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
