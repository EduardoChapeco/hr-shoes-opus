-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726080000: Enhance Home Seed Experience
-- ============================================================================
-- Populates the default storefront home page with a robust set of blocks:
-- Hero Carousel, Info Cards, Mosaic Banners, Product Carousel, Split Banner, Testimonials.
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

  -- 3. Delete existing nodes for this version to start fresh
  DELETE FROM public.experience_nodes WHERE version_id = v_version_id;

  -- 4. Re-insert ENHANCED block types

  -- 4.1 Hero Carousel Section (sort 1)
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
          "title": "Nova Coleção Elegance",
          "subtitle": "Conforto artesanal e design contemporâneo em cada detalhe",
          "button_text": "Ver Lançamentos",
          "link": "/catalogo",
          "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=2000"
        },
        {
          "title": "Conforto para o Dia a Dia",
          "subtitle": "Descubra a linha de tênis casuais que combinam com qualquer look",
          "button_text": "Explorar Tênis",
          "link": "/categoria/tenis",
          "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=2000"
        }
      ]
    }'::jsonb
  );

  -- 4.2 Info Cards (Benefícios) (sort 2)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'info_cards',
    2,
    '{
      "columns": "4",
      "align": "center",
      "cards": [
        {
          "title": "Frete Grátis",
          "description": "Para compras acima de R$ 299",
          "icon": "Truck"
        },
        {
          "title": "Até 6x sem juros",
          "description": "Pague no cartão de crédito",
          "icon": "CreditCard"
        },
        {
          "title": "Primeira Troca Grátis",
          "description": "Até 30 dias após receber",
          "icon": "ArrowLeftRight"
        },
        {
          "title": "Atendimento VIP",
          "description": "Suporte via WhatsApp",
          "icon": "MessageCircle"
        }
      ]
    }'::jsonb
  );

  -- 4.3 Mosaic Banners (Categorias Principais) (sort 3)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'mosaic_banners',
    3,
    '{
      "banners": [
        { "title": "Sandálias & Rasteiras", "link": "/buscar?q=sandalias", "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600" },
        { "title": "Tênis casuais", "link": "/buscar?q=tenis", "image_url": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600" },
        { "title": "Scarpins & Saltos", "link": "/buscar?q=saltos", "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600" }
      ]
    }'::jsonb
  );

  -- 4.4 Product Carousel (Mais Desejados) (sort 4)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content, data_bindings)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'product_carousel',
    4,
    '{
      "title": "Lançamentos Mais Desejados",
      "subtitle": "As escolhas favoritas das nossas clientes",
      "autoPlay": false
    }'::jsonb,
    '{
      "products": "db:products?limit=8&sort=created_at.desc"
    }'::jsonb
  );

  -- 4.5 Split Banner (Destaque da Estação) (sort 5)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'split_banner',
    5,
    '{
      "title": "Beleza que acompanha seus passos",
      "subtitle": "Cada modelo é desenhado pensando no equilíbrio perfeito entre o design moderno e o conforto que você merece. Sinta a diferença de calçar algo feito com carinho.",
      "button_text": "Conheça a Coleção",
      "link": "/catalogo",
      "image_url": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=1000",
      "imagePosition": "right",
      "backgroundColor": "#f8f9fa"
    }'::jsonb
  );

  -- 4.6 Testimonial Carousel (Prova Social) (sort 6)
  INSERT INTO public.experience_nodes (id, version_id, node_type, block_type, sort_order, content)
  VALUES (
    gen_random_uuid(),
    v_version_id,
    'section',
    'testimonial_carousel',
    6,
    '{
      "title": "O que nossas clientes dizem",
      "subtitle": "A satisfação de quem já experimentou nosso conforto",
      "testimonials": [
        {
          "name": "Mariana Silva",
          "role": "Cliente Verificada",
          "content": "Amei a sandália! Além de linda é super confortável. Chegou antes do prazo e o atendimento foi excelente.",
          "rating": 5,
          "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
        },
        {
          "name": "Camila Oliveira",
          "role": "Cliente Verificada",
          "content": "O scarpin é perfeito para o trabalho, não machuca o pé e o acabamento é impecável. Comprarei novamente!",
          "rating": 5,
          "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
        },
        {
          "name": "Juliana Costa",
          "role": "Cliente Verificada",
          "content": "Adorei a facilidade da primeira troca grátis, precisei de um número menor e o processo foi muito rápido.",
          "rating": 4,
          "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
        }
      ]
    }'::jsonb
  );

END $$;
