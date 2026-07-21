-- ============================================================================
-- Hr Shoes Commerce â€” Migration 0072: Variant Display Name
-- ============================================================================
-- Adds a dedicated display name to variants so that they can be presented
-- elegantly in the storefront (e.g. "Azul BebÃª") instead of relying solely
-- on rigid attributes (e.g. "Cor: Azul").
-- ============================================================================

ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS display_name TEXT;
