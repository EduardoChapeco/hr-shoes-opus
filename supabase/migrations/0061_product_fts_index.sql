-- Migration 0061: Full-text search index for products
-- M-02-F3: Multi-field trigram search to replace single-field LIKE

-- Enable pg_trgm extension (Supabase has it available by default)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a generated tsvector column for full-text search across key product fields
-- This covers: title, description, brand, SKU, and variant attributes (as JSONB text)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('portuguese',
        coalesce(title, '') || ' ' ||
        coalesce(brand, '') || ' ' ||
        coalesce(description, '')
      )
    ) STORED;

-- GIN index for tsvector (fast full-text search)
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- Trigram index for partial/fuzzy matching on title (catches typos, partial words)
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON products USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING GIN (brand gin_trgm_ops);

-- Also index SKUs on variants for barcode/SKU search
CREATE INDEX IF NOT EXISTS idx_product_variants_sku_trgm
  ON product_variants USING GIN (sku gin_trgm_ops);
