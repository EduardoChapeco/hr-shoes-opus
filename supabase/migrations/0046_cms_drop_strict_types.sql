-- ============================================================================
-- Hr Shoes Commerce — Migration 0046: Drop strict page_sections types check
-- ============================================================================
-- Removes check constraints on page_sections.section_type to allow modular 
-- frontend-defined custom blocks without database migrations.
-- ============================================================================

BEGIN;

  ALTER TABLE public.page_sections
    DROP CONSTRAINT IF EXISTS page_sections_section_type_check;

COMMIT;
