-- ============================================================================
-- Hr Shoes Commerce — Migration 0002: Catalog
-- ============================================================================
-- Schema: product types (adaptive forms), categories (tree), products,
-- variants, media and stock movements.
--
-- Rules:
--  - Money is stored as INTEGER CENTS. Never float. Currency = BRL.
--  - `available_qty` is ALWAYS computed as on_hand - reserved in the server layer.
--    It is never computed or trusted from the frontend.
--  - stock_movements is IMMUTABLE (no UPDATE/DELETE policies).
--  - All tables scoped by organization_id + store_id.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- product_types  (adaptive form schema per product type)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_types (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  slug             TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  -- JSON Schema / Zod-compatible field definitions from ProductFieldRegistry
  field_schema     JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

-- Staff can read product types in their store.
CREATE POLICY "product_types_staff_read"
  ON public.product_types FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_types_manager_write"
  ON public.product_types FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- categories  (self-referential tree, depth limited at app layer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id        UUID REFERENCES public.categories(id) ON DELETE SET NULL,
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

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories.
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  USING (status = 'active');

-- Staff write policy.
CREATE POLICY "categories_staff_write"
  ON public.categories FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type_id          UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  slug             TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
  brand            TEXT,
  -- Price in integer cents (BRL). Never float.
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  compare_at_cents INTEGER CHECK (compare_at_cents >= 0),
  -- Product cost (for margin reports) — never exposed to the storefront.
  cost_cents       INTEGER CHECK (cost_cents >= 0),
  -- Dynamic attributes matching the product_type field_schema.
  attributes       JSONB NOT NULL DEFAULT '{}',
  -- SEO metadata.
  seo_title        TEXT,
  seo_description  TEXT,
  -- Physical dimensions (grams, millimeters).
  weight_grams     INTEGER CHECK (weight_grams >= 0),
  allows_preorder  BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can read published products.
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (status = 'published');

-- Staff read all statuses within their store.
CREATE POLICY "products_staff_read"
  ON public.products FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Staff write.
CREATE POLICY "products_staff_write"
  ON public.products FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku                 TEXT NOT NULL,
  barcode             TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'archived')),
  -- If NULL, inherits from product.price_cents.
  price_override_cents INTEGER CHECK (price_override_cents >= 0),
  cost_cents           INTEGER CHECK (cost_cents >= 0),
  weight_grams         INTEGER CHECK (weight_grams >= 0),
  -- Variant-specific attribute values (e.g. {"color": "Preto", "size": "38"}).
  attributes           JSONB NOT NULL DEFAULT '{}',
  -- Stock counters — updated only via stock_movements (never directly).
  stock_on_hand        INTEGER NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  stock_reserved       INTEGER NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  -- Reorder threshold for alerts.
  stock_alert_qty      INTEGER CHECK (stock_alert_qty >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, sku)
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public can read active variants of published products.
CREATE POLICY "variants_public_read"
  ON public.product_variants FOR SELECT
  USING (
    status = 'active'
    AND product_id IN (
      SELECT id FROM public.products WHERE status = 'published'
    )
  );

-- Staff read.
CREATE POLICY "variants_staff_read"
  ON public.product_variants FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.profiles pr ON pr.store_id = p.store_id
      WHERE pr.id = auth.uid()
    )
  );

-- Staff write.
CREATE POLICY "variants_staff_write"
  ON public.product_variants FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.profiles pr ON pr.store_id = p.store_id
      WHERE pr.id = auth.uid()
        AND pr.role IN ('owner', 'admin', 'manager', 'stock', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- product_media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id   UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  url          TEXT NOT NULL,
  alt          TEXT,
  media_type   TEXT NOT NULL DEFAULT 'image'
                 CHECK (media_type IN ('image', 'video')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  -- Focal point for responsive crops: {x: 0.5, y: 0.3} (0–1 range).
  focal_point  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Public read (images for published products).
CREATE POLICY "media_public_read"
  ON public.product_media FOR SELECT
  USING (
    product_id IN (SELECT id FROM public.products WHERE status = 'published')
  );

-- Staff write.
CREATE POLICY "media_staff_write"
  ON public.product_media FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.profiles pr ON pr.store_id = p.store_id
      WHERE pr.id = auth.uid()
        AND pr.role IN ('owner', 'admin', 'manager', 'stock', 'content')
    )
  );

-- ---------------------------------------------------------------------------
-- stock_movements  (IMMUTABLE — append-only ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  store_id       UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  movement_type  TEXT NOT NULL CHECK (movement_type IN (
                   'purchase',      -- supplier receiving
                   'sale',          -- confirmed sale (reservation → out)
                   'reserve',       -- checkout reservation
                   'release',       -- cancelled reservation
                   'return',        -- customer return
                   'exchange_in',   -- exchange: product comes back
                   'exchange_out',  -- exchange: new product goes out
                   'adjustment',    -- manual inventory count correction
                   'transfer',      -- inter-location transfer
                   'damage'         -- damaged/lost write-off
                 )),
  qty            INTEGER NOT NULL, -- positive = in, negative = out
  -- Reference to the originating document (order_id, adjustment_id, etc.)
  reference_type TEXT,
  reference_id   UUID,
  note           TEXT,
  actor_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Staff can read movements within their store.
CREATE POLICY "stock_movements_staff_read"
  ON public.stock_movements FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- INSERT only from server (service_role) — no client-side stock manipulation.
-- UPDATE/DELETE intentionally have no policy → denied for everyone (immutable ledger).

-- Indexes
CREATE INDEX IF NOT EXISTS products_store_status_idx   ON public.products (store_id, status);
CREATE INDEX IF NOT EXISTS products_slug_idx           ON public.products (slug);
CREATE INDEX IF NOT EXISTS variants_product_idx        ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS stock_movements_variant_idx ON public.stock_movements (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS categories_store_status_idx ON public.categories (store_id, status, sort_order);

-- Triggers
CREATE TRIGGER product_types_updated_at
  BEFORE UPDATE ON public.product_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
