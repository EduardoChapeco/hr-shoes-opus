-- ============================================================================
-- Hr Shoes Commerce — Migration 0027: Auth Refactor & Setup Flag
-- ============================================================================

-- 1. Create system flags table to lock the setup process
CREATE TABLE IF NOT EXISTS public.system_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Protect system_flags from external modification
ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System flags are viewable by everyone" ON public.system_flags FOR SELECT USING (true);
CREATE POLICY "System flags are editable by admins only" ON public.system_flags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
  )
);

-- 2. Redefine the handle_new_user function securely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_setup_completed BOOLEAN;
  v_default_org_id UUID;
  v_default_store_id UUID;
  v_user_role TEXT;
BEGIN
  -- Check if setup is already completed (via flag)
  SELECT (value->>'is_completed')::BOOLEAN INTO v_is_setup_completed
  FROM public.system_flags
  WHERE key = 'setup_status';

  IF v_is_setup_completed IS NULL OR v_is_setup_completed = false THEN
    -- First user scenario
    v_user_role := 'owner';

    -- Ensure default organization exists
    SELECT id INTO v_default_org_id FROM public.organizations WHERE slug = 'hr-shoes-org' LIMIT 1;
    IF v_default_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug)
      VALUES ('Hr Shoes Organization', 'hr-shoes-org')
      RETURNING id INTO v_default_org_id;
    END IF;

    -- Ensure default store exists
    SELECT id INTO v_default_store_id FROM public.stores WHERE slug = 'hr-shoes' LIMIT 1;
    IF v_default_store_id IS NULL THEN
      INSERT INTO public.stores (organization_id, name, slug)
      VALUES (v_default_org_id, 'Hr Shoes', 'hr-shoes')
      RETURNING id INTO v_default_store_id;
    END IF;

    -- Lock the setup forever
    INSERT INTO public.system_flags (key, value)
    VALUES ('setup_status', '{"is_completed": true}')
    ON CONFLICT (key) DO UPDATE SET value = '{"is_completed": true}', updated_at = now();

  ELSE
    -- Standard user scenario (after setup is completed)
    v_user_role := 'customer';
    v_default_org_id := NULL;
    v_default_store_id := NULL;
  END IF;

  -- Create the profile record bound to the auth trigger
  INSERT INTO public.profiles (id, organization_id, store_id, role, full_name, phone)
  VALUES (
    NEW.id,
    v_default_org_id,
    v_default_store_id,
    v_user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- The trigger "on_auth_user_created" from 0010 remains active, 
-- but now runs the updated lock-safe function.
