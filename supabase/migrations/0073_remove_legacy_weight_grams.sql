-- ============================================================================
-- Hr Shoes Commerce — Migration 0073: Remove Legacy weight_grams columns
-- ============================================================================
-- The original migration 0002 created weight_grams (integer, grams) on both
-- products and product_variants. Migration 0062 added proper weight_kg columns.
-- Both coexist creating confusion. This migration drops the legacy columns
-- AFTER verifying no active code path references them.
-- ============================================================================

-- Drop from products (replaced by weight_kg from migration 0062)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS weight_grams;

-- Drop from product_variants (replaced by weight_kg from migration 0062)
ALTER TABLE public.product_variants
  DROP COLUMN IF EXISTS weight_grams;

-- Unify SEO fields: seo_title/seo_description (0002) are now aliases for
-- meta_title/meta_description (0062). We keep them as computed columns via a view
-- but mark seo_title/seo_description as deprecated by renaming them to be consistent.
-- For now we just ensure the columns exist with the right priority in the TS layer.
-- The products table retains: seo_title, seo_description, meta_title, meta_description
-- Application layer uses: COALESCE(meta_title, seo_title) as the canonical SEO title.
-- No structural change needed here — handled at service layer.

COMMENT ON COLUMN public.products.seo_title IS 'DEPRECATED: Use meta_title. Kept for backwards compatibility.';
COMMENT ON COLUMN public.products.seo_description IS 'DEPRECATED: Use meta_description. Kept for backwards compatibility.';
COMMENT ON COLUMN public.products.meta_title IS 'Canonical SEO title. Fallback: seo_title then products.title.';
COMMENT ON COLUMN public.products.meta_description IS 'Canonical SEO meta description.';
