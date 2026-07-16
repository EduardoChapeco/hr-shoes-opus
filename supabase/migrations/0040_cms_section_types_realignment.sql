-- ============================================================================
-- Hr Shoes Commerce — Migration 0040: CMS Section Types Realignment
-- ============================================================================
-- The original migration 0004 defined page_sections.section_type as:
--   ('hero', 'text', 'product_grid', 'image', 'spacer')
--
-- However, the application cms-registry.ts defines the following types:
--   ('hero_carousel', 'announcement_bar', 'featured_products', 'mosaic_banners', 'rich_text')
--
-- This migration drops the outdated constraint and replaces it with the
-- canonical set matching the live application registry.
-- ============================================================================

BEGIN;

  -- 1. Drop the existing check constraint on section_type
  ALTER TABLE public.page_sections
    DROP CONSTRAINT IF EXISTS page_sections_section_type_check;

  -- 2. Add the updated constraint matching cms-registry.ts
  ALTER TABLE public.page_sections
    ADD CONSTRAINT page_sections_section_type_check
    CHECK (section_type IN (
      'hero_carousel',
      'announcement_bar',
      'featured_products',
      'mosaic_banners',
      'rich_text',
      'product_grid'
    ));

  -- 3. Also add missing columns: business_hours and social_links on stores
  --    (these are queried by getPublicProfile but may not exist)
  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS business_hours TEXT,
    ADD COLUMN IF NOT EXISTS social_links   JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS logo_url       TEXT;

COMMIT;
