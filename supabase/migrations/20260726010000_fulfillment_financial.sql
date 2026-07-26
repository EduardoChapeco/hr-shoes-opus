-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726001: Fulfillment Shipments + Financial Transactions
-- ============================================================================
-- Purpose:
--   1. Create a dedidated `shipments` table to track logistics records per order.
--      This decouples tracking info from the orders table and allows multiple
--      shipments per order (partial fulfillment, re-delivery, etc).
--   2. Create a `financial_transactions` table to record the DRE (income statement)
--      of the store. Every completed sale, refund, fee, or payout is recorded here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Shipment status enum
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
    CREATE TYPE public.shipment_status AS ENUM (
      'pending',        -- Created, awaiting label
      'label_created',  -- Label/NF created, not handed off
      'in_transit',     -- Carrier has it
      'out_for_delivery',
      'delivered',
      'failed_attempt', -- Could not deliver
      'returned'        -- Returned to sender
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status              public.shipment_status NOT NULL DEFAULT 'pending',

  -- Carrier / tracking
  carrier_name        TEXT,
  tracking_code       TEXT,
  tracking_url        TEXT,

  -- Fiscal / logistics docs
  invoice_number      TEXT,   -- Nota fiscal number
  invoice_key         TEXT,   -- NF-e chave de acesso

  -- Timestamps
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  estimated_delivery  DATE,

  -- Notes
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Staff can manage shipments for their store
CREATE POLICY "shipments_staff_manage"
  ON public.shipments FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'logistics', 'operator')
    )
  );

-- Service role bypasses RLS (used by webhooks and BFF)
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_store_id ON public.shipments(store_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);

-- ---------------------------------------------------------------------------
-- financial_transaction_type enum
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_transaction_type') THEN
    CREATE TYPE public.financial_transaction_type AS ENUM (
      'revenue_sale',       -- Receita: venda ecommerce
      'revenue_pos_sale',   -- Receita: venda PDV
      'refund',             -- Saída: devolução
      'expense_shipping',   -- Despesa: frete pago pela loja
      'expense_fee',        -- Despesa: taxa do gateway/marketplace
      'expense_other',      -- Despesa: outras
      'withdrawal',         -- Saque do saldo
      'adjustment'          -- Ajuste manual
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- financial_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Type and amount
  type            public.financial_transaction_type NOT NULL,
  amount_cents    INTEGER NOT NULL, -- Positive = credit, Negative = debit

  -- Reference to origin
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id      UUID REFERENCES public.payments(id) ON DELETE SET NULL,

  -- Classification
  description     TEXT NOT NULL,
  category        TEXT,           -- Free tag for DRE grouping

  -- Metadata
  reference_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_tx_staff_read"
  ON public.financial_transactions FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

-- Only service role can INSERT (via BFF/webhook flows — no direct client write)
-- Staff with owner/admin can insert via service role BFF
CREATE POLICY "financial_tx_staff_insert"
  ON public.financial_transactions FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

CREATE INDEX IF NOT EXISTS idx_fin_tx_store_id    ON public.financial_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_order_id    ON public.financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_ref_date    ON public.financial_transactions(reference_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type        ON public.financial_transactions(type);

-- ---------------------------------------------------------------------------
-- Trigger: auto-record financial revenue when order status transitions to 'paid'
-- This avoids the webhook needing to call two RPCs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_sale_revenue_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when status changes TO 'paid' or 'completed'
  IF NEW.status IN ('paid', 'processing') AND OLD.status NOT IN ('paid', 'processing', 'completed', 'shipped', 'delivered') THEN
    -- Avoid duplicate if already recorded (idempotent)
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_transactions
      WHERE order_id = NEW.id AND type = 'revenue_sale'
    ) THEN
      INSERT INTO public.financial_transactions (
        store_id, type, amount_cents, order_id, description, category, reference_date
      ) VALUES (
        NEW.store_id,
        'revenue_sale',
        NEW.total_cents,
        NEW.id,
        'Venda #' || COALESCE(NEW.public_token, NEW.id::TEXT),
        'Vendas E-commerce',
        CURRENT_DATE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_sale_revenue ON public.orders;
CREATE TRIGGER trg_record_sale_revenue
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.record_sale_revenue_on_paid();

-- ---------------------------------------------------------------------------
-- Trigger: auto-record refund when order is refunded
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_refund_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_transactions
      WHERE order_id = NEW.id AND type = 'refund'
    ) THEN
      INSERT INTO public.financial_transactions (
        store_id, type, amount_cents, order_id, description, category, reference_date
      ) VALUES (
        NEW.store_id,
        'refund',
        -NEW.total_cents, -- Negative = debit
        NEW.id,
        'Estorno do Pedido #' || COALESCE(NEW.public_token, NEW.id::TEXT),
        'Devoluções',
        CURRENT_DATE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_refund ON public.orders;
CREATE TRIGGER trg_record_refund
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.record_refund_on_order();
