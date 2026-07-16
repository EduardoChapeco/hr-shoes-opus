-- ============================================================================
-- Hr Shoes Commerce — Migration 0041: Add Store SEO Columns
-- ============================================================================
-- Adds missing columns on public.stores that are queried by the application
-- for store-wide SEO settings.
-- ============================================================================

BEGIN;

  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

COMMIT;
