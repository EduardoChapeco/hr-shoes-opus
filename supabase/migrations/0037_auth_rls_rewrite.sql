-- ============================================================================
-- Hr Shoes Commerce — Migration 0037: Auth RLS Rewrite
-- ============================================================================
-- Purges all potentially recursive policies on profiles, organizations, and stores
-- and establishes simple, non-recursive, index-backed policies to prevent 42P17.

BEGIN;

  -- 1. Purge all policies on profiles
  DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_org_staff_read" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_store_read" ON public.profiles;
  DROP POLICY IF EXISTS "Enable read access for users based on id" ON public.profiles;
  DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

  -- 2. Purge policies on organizations
  DROP POLICY IF EXISTS "organizations_read_public" ON public.organizations;
  DROP POLICY IF EXISTS "organizations_read_member" ON public.organizations;
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizations;

  -- 3. Purge policies on stores
  DROP POLICY IF EXISTS "stores_read_public" ON public.stores;
  DROP POLICY IF EXISTS "stores_read_member" ON public.stores;
  DROP POLICY IF EXISTS "Enable read access for all users" ON public.stores;

  -- 4. Recreate simple, non-recursive policies for profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  -- Users can read their own profile
  CREATE POLICY "profiles_read_own" ON public.profiles
    FOR SELECT USING (id = auth.uid());

  -- Users can update their own profile
  CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    
  -- 5. Recreate simple policies for organizations
  ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "organizations_read_public" ON public.organizations
    FOR SELECT USING (true); -- Publicly readable for store switching/context
    
  -- 6. Recreate simple policies for stores
  ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "stores_read_public" ON public.stores
    FOR SELECT USING (true); -- Publicly readable for storefronts

COMMIT;
