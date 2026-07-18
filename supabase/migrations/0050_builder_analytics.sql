-- ============================================================================
-- Hr Shoes Commerce — Migration 0050: Builder Analytics
-- ============================================================================
-- Tracking table for views, clicks, and conversions of builder components.
-- Optimized for high write throughput (append-only) with RPC ingestion.
-- ============================================================================

BEGIN;

  CREATE TABLE IF NOT EXISTS public.builder_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'view', 'click'
    document_id UUID REFERENCES public.experience_documents(id) ON DELETE CASCADE,
    node_id UUID NOT NULL, -- references experience_nodes.id but loosely coupled to survive versioning
    block_type TEXT NOT NULL, -- e.g., 'bento_grid', 'hero_carousel'
    session_id TEXT NOT NULL, -- Anonymous identifier for unique counting
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. which link was clicked, UTM parameters
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- For analytical aggregation queries
  CREATE INDEX IF NOT EXISTS idx_bldr_analytics_type ON public.builder_analytics_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_bldr_analytics_doc ON public.builder_analytics_events(document_id);
  CREATE INDEX IF NOT EXISTS idx_bldr_analytics_node ON public.builder_analytics_events(node_id);
  CREATE INDEX IF NOT EXISTS idx_bldr_analytics_time ON public.builder_analytics_events(created_at);

  -- RLS: Only admins can view raw events.
  ALTER TABLE public.builder_analytics_events ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Admins can view all builder events"
    ON public.builder_analytics_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );

  -- We do not allow standard direct inserts via Supabase Client for security.
  -- Client apps must call Edge Functions or Server Functions (BFF) to inject data, which uses service_role.

COMMIT;
