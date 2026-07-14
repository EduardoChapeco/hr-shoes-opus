-- ============================================================================
-- Hr Shoes Commerce — Migration 0015: Stories & Link-in-Bio
-- ============================================================================

-- ---------------------------------------------------------------------------
-- link_in_bio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_in_bio (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title            TEXT NOT NULL DEFAULT 'Links da Loja',
  description      TEXT,
  avatar_url       TEXT,
  -- JSON structure for links (label, url, sort_order)
  links            JSONB NOT NULL DEFAULT '[]',
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

ALTER TABLE public.link_in_bio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "link_in_bio_public_read"
  ON public.link_in_bio FOR SELECT
  USING (true);

CREATE POLICY "link_in_bio_staff_write"
  ON public.link_in_bio FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  media_url        TEXT NOT NULL,
  link_url         TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_public_read"
  ON public.stories FOR SELECT
  USING (status = 'active');

CREATE POLICY "stories_staff_write"
  ON public.stories FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Triggers
CREATE TRIGGER link_in_bio_updated_at
  BEFORE UPDATE ON public.link_in_bio
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
