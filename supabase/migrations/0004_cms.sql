-- ============================================================================
-- Hr Shoes Commerce — Migration 0004: CMS & Content
-- ============================================================================
-- Schema: pages, page_sections, reviews.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- pages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slug             TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_title        TEXT,
  seo_description  TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_public_read"
  ON public.pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "pages_staff_all"
  ON public.pages FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- page_sections (Builder Blocks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_sections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_type     TEXT NOT NULL CHECK (section_type IN ('hero', 'text', 'product_grid', 'image', 'spacer')),
  content          JSONB NOT NULL DEFAULT '{}',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_sections_public_read"
  ON public.page_sections FOR SELECT
  USING (
    page_id IN (SELECT id FROM public.pages WHERE status = 'published')
  );

CREATE POLICY "page_sections_staff_all"
  ON public.page_sections FOR ALL
  USING (
    page_id IN (
      SELECT p.id FROM public.pages p
      JOIN public.profiles pr ON pr.store_id = p.store_id
      WHERE pr.id = auth.uid() AND pr.role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "reviews_customer_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "reviews_staff_all"
  ON public.reviews FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Triggers
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
