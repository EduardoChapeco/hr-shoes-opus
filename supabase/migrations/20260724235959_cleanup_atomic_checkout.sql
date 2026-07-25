-- ============================================================================
-- Hr Shoes Commerce — Migration 0076: Cleanup Atomic Checkout Overloads
-- ============================================================================
-- Resolve o erro de PostgreSQL: "function is not unique".
-- Remove assinaturas antigas residuais de `process_checkout_atomic` geradas 
-- acidentalmente por falta de DROP antes de CREATE OR REPLACE nas migrações 
-- anteriores.
-- ============================================================================

BEGIN;

-- Dropping the 1 parameter signature (from 0025, 0033)
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID);

-- Dropping the 2 parameter signature (from 0039, 0071)
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID, UUID);

-- Dropping the 11 parameter signature (from 0043)
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID, TEXT);

-- Confirm that ONLY the 9 parameter signature remains (from 0056, 0074)
-- The signature that we KEEP is:
-- (UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT)

COMMIT;
