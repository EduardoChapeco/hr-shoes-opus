-- ============================================================================
-- Hr Shoes Commerce — Migration 0049: Builder Platform Phase 2
-- ============================================================================
-- Adds support for advanced commerce templates and campaign popups.
-- Extends experience_documents to support trigger rules for overlays.
-- ============================================================================

BEGIN;

  -- 1. Add trigger_rules to experience_documents for Campaign Popups
  ALTER TABLE public.experience_documents
    ADD COLUMN IF NOT EXISTS trigger_rules JSONB DEFAULT '{}'::jsonb;

COMMIT;
