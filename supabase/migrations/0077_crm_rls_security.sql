-- ============================================================================
-- Hr Shoes Commerce — Migration 0077: CRM RLS Security
-- ============================================================================
-- Resolve a falta de permissão da role 'support' (Suporte) para gerenciar 
-- as tabelas customers_crm e exchanges.
-- ============================================================================

BEGIN;

-- 1. Atualizar a policy de customers_crm para incluir support
DROP POLICY IF EXISTS "customers_crm_staff_all" ON public.customers_crm;
CREATE POLICY "customers_crm_staff_all"
  ON public.customers_crm FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'support')
    )
  );

-- 2. Atualizar a policy de exchanges para incluir support
DROP POLICY IF EXISTS "exchanges_staff_all" ON public.exchanges;
CREATE POLICY "exchanges_staff_all"
  ON public.exchanges FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'finance', 'support')
    )
  );

COMMIT;
