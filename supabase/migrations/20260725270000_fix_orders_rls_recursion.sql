-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725270000: Fix Orders RLS Recursion
-- ============================================================================
-- The previous RLS policies for `orders` and `profiles` created an infinite loop.
-- `orders` queried `profiles` to check if the user is staff.
-- `profiles` queried `orders` to check if the user is a customer of the store.
-- To fix this, we replace the direct table query in `orders` policies with
-- the `public.is_store_staff()` SECURITY DEFINER function, which bypasses RLS
-- safely and breaks the cycle.

BEGIN;

  -- 1. Drop the offending policies that query profiles directly
  DROP POLICY IF EXISTS "orders_staff_read" ON public.orders;
  DROP POLICY IF EXISTS "orders_staff_update" ON public.orders;

  -- 2. Recreate them using the SECURITY DEFINER function
  CREATE POLICY "orders_staff_read"
    ON public.orders FOR SELECT
    USING ( public.is_store_staff(store_id) );

  CREATE POLICY "orders_staff_update"
    ON public.orders FOR UPDATE
    USING ( public.is_store_staff(store_id) );

COMMIT;
