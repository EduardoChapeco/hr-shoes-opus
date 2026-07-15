-- ============================================================================
-- Hr Shoes Commerce — Migration 0026: Schema Corrections
-- ============================================================================
-- Adds missing columns that were referenced in application code but never
-- defined in the database schema. All columns use IF NOT EXISTS for idempotency.
-- ============================================================================

-- 1. profiles: add phone column (referenced in auth.functions.ts updateProfile)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. carts: add status column (referenced in cart.functions.ts and checkout.functions.ts)
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned', 'merged'));

-- 3. Create index on cart status for fast lookups
CREATE INDEX IF NOT EXISTS carts_customer_status_idx ON public.carts (customer_id, status);
CREATE INDEX IF NOT EXISTS carts_session_status_idx ON public.carts (session_token, status);
