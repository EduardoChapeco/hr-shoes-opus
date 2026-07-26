-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725210000
-- 1. Updates handle_new_user to make the first 2 users 'owner'.
-- 2. Creates system_wipe_logs table.
-- 3. Creates execute_hard_refresh RPC for store data wipe.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_count INTEGER;
  default_org_id UUID;
  default_store_id UUID;
  user_role TEXT;
BEGIN
  -- Count how many 'owner' profiles exist globally
  SELECT count(*) INTO v_admin_count FROM public.profiles WHERE role = 'owner';
  
  IF v_admin_count < 2 THEN
    user_role := 'owner';
    
    -- Check if default organization already exists
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'hr-shoes-org' LIMIT 1;
    
    IF default_org_id IS NULL THEN
      -- Create default organization
      INSERT INTO public.organizations (name, slug)
      VALUES ('Hr Shoes Organization', 'hr-shoes-org')
      RETURNING id INTO default_org_id;
    END IF;
    
    -- Check if default store already exists
    SELECT id INTO default_store_id FROM public.stores WHERE slug = 'hr-shoes' AND organization_id = default_org_id LIMIT 1;
    
    IF default_store_id IS NULL THEN
      -- Create default store
      INSERT INTO public.stores (organization_id, name, slug)
      VALUES (default_org_id, 'Hr Shoes', 'hr-shoes')
      RETURNING id INTO default_store_id;
    END IF;
  ELSE
    -- If there are already 2 owners, fallback to the default org/store anyway so they can buy
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'hr-shoes-org' LIMIT 1;
    SELECT id INTO default_store_id FROM public.stores WHERE slug = 'hr-shoes' AND organization_id = default_org_id LIMIT 1;
    user_role := 'customer';
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


-- ============================================================================
-- Hard Refresh System (Wipe Logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_wipe_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  store_id UUID REFERENCES public.stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.system_wipe_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view wipe logs" ON public.system_wipe_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RPC for self-destruct
CREATE OR REPLACE FUNCTION public.execute_hard_refresh(p_confirm_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_role TEXT;
  v_total_orders INT;
  v_total_products INT;
  v_total_customers INT;
BEGIN
  -- 1. Authorization
  SELECT store_id, role INTO v_store_id, v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas o Owner/Admin Global pode executar o Hard Refresh.';
  END IF;

  IF p_confirm_text != 'CONFIRMAR EXCLUSAO TOTAL' THEN
    RAISE EXCEPTION 'Frase de segurança incorreta. A exclusão foi abortada.';
  END IF;

  -- 2. Gather snapshot counts before wiping
  SELECT COUNT(*) INTO v_total_orders FROM public.orders WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_total_products FROM public.products WHERE store_id = v_store_id;
  SELECT COUNT(*) INTO v_total_customers FROM public.profiles WHERE store_id = v_store_id AND role = 'customer';

  -- 3. Log the wipe intent
  INSERT INTO public.system_wipe_logs (actor_id, store_id, details)
  VALUES (
    auth.uid(),
    v_store_id,
    jsonb_build_object(
      'wiped_orders', v_total_orders,
      'wiped_products', v_total_products,
      'wiped_customers', v_total_customers
    )
  );

  -- 4. Execute Cascading Delete
  -- By deleting from products, carts, and orders, we clear the operational data.
  -- Notice: We do NOT delete from profiles or stores, to keep the tenant alive.
  
  DELETE FROM public.orders WHERE store_id = v_store_id;
  DELETE FROM public.carts WHERE store_id = v_store_id;
  DELETE FROM public.products WHERE store_id = v_store_id;
  DELETE FROM public.product_types WHERE store_id = v_store_id;
  DELETE FROM public.categories WHERE store_id = v_store_id;
  DELETE FROM public.stock_movements WHERE store_id = v_store_id;
  DELETE FROM public.coupons WHERE store_id = v_store_id;
  DELETE FROM public.shipping_rules WHERE store_id = v_store_id;
  DELETE FROM public.payment_transactions WHERE store_id = v_store_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Hard Refresh concluído.',
    'stats', jsonb_build_object(
      'orders', v_total_orders,
      'products', v_total_products
    )
  );
END;
$$;
