-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725250000: Full Database Reset
-- ============================================================================
-- Completely wipes all operational data, products, orders, stores, 
-- organizations and auth users, resetting the database to zero.
-- The next user who registers will be the first Master Admin.

BEGIN;

  -- Disable triggers temporarily if needed or let CASCADE handle it
  TRUNCATE auth.users CASCADE;
  TRUNCATE public.organizations CASCADE;

COMMIT;
