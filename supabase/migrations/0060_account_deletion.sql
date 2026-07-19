-- Migration 0060: Account deletion support + enriched profile fields
-- M-01-F2: LGPD Art. 18 right to erasure
-- M-01-F3: Enriched customer profile

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Enriched profile columns
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url        text,
  ADD COLUMN IF NOT EXISTS cpf               text,          -- stored as digits only, anonymized on deletion
  ADD COLUMN IF NOT EXISTS birth_date        date,
  ADD COLUMN IF NOT EXISTS gender            text CHECK (gender IN ('feminino', 'masculino', 'outro', 'prefiro_nao_dizer')),
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false,
  -- LGPD deletion fields
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at            timestamptz;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Account deletion audit log (LGPD compliance)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_deletion_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL,   -- intentionally NOT a FK (account may be deleted)
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  reason       text,
  created_by   uuid,            -- same user = self-deletion
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- This table is sensitive; only service role can read/write it.
ALTER TABLE account_deletion_log ENABLE ROW LEVEL SECURITY;

-- No public or customer access — service role only (bypasses RLS)
CREATE POLICY "no_public_access_deletion_log"
  ON account_deletion_log
  FOR ALL
  TO authenticated
  USING (false);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RLS policy: customers can update their own profile (new fields)
--    (existing SELECT policy already covers the new columns)
-- ────────────────────────────────────────────────────────────────────────────

-- Ensure customers can update their own enriched profile fields.
-- The existing UPDATE policy on profiles covers this; no change needed
-- if the policy is: USING (auth.uid() = id).
-- Adding a comment to document intent.
COMMENT ON COLUMN profiles.cpf IS 'Optional CPF for NF generation. Anonymized to NULL on LGPD deletion.';
COMMENT ON COLUMN profiles.birth_date IS 'Customer birth date. Anonymized on LGPD deletion.';
COMMENT ON COLUMN profiles.newsletter_opt_in IS 'Customer consent to marketing emails.';
COMMENT ON COLUMN profiles.deleted_at IS 'Set when LGPD deletion is completed. Profile row is kept for FK integrity with orders.';
