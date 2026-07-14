-- ============================================================================
-- Hr Shoes Commerce — Migration 0010: Auto-profile and first-user owner trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  default_org_id UUID;
  default_store_id UUID;
  user_role TEXT;
BEGIN
  -- Set secure search path
  SET search_path = public, pg_temp;

  -- Check if this is the first user ever registered (no entries in public.profiles yet)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  IF is_first_user THEN
    user_role := 'owner';
    
    -- Create default organization for the first user
    INSERT INTO public.organizations (name, slug)
    VALUES ('Hr Shoes Organization', 'hr-shoes-org')
    RETURNING id INTO default_org_id;
    
    -- Create default store linked to the organization
    INSERT INTO public.stores (organization_id, name, slug)
    VALUES (default_org_id, 'Hr Shoes', 'hr-shoes')
    RETURNING id INTO default_store_id;
  ELSE
    user_role := 'customer';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
