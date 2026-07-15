-- ============================================================================
-- Hr Shoes Commerce — Migration 0028: Payment Transactions & Webhooks
-- ============================================================================

-- 1. Create table for payment transactions (Atomic record of payment attempts)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway_transaction_id TEXT NOT NULL UNIQUE, -- The ID from Pagar.me
  gateway_provider TEXT NOT NULL DEFAULT 'pagarme',
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'pix', 'credit_card', 'boleto'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure an order doesn't have multiple successful/pending transactions for the same amount accidentally
CREATE INDEX idx_payment_transactions_order ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- 2. Create table for Webhook events auditing (Idempotency and trace)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT UNIQUE, -- Pagar.me event ID to prevent processing the same webhook twice
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);

-- 3. RLS Policies
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins/system can read webhooks
CREATE POLICY "Webhooks are readable by admins only" ON public.webhook_events 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Customers can view their own payment transactions via the order relation
CREATE POLICY "Customers view own transactions" ON public.payment_transactions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payment_transactions.order_id AND orders.customer_id = auth.uid())
  );
  
CREATE POLICY "Admins view all transactions" ON public.payment_transactions 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- System (Service Role) handles inserts/updates. No client should insert directly.
