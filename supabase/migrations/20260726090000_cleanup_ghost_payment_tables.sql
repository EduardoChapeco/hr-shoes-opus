-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726090000: Cleanup Ghost Payment Tables
-- ============================================================================
-- Drop the unused 'payment_transactions' table created in migration 0028
-- and consolidates the schema around the canonical 'payments' table.
-- ============================================================================

-- Drop the unused table and its indices/policies
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Ensure the 'payments' table has the 'paid_at' index for performance
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- Add a comment to the canonical payments table to prevent future confusion
COMMENT ON TABLE public.payments IS 'Canonical table for all financial transactions and payment intents (Pix, Credit Card, Gateway, Manual POS). Replaces the old payment_transactions concept.';
