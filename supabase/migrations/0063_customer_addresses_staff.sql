-- Hr Shoes Commerce — Migration 0063: Staff access to customer addresses

CREATE POLICY "customer_addresses_staff_all"
  ON public.customer_addresses FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'seller', 'support')
    )
  );
