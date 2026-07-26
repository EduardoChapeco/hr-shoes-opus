-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726020000: CRM Lead Pipeline Enrichment
-- ============================================================================
-- Adds enrichment fields to leads_crm:
-- - notes: internal notes from staff on the lead
-- - estimated_value_cents: potential deal value (for pipeline Kanban valuation)
-- - source: origin of the lead (e.g., 'instagram', 'site', 'whatsapp', 'indicação')
-- - assigned_to: FK to profiles for lead assignment
-- - follow_up_at: scheduled follow-up datetime
-- - orders table: seller_id column for affiliate attribution (if not exists)
-- ============================================================================

-- 1. Enrich leads_crm table
ALTER TABLE public.leads_crm
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS estimated_value_cents INTEGER CHECK (estimated_value_cents >= 0),
  ADD COLUMN IF NOT EXISTS source             TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_at      TIMESTAMPTZ;

-- Index for follow-up queries (e.g. "show me leads to follow up today")
CREATE INDEX IF NOT EXISTS idx_leads_crm_follow_up
  ON public.leads_crm(store_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;

-- Index for assigned leads
CREATE INDEX IF NOT EXISTS idx_leads_crm_assigned_to
  ON public.leads_crm(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- 2. Ensure seller_id column in orders exists for affiliate attribution
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_seller_id
  ON public.orders(seller_id)
  WHERE seller_id IS NOT NULL;

-- 3. Commission rate on profiles — ensure column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100);
