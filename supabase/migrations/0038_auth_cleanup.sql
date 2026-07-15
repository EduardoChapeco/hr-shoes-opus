-- ============================================================================
-- Hr Shoes Commerce — Migration 0038: Auth Cleanup & Hardening
-- ============================================================================
-- 1. Remove duplicate policies created by migrations 0009 and 0037
-- 2. Make handle_new_user idempotent (ON CONFLICT DO NOTHING on profiles)
-- 3. Ensure setup_status flag is correct
-- ============================================================================

BEGIN;

  -- ---------------------------------------------------------------------------
  -- 1. Remove duplicate policies on profiles
  -- Migration 0001 created: profiles_self_read, profiles_self_update
  -- Migration 0037 created: profiles_read_own, profiles_update_own (same semantics)
  -- Keep the cleaner 0037 names, drop the 0001 originals.
  -- ---------------------------------------------------------------------------
  DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
  -- 0037's policies already exist:
  --   "profiles_read_own"   FOR SELECT USING (id = auth.uid())
  --   "profiles_update_own" FOR UPDATE USING (id = auth.uid())

  -- ---------------------------------------------------------------------------
  -- 2. Remove duplicate policies on organizations
  -- Migration 0009 created: organizations_public_read
  -- Migration 0037 created: organizations_read_public (same semantics)
  -- Keep 0037, drop 0009.
  -- ---------------------------------------------------------------------------
  DROP POLICY IF EXISTS "organizations_public_read" ON public.organizations;

  -- ---------------------------------------------------------------------------
  -- 3. Remove duplicate policies on stores
  -- Migration 0009 created: stores_public_read
  -- Migration 0037 created: stores_read_public (same semantics)
  -- Keep 0037, drop 0009.
  -- ---------------------------------------------------------------------------
  DROP POLICY IF EXISTS "stores_public_read" ON public.stores;

  -- ---------------------------------------------------------------------------
  -- 4. Rewrite handle_new_user with idempotency
  -- The INSERT INTO profiles now uses ON CONFLICT DO NOTHING to survive retries.
  -- ---------------------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  DECLARE
    v_is_setup_completed BOOLEAN;
    v_default_org_id UUID;
    v_default_store_id UUID;
    v_user_role TEXT;
  BEGIN
    -- Read setup flag
    SELECT (value->>'is_completed')::BOOLEAN INTO v_is_setup_completed
    FROM public.system_flags
    WHERE key = 'setup_status';

    IF v_is_setup_completed IS NULL OR v_is_setup_completed = false THEN
      -- First user → owner
      v_user_role := 'owner';

      -- Ensure default organization exists
      INSERT INTO public.organizations (name, slug)
      VALUES ('Hr Shoes Organization', 'hr-shoes-org')
      ON CONFLICT (slug) DO NOTHING;
      SELECT id INTO v_default_org_id FROM public.organizations WHERE slug = 'hr-shoes-org' LIMIT 1;

      -- Ensure default store exists
      INSERT INTO public.stores (organization_id, name, slug)
      VALUES (v_default_org_id, 'Hr Shoes', 'hr-shoes')
      ON CONFLICT (organization_id, slug) DO NOTHING;
      SELECT id INTO v_default_store_id FROM public.stores
        WHERE slug = 'hr-shoes' AND organization_id = v_default_org_id LIMIT 1;

      -- Mark setup as complete (idempotent)
      INSERT INTO public.system_flags (key, value)
      VALUES ('setup_status', '{"is_completed": true}')
      ON CONFLICT (key) DO UPDATE SET value = '{"is_completed": true}', updated_at = now();

    ELSE
      -- Subsequent users → customer, no org/store link
      v_user_role := 'customer';
      v_default_org_id := NULL;
      v_default_store_id := NULL;
    END IF;

    -- Idempotent insert: if profile already exists (e.g. retry), skip silently
    INSERT INTO public.profiles (id, organization_id, store_id, role, full_name, phone)
    VALUES (
      NEW.id,
      v_default_org_id,
      v_default_store_id,
      v_user_role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
