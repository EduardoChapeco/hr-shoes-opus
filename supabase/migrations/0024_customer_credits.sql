-- Hr Shoes Commerce — Migration 0021: Customer Credits

CREATE TABLE IF NOT EXISTS public.customer_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, store_id)
);

CREATE TABLE IF NOT EXISTS public.customer_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_credit_id UUID NOT NULL REFERENCES public.customer_credits(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_credits_select"
  ON public.customer_credits FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "customer_credit_transactions_select"
  ON public.customer_credit_transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT customer_id FROM public.customer_credits WHERE id = customer_credit_transactions.customer_credit_id
    )
  );

CREATE TRIGGER customer_credits_updated_at
  BEFORE UPDATE ON public.customer_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
