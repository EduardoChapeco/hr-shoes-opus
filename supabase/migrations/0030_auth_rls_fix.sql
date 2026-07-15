-- ============================================================================
-- Hr Shoes Commerce — Migration 0030: Auth RLS Fix
-- ============================================================================
-- Fixes the 42P17 infinite recursion error on public.profiles.
-- The policies `profiles_org_staff_read` and `profiles_store_read` queried
-- the `public.profiles` table inside the policy definition of `public.profiles`,
-- creating an infinite loop. Since cross-tenant reads happen safely via Server Functions
-- using `service_role`, we can safely drop these recursive policies.
-- The only policy needed for `anon` users is `profiles_self_read`.
-- ============================================================================

DROP POLICY IF EXISTS "profiles_org_staff_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_store_read" ON public.profiles;
