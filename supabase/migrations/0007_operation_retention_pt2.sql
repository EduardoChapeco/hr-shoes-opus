-- ============================================================================
-- Hr Shoes Commerce — Migration 0007: Operation & Retention (Part 2)
-- ============================================================================
-- Schema: cash_registers, cash_register_entries, commissions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.cash_register_status AS ENUM (
  'open',
  'closed',
  'discrepancy'
);

CREATE TYPE public.cash_register_entry_method AS ENUM (
  'cash',
  'credit',
  'debit',
  'pix',
  'other'
);

CREATE TYPE public.commission_status AS ENUM (
  'pending',
  'paid',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- cash_registers (Shifts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  opened_by               UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  closed_by               UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  opened_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at               TIMESTAMPTZ,
  status                  public.cash_register_status NOT NULL DEFAULT 'open',
  initial_balance_cents   INTEGER NOT NULL DEFAULT 0 CHECK (initial_balance_cents >= 0),
  expected_balance_cents  INTEGER,
  final_balance_cents     INTEGER,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Staff can read/write cash registers for their store
CREATE POLICY "cash_registers_staff_all"
  ON public.cash_registers FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
    )
  );

-- ---------------------------------------------------------------------------
-- cash_register_entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_register_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id     UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_cents    INTEGER NOT NULL, -- positive for income, negative for withdrawal/expense
  method          public.cash_register_entry_method NOT NULL DEFAULT 'cash',
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_register_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_register_entries_staff_all"
  ON public.cash_register_entries FOR ALL
  USING (
    register_id IN (
      SELECT id FROM public.cash_registers WHERE store_id IN (
        SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- commissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents >= 0),
  status          public.commission_status NOT NULL DEFAULT 'pending',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Seller can only read their own commissions
CREATE POLICY "commissions_seller_read"
  ON public.commissions FOR SELECT
  USING (auth.uid() = seller_id);

-- Managers/Owners can manage all commissions in the store
CREATE POLICY "commissions_management_all"
  ON public.commissions FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );


-- ---------------------------------------------------------------------------
-- Indexes & Triggers
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS cash_registers_store_status_idx ON public.cash_registers (store_id, status);
CREATE INDEX IF NOT EXISTS cash_register_entries_reg_idx ON public.cash_register_entries (register_id);
CREATE INDEX IF NOT EXISTS commissions_seller_status_idx ON public.commissions (seller_id, status);

CREATE TRIGGER cash_registers_updated_at
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
