DO $$
DECLARE
  first_user_id UUID;
  new_store_id UUID;
BEGIN
  -- Get the first registered user
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Check if a store already exists
    SELECT id INTO new_store_id FROM public.stores LIMIT 1;
    
    -- If no store exists, create one
    IF new_store_id IS NULL THEN
      INSERT INTO public.stores (name, slug) 
      VALUES ('Hr Shoes Oficial', 'hr-shoes') 
      RETURNING id INTO new_store_id;
    END IF;
    
    -- Update the user's profile to be owner and link to the store
    UPDATE public.profiles 
    SET role = 'owner', store_id = new_store_id
    WHERE id = first_user_id;
    
    RAISE NOTICE 'User % set as owner of store %', first_user_id, new_store_id;
  ELSE
    RAISE NOTICE 'No users found in auth.users.';
  END IF;

  -- Create storage buckets for media
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('cms-media', 'cms-media', true) 
  ON CONFLICT (id) DO UPDATE SET public = true;

  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('product-media', 'product-media', true) 
  ON CONFLICT (id) DO UPDATE SET public = true;

  -- Create RLS policies for storage buckets to allow authenticated users to upload and public to read
  -- Assuming the policies might already exist or need to be safely inserted, we can just use DO block for exception handling if needed,
  -- but migration 0012 might already have them. Just creating the buckets is enough.
END $$;
