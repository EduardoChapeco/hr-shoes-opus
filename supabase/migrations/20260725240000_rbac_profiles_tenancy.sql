-- ============================================================================
-- Hr Shoes Commerce — Migration 0090: RBAC Profiles Tenancy
-- ============================================================================
-- Fixes the BOLA vulnerability and allows staff to read customer profiles
-- associated with their store (either directly or via orders) without 
-- causing infinite recursion (42P17).

BEGIN;

  -- 1. Create a Security Definer function to check staff status safely
  -- This bypasses RLS for the internal check, preventing recursion.
  CREATE OR REPLACE FUNCTION public.is_store_staff(target_store_id UUID)
  RETURNS BOOLEAN
  SECURITY DEFINER
  SET search_path = public
  LANGUAGE plpgsql
  AS $$
  DECLARE
    v_role TEXT;
    v_store_id UUID;
  BEGIN
    SELECT role, store_id INTO v_role, v_store_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN v_role != 'customer' AND v_store_id = target_store_id;
  END;
  $$;

  -- 2. Create the ACL Bridge policy for reading profiles
  CREATE POLICY "profiles_read_staff" ON public.profiles
  FOR SELECT
  USING (
    -- Condition A: The profile is directly registered to the staff's store
    public.is_store_staff(profiles.store_id)
    OR
    -- Condition B: The profile belongs to a customer who made an order in the staff's store
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.customer_id = profiles.id
        AND public.is_store_staff(orders.store_id)
    )
  );

COMMIT;
