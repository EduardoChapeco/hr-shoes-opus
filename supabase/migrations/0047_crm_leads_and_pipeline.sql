-- ============================================================================
-- Hr Shoes Commerce — Migration 0047: CRM Leads and Kanban Pipeline
-- ============================================================================
-- Creates the leads_crm table for contact forms and pipeline segmentation.
-- Hables Row Level Security (RLS) with public insertions allowed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads_crm (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can insert leads (public contact forms)
CREATE POLICY "leads_crm_insert_public"
  ON public.leads_crm FOR INSERT
  WITH CHECK (true);

-- 2. Staff can perform all operations for their store's leads
CREATE POLICY "leads_crm_staff_all"
  ON public.leads_crm FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'support')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER leads_crm_updated_at
  BEFORE UPDATE ON public.leads_crm
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
