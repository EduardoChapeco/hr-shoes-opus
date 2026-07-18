-- ============================================================================
-- Hr Shoes Commerce — Seed Data (Template Loja de Calçados)
-- ============================================================================
-- Este seed popula a vitrine inicial com dados estruturais (Tipos, Categorias,
-- Atributos) e alguns produtos de demonstração para que a loja não inicie vazia.
-- Depende da Migration 0022 que cria a store 'hr-shoes'.

DO $$
DECLARE
  v_store_id UUID;
  v_type_shoes UUID;
  v_cat_masculino UUID;
  v_cat_feminino UUID;
  v_prod_1 UUID;
  v_prod_2 UUID;
BEGIN
  -- Obter a store padrão (Hr Shoes)
  SELECT id INTO v_store_id FROM public.stores WHERE slug = 'hr-shoes' LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store hr-shoes não encontrada. Execute as migrations primeiro.';
  END IF;

  -- ==========================================
  -- 1. TIPOS DE PRODUTO
  -- ==========================================
  INSERT INTO public.product_types (store_id, name, slug, field_schema)
  VALUES (
    v_store_id, 
    'Calçado Tênis', 
    'calcado-tenis',
    '{"fields": [{"name": "Material", "type": "string"}, {"name": "Tipo de Pisada", "type": "string"}]}'::jsonb
  )
  ON CONFLICT (store_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_type_shoes;

  -- ==========================================
  -- 2. CATEGORIAS
  -- ==========================================
  INSERT INTO public.categories (store_id, name, slug, description, status)
  VALUES 
    (v_store_id, 'Masculino', 'masculino', 'Calçados masculinos', 'active'),
    (v_store_id, 'Feminino', 'feminino', 'Calçados femininos', 'active')
  ON CONFLICT (store_id, slug) DO NOTHING;

  SELECT id INTO v_cat_masculino FROM public.categories WHERE slug = 'masculino' AND store_id = v_store_id;
  SELECT id INTO v_cat_feminino FROM public.categories WHERE slug = 'feminino' AND store_id = v_store_id;

  -- ==========================================
  -- 3. PRODUTOS E VARIANTES (DEMO)
  -- ==========================================
  
  -- Produto 1: Tênis Runner Masculino
  INSERT INTO public.products (store_id, product_type_id, title, slug, description, price_cents, compare_at_price_cents, status)
  VALUES (
    v_store_id, v_type_shoes, 'Tênis Runner Pro Masculino', 'tenis-runner-pro-masculino',
    'Tênis ideal para corrida e alta performance, com absorção de impacto.', 29990, 39990, 'published'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_prod_1;

  IF v_prod_1 IS NOT NULL THEN
    -- Associação com categoria
    INSERT INTO public.product_categories (product_id, category_id) VALUES (v_prod_1, v_cat_masculino) ON CONFLICT DO NOTHING;
    
    -- Grade de Variantes do Prod 1
    INSERT INTO public.product_variants (product_id, sku, attributes, stock_on_hand, price_cents, status)
    VALUES 
      (v_prod_1, 'RUN-PRO-M-PT-40', '{"Cor": "Preto", "Tamanho": "40"}', 10, 29990, 'active'),
      (v_prod_1, 'RUN-PRO-M-PT-41', '{"Cor": "Preto", "Tamanho": "41"}', 15, 29990, 'active'),
      (v_prod_1, 'RUN-PRO-M-AZ-40', '{"Cor": "Azul", "Tamanho": "40"}', 5, 29990, 'active');
  END IF;

  -- Produto 2: Sapatilha Feminina Conforto
  INSERT INTO public.products (store_id, product_type_id, title, slug, description, price_cents, compare_at_price_cents, status)
  VALUES (
    v_store_id, v_type_shoes, 'Sapatilha Casual Conforto Feminina', 'sapatilha-casual-conforto-feminina',
    'Sapatilha super leve, ideal para o dia a dia e trabalho.', 15990, 19990, 'published'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_prod_2;

  IF v_prod_2 IS NOT NULL THEN
    INSERT INTO public.product_categories (product_id, category_id) VALUES (v_prod_2, v_cat_feminino) ON CONFLICT DO NOTHING;

    -- Grade de Variantes do Prod 2
    INSERT INTO public.product_variants (product_id, sku, attributes, stock_on_hand, price_cents, status)
    VALUES 
      (v_prod_2, 'SAP-CONF-F-ND-36', '{"Cor": "Nude", "Tamanho": "36"}', 20, 15990, 'active'),
      (v_prod_2, 'SAP-CONF-F-ND-37', '{"Cor": "Nude", "Tamanho": "37"}', 8, 15990, 'active');
  END IF;

  RAISE NOTICE 'Seed inicial concluído com sucesso: Produtos e Categorias inseridos.';
END $$;
