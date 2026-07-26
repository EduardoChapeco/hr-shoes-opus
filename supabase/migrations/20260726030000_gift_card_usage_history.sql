-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726030000: Gift Card Usage History
-- ============================================================================
-- Creates a gift_card_usages table to record every partial or full redemption
-- of a gift card. This provides a complete audit trail:
-- - Who used it, when, for which order, and how much was consumed.
-- - Prevents silent overwrites of balance without history.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gift_card_usages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id        UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents        INTEGER NOT NULL CHECK (amount_cents > 0),
  balance_before_cents INTEGER NOT NULL CHECK (balance_before_cents >= 0),
  balance_after_cents  INTEGER NOT NULL CHECK (balance_after_cents >= 0),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_card_usages ENABLE ROW LEVEL SECURITY;

-- Staff can view all usage for their store's gift cards
CREATE POLICY "gc_usages_staff_read"
  ON public.gift_card_usages FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'finance')
    )
  );

-- Service role inserts via checkout RPC — no direct client write
CREATE INDEX IF NOT EXISTS idx_gc_usages_gift_card_id ON public.gift_card_usages(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_usages_order_id     ON public.gift_card_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_gc_usages_store_id     ON public.gift_card_usages(store_id);
