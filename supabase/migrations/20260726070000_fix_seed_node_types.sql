-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726070000: Fix Seed Node Types
-- ============================================================================
-- Fixes node_type from 'section' to 'composition' for non-structural blocks
-- ============================================================================

UPDATE public.experience_nodes
SET node_type = 'composition'
WHERE block_type IN (
  'hero_carousel', 
  'mosaic_banners', 
  'product_grid',
  'bento_grid',
  'product_rail'
) AND node_type = 'section';
