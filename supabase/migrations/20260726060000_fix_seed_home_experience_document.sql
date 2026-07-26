-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726060000: Fix Seed Home Experience Document
-- ============================================================================
-- Fixes block types and schemas for the default storefront home page
-- (e.g. mapping "hero" to "hero_carousel" and "category_grid" to "mosaic_banners")
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID := '00000000-0000-0000-0000-000000000002';
  v_doc_id UUID;
  v_version_id UUID;
BEGIN
  -- Ensure store exists
  SELECT id INTO v_store_id FROM public.stores WHERE id = v_store_id LIMIT 1;
  IF v_store_id IS NULL THEN
    SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  END IF;

  IF v_store_id IS NULL THEN
    RETURN;
  END IF;

  -- 1. Get default experience_document
  SELECT id INTO v_doc_id
  FROM public.experience_documents
  WHERE store_id = v_store_id AND slug = 'home' AND document_type = 'storefront'
  LIMIT 1;

  IF v_doc_id IS NULL THEN
    RETURN; -- Nothing to fix if the document doesn't exist
  END IF;

  -- 2. Get default published experience_version
  SELECT id INTO v_version_id
  FROM public.experience_versions
  WHERE document_id = v_doc_id AND status = 'published'
  LIMIT 1;

  IF v_version_id IS NULL THEN
    RETURN;
  END IF;

  -- 3. Delete existing wrong nodes for this version
  DELETE FROM public.experience_nodes WHERE version_id = v_version_id;

  -- 4. Re-insert with CORRECT block types matching builder-registry.ts

  -- Hero Carousel Section
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'hero_carousel',
    1,
    '{
      "autoPlay": true,
      "interval": 5,
      "showOverlay": true,
      "overlayOpacity": "medium",
      "banners": [
        {
          "title": "Coleção Verão & Elegância",
          "subtitle": "Conforto artesanal e design contemporâneo em cada detalhe",
          "button_text": "Ver Lançamentos",
          "link": "/catalogo",
          "image_url": "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=2000"
        }
      ]
    }'::jsonb
  );

  -- Mosaic Banners (Used as Category Grid)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'mosaic_banners',
    2,
    '{
      "banners": [
        { "title": "Sandálias & Rasteiras", "link": "/buscar?q=sandalias", "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600" },
        { "title": "Tênis casuais", "link": "/buscar?q=tenis", "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600" },
        { "title": "Scarpins & Saltos", "link": "/buscar?q=saltos", "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600" }
      ]
    }'::jsonb
  );

  -- Featured Products Grid
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content, data_bindings)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'product_grid',
    3,
    '{
      "title": "Mais Desejados",
      "subtitle": "Os favoritos da nossa comunidade",
      "limit": 8
    }'::jsonb,
    '{ "source": "latest_products" }'::jsonb
  );

END $$;
