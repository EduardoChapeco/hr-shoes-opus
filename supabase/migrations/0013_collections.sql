-- Migration: 0013_collections.sql
-- Description: Cria as tabelas de collections e product_collections

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  slug             TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description      TEXT,
  cover_url        TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Public can read active collections.
CREATE POLICY "collections_public_read"
  ON public.collections FOR SELECT
  USING (status = 'active');

-- Staff write policy.
CREATE POLICY "collections_staff_write"
  ON public.collections FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- product_collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id    UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

-- Public read for product_collections of active collections.
CREATE POLICY "product_collections_public_read"
  ON public.product_collections FOR SELECT
  USING (
    collection_id IN (
      SELECT id FROM public.collections WHERE status = 'active'
    )
  );

-- Staff write policy.
CREATE POLICY "product_collections_staff_write"
  ON public.product_collections FOR ALL
  USING (
    collection_id IN (
      SELECT c.id FROM public.collections c
      JOIN public.profiles pr ON pr.store_id = c.store_id
      WHERE pr.id = auth.uid()
        AND pr.role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- Triggers
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
