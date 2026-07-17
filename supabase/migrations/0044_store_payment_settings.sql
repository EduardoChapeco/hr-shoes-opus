-- ============================================================================
-- Hr Shoes Commerce — Migration 0044: Store Payment Settings
-- ============================================================================
-- Adds pix_key and payment_instructions columns to stores table.
-- Creates a private 'receipts' bucket for customer payment proof uploads.
-- ============================================================================

BEGIN;

  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS pix_key TEXT,
    ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

  -- Private bucket for payment receipts (customer proof of payment uploads)
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('receipts', 'receipts', false)
  ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Storage RLS policies (outside transaction since some Postgres configs require it)
-- Drop first to be idempotent
DO $$
BEGIN
  -- Customers can upload their own receipts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Customers can upload receipts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Customers can upload receipts"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'receipts');
    $policy$;
  END IF;

  -- Customers can read their own receipt files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Customers can read own receipts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Customers can read own receipts"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      );
    $policy$;
  END IF;

  -- Admins can read all receipts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can read all receipts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can read all receipts"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'receipts'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = (SELECT auth.uid())
            AND role IN ('owner', 'admin', 'manager', 'finance')
        )
      );
    $policy$;
  END IF;
END;
$$;
