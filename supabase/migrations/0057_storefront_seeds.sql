-- ============================================================================
-- Hr Shoes Commerce — Migration 0057: Storefront Seeds
-- ============================================================================
-- Injeta dados reais na vitrine (caso esteja limpa) para testes de usabilidade.

BEGIN;

DO $$ 
DECLARE
  v_store_id UUID;
  v_category_id UUID;
  v_collection_id UUID;
  v_product1_id UUID;
  v_product2_id UUID;
  v_product3_id UUID;
BEGIN
  -- Verificar se já existe uma loja. Se não, criar uma loja padrão.
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    INSERT INTO public.stores (name, slug, domain, is_active, theme_config)
    VALUES (
      'Hr Shoes', 
      'hr-shoes', 
      'hrshoes.com.br', 
      true, 
      '{"primaryColor": "#000000", "secondaryColor": "#ffffff", "fontFamily": "Inter"}'::jsonb
    ) RETURNING id INTO v_store_id;
  END IF;

  -- Criar Categoria se não existir
  SELECT id INTO v_category_id FROM public.categories WHERE slug = 'tenis-esportivos' LIMIT 1;
  IF v_category_id IS NULL THEN
    INSERT INTO public.categories (store_id, name, slug, description, is_active)
    VALUES (v_store_id, 'Tênis Esportivos', 'tenis-esportivos', 'Tênis de alta performance', true)
    RETURNING id INTO v_category_id;
  END IF;

  -- Criar Coleção se não existir
  SELECT id INTO v_collection_id FROM public.collections WHERE slug = 'lancamentos-verao' LIMIT 1;
  IF v_collection_id IS NULL THEN
    INSERT INTO public.collections (store_id, name, slug, description, is_active)
    VALUES (v_store_id, 'Lançamentos de Verão', 'lancamentos-verao', 'Novidades quentes para o verão', true)
    RETURNING id INTO v_collection_id;
  END IF;

  -- Checar se existem produtos. Se já existir algum produto, abortar o seed de produtos para não poluir
  IF EXISTS (SELECT 1 FROM public.products WHERE store_id = v_store_id LIMIT 1) THEN
    RAISE NOTICE 'Produtos já existem. Pulando injeção de seeds de produtos.';
    RETURN;
  END IF;

  -- Produto 1: Tênis Runner Pro
  INSERT INTO public.products (store_id, category_id, name, slug, description, price_cents, compare_at_cents, status)
  VALUES (
    v_store_id, v_category_id, 
    'Tênis HR Runner Pro 2.0', 
    'hr-runner-pro-2', 
    'Tênis esportivo com tecnologia de absorção de impacto máxima. Ideal para maratonas e treinos de alta intensidade. Malha respirável e solado de borracha.', 
    49990, 59990, 'active'
  ) RETURNING id INTO v_product1_id;

  INSERT INTO public.product_variants (product_id, sku, price_override_cents, stock_on_hand, attributes)
  VALUES 
    (v_product1_id, 'HR-RUN-2-BLK-39', NULL, 15, '{"color": "Preto", "size": "39"}'::jsonb),
    (v_product1_id, 'HR-RUN-2-BLK-40', NULL, 22, '{"color": "Preto", "size": "40"}'::jsonb),
    (v_product1_id, 'HR-RUN-2-WHT-40', NULL, 8, '{"color": "Branco", "size": "40"}'::jsonb);

  INSERT INTO public.product_media (product_id, url, sort_order)
  VALUES (v_product1_id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', 0);

  -- Produto 2: Sneaker Casual
  INSERT INTO public.products (store_id, category_id, name, slug, description, price_cents, compare_at_cents, status)
  VALUES (
    v_store_id, v_category_id, 
    'Sneaker Casual Urban', 
    'sneaker-casual-urban', 
    'Estilo e conforto para o dia a dia. Design minimalista com detalhes em couro sintético e palmilha ortopédica.', 
    29990, NULL, 'active'
  ) RETURNING id INTO v_product2_id;

  INSERT INTO public.product_variants (product_id, sku, price_override_cents, stock_on_hand, attributes)
  VALUES 
    (v_product2_id, 'HR-CAS-URB-38', NULL, 5, '{"color": "Bege", "size": "38"}'::jsonb),
    (v_product2_id, 'HR-CAS-URB-41', NULL, 2, '{"color": "Azul", "size": "41"}'::jsonb);

  INSERT INTO public.product_media (product_id, url, sort_order)
  VALUES (v_product2_id, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', 0);

  -- Produto 3: Chuteira Campo
  INSERT INTO public.products (store_id, category_id, name, slug, description, price_cents, compare_at_cents, status)
  VALUES (
    v_store_id, v_category_id, 
    'Chuteira Campo Predator', 
    'chuteira-campo-predator', 
    'Domine o jogo com a nova chuteira Predator. Travas de alumínio e cabedal texturizado para maior aderência com a bola.', 
    34990, 42090, 'active'
  ) RETURNING id INTO v_product3_id;

  INSERT INTO public.product_variants (product_id, sku, price_override_cents, stock_on_hand, attributes)
  VALUES 
    (v_product3_id, 'HR-PRED-GRN-40', NULL, 12, '{"color": "Verde", "size": "40"}'::jsonb),
    (v_product3_id, 'HR-PRED-GRN-42', NULL, 1, '{"color": "Verde", "size": "42"}'::jsonb);

  INSERT INTO public.product_media (product_id, url, sort_order)
  VALUES (v_product3_id, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800', 0);

  -- Ligar produtos à Coleção
  INSERT INTO public.product_collections (product_id, collection_id)
  VALUES 
    (v_product1_id, v_collection_id),
    (v_product2_id, v_collection_id);

END $$;

COMMIT;
