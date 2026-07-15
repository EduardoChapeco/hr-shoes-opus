-- ============================================================================
-- Hr Shoes Commerce — Migration 0036: Add Store Columns
-- ============================================================================
-- Adds missing columns on public.stores that are queried by the application
-- but were never defined in the base schema.
-- ============================================================================

BEGIN;

  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS cnpj TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS zip_code TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT;

COMMIT;
