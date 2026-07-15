-- ============================================================================
-- Hr Shoes Commerce — Migration 0022: Seed default tenant & fix trigger
-- ============================================================================

-- 1. Ensure the default Organization exists
INSERT INTO public.organizations (name, slug)
VALUES ('Hr Shoes Organization', 'hr-shoes-org')
ON CONFLICT (slug) DO NOTHING;

-- 2. Ensure the default Store exists
INSERT INTO public.stores (organization_id, name, slug)
SELECT id, 'Hr Shoes', 'hr-shoes'
FROM public.organizations
WHERE slug = 'hr-shoes-org'
ON CONFLICT (organization_id, slug) DO NOTHING;

-- 3. Replace the overly complex trigger function with a strict, predictable one
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  default_org_id UUID;
  default_store_id UUID;
  user_role TEXT;
BEGIN
  -- Check if this is the first user ever registered (no entries in public.profiles yet)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Always grab the strictly seeded default organization and store
  SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'hr-shoes-org' LIMIT 1;
  SELECT id INTO default_store_id FROM public.stores WHERE slug = 'hr-shoes' AND organization_id = default_org_id LIMIT 1;

  IF is_first_user THEN
    user_role := 'owner';
  ELSE
    user_role := 'customer';
    -- Customers are global entities to the platform, they do not belong to a specific store context in profiles.
    default_org_id := NULL;
    default_store_id := NULL;
  END IF;

  -- Create the public profiles entry
  INSERT INTO public.profiles (id, organization_id, store_id, role, full_name)
  VALUES (
    NEW.id,
    default_org_id,
    default_store_id,
    user_role,
    coalesce(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
