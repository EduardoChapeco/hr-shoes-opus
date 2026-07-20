-- Hr Shoes Commerce — Migration 0065: LGPD trigger support

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_setup_completed BOOLEAN;
  v_default_org_id UUID;
  v_default_store_id UUID;
  v_user_role TEXT;
  v_is_lgpd BOOLEAN;
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

  -- Extract LGPD from metadata
  v_is_lgpd := COALESCE((NEW.raw_user_meta_data->>'is_consent_lgpd')::BOOLEAN, false);

  -- Idempotent insert: if profile already exists (e.g. retry), skip silently
  INSERT INTO public.profiles (id, organization_id, store_id, role, full_name, phone, is_consent_lgpd)
  VALUES (
    NEW.id,
    v_default_org_id,
    v_default_store_id,
    v_user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    v_is_lgpd
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
