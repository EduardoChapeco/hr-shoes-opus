-- ============================================================================
-- Hr Shoes Commerce — Migration 0008: Operation & Retention (Part 3)
-- ============================================================================
-- Schema: gift_cards, installment_plans, installments
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.gift_card_status AS ENUM (
  'active',
  'exhausted',
  'cancelled'
);

CREATE TYPE public.installment_plan_status AS ENUM (
  'active',
  'paid_off',
  'defaulted'
);

CREATE TYPE public.installment_status AS ENUM (
  'pending',
  'paid',
  'late'
);

-- ---------------------------------------------------------------------------
-- gift_cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code                    VARCHAR(20) NOT NULL,
  initial_balance_cents   INTEGER NOT NULL CHECK (initial_balance_cents >= 0),
  current_balance_cents   INTEGER NOT NULL CHECK (current_balance_cents >= 0),
  purchaser_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email         VARCHAR(255),
  expires_at              TIMESTAMPTZ,
  status                  public.gift_card_status NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Staff (any admin/seller) can read all gift cards for their store
CREATE POLICY "giftcards_staff_select"
  ON public.gift_cards FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
    )
  );

-- Only Managers/Owners/Finance can CREATE or CANCEL gift cards directly
CREATE POLICY "giftcards_management_all"
  ON public.gift_cards FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

-- ---------------------------------------------------------------------------
-- installment_plans (Carnês)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id            UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents         INTEGER NOT NULL CHECK (total_cents > 0),
  installments_count  INTEGER NOT NULL CHECK (installments_count > 0),
  status              public.installment_plan_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

-- Customers can view their own installment plans
CREATE POLICY "installment_plans_customer_select"
  ON public.installment_plans FOR SELECT
  USING (auth.uid() = customer_id);

-- Staff can view/manage all installment plans in their store
CREATE POLICY "installment_plans_staff_all"
  ON public.installment_plans FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
    )
  );

-- ---------------------------------------------------------------------------
-- installments (Parcelas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.installments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date        DATE NOT NULL,
  paid_at         TIMESTAMPTZ,
  status          public.installment_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own installments via plan_id -> customer_id
CREATE POLICY "installments_customer_select"
  ON public.installments FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM public.installment_plans WHERE customer_id = auth.uid()
    )
  );

-- Staff can view/manage all installments in their store via plan_id -> store_id
CREATE POLICY "installments_staff_all"
  ON public.installments FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM public.installment_plans WHERE store_id IN (
        SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Indexes & Triggers
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS gift_cards_code_idx ON public.gift_cards (store_id, code);
CREATE INDEX IF NOT EXISTS installment_plans_customer_idx ON public.installment_plans (store_id, customer_id);
CREATE INDEX IF NOT EXISTS installments_plan_status_idx ON public.installments (plan_id, status);

CREATE TRIGGER gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER installment_plans_updated_at
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
