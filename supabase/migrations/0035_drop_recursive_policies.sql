-- ============================================================================
-- Hr Shoes Commerce — Migration 0035: Drop Recursive Policies on Profiles
-- ============================================================================
-- Explicitly drops the recursive policies on public.profiles that were skipped
-- in migration 0030 due to version shadowing.
-- ============================================================================

BEGIN;

  DROP POLICY IF EXISTS "profiles_org_staff_read" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_store_read" ON public.profiles;

COMMIT;
