-- ============================================================================
-- Hr Shoes Commerce — Migration 0009: Security Enforcement
-- ============================================================================
-- Fixes missing RLS policies that forced the application to use service_role
-- to bypass security.
-- ============================================================================

-- 1. Organizations: Allow public to read active organizations (or all for now)
CREATE POLICY "organizations_public_read"
  ON public.organizations FOR SELECT
  USING (true);

-- 2. Stores: Allow public to read stores
CREATE POLICY "stores_public_read"
  ON public.stores FOR SELECT
  USING (true);

-- 3. Profiles: Staff need to read their own profiles and customers too, already handled by profiles_self_read.
-- Let's ensure the public can read basic profile info if needed (like seller's name).
-- For now, we'll just allow authenticated users to read profiles in the same store.
CREATE POLICY "profiles_store_read"
  ON public.profiles FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );
