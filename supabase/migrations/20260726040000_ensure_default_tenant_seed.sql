-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726040000: Ensure Default Tenant Seed
-- ============================================================================
-- Ensures default organization and store ALWAYS exist in the database,
-- preventing 500 errors on public storefront routes when database is empty.
-- ============================================================================

INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hr Shoes Organization', 'hr-shoes-org')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.stores (id, organization_id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Hr Shoes', 'hr-shoes')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Ensure default theme settings exist for default store
INSERT INTO public.theme_settings (store_id)
VALUES ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (store_id) DO NOTHING;
