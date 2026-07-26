-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725260000: Seed Default Tenant
-- ============================================================================
-- Ensures a default store exists so public pages do not crash with 500 "Loja não encontrada",
-- while keeping zero auth users so the first user signup claims Master Admin.

BEGIN;

  INSERT INTO public.organizations (id, name, slug)
  VALUES ('00000000-0000-0000-0000-000000000001', 'Hr Shoes Organization', 'hr-shoes-org')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.stores (id, organization_id, name, slug)
  VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Hr Shoes', 'hr-shoes')
  ON CONFLICT (organization_id, slug) DO NOTHING;

COMMIT;
