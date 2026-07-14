-- ============================================================================
-- Hr Shoes Commerce — Migration 0021: Match Time Domain Fix
-- ============================================================================

-- Drop the incorrectly modeled table
DROP TABLE IF EXISTS public.match_time_campaigns CASCADE;

-- ---------------------------------------------------------------------------
-- match_time_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_time_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_time_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_time_sessions_customer_all"
  ON public.match_time_sessions FOR ALL
  USING (customer_id = auth.uid());

CREATE POLICY "match_time_sessions_staff_read"
  ON public.match_time_sessions FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- ---------------------------------------------------------------------------
-- match_time_swipes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_time_swipes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES public.match_time_sessions(id) ON DELETE CASCADE,
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action           TEXT NOT NULL CHECK (action IN ('like', 'dislike', 'superlike')),
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (customer_id, product_id) -- One vote per product per customer
);

ALTER TABLE public.match_time_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_time_swipes_customer_all"
  ON public.match_time_swipes FOR ALL
  USING (customer_id = auth.uid());

CREATE POLICY "match_time_swipes_staff_read"
  ON public.match_time_swipes FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER match_time_sessions_updated_at
  BEFORE UPDATE ON public.match_time_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
