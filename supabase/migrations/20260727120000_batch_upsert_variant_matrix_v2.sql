-- 20260727120000_batch_upsert_variant_matrix_v2.sql
-- 1. Introduz original_stock para delta concorrente
-- 2. Arquiva automaticamente variantes omitidas (Zumbis)
-- 3. Resolve roubo de mídia criando instâncias únicas por variante

CREATE OR REPLACE FUNCTION public.batch_upsert_variant_matrix_v2(
  store_id_param uuid,
  product_id_param uuid,
  matrix jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_exists boolean;
  v_item jsonb;
  v_sku text;
  v_sku_suffix text;
  v_variant_id uuid;
  v_current_stock integer;
  v_original_stock integer;
  v_new_stock integer;
  v_diff integer;
  v_media_id uuid;
  v_now timestamptz := now();
  v_count integer := 0;
  v_processed_ids uuid[] := '{}';
BEGIN
  -- 1. Validar Identidade e Multi-tenancy (Security Shield)
  SELECT EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id_param AND store_id = store_id_param
  ) INTO v_product_exists;

  IF NOT v_product_exists THEN
    RAISE EXCEPTION 'Produto não encontrado ou não pertence a esta loja.';
  END IF;

  -- 2. Processar a Matriz em Lote Atômicamente
  FOR v_item IN SELECT jsonb_array_elements(matrix)
  LOOP
    v_variant_id := NULL;
    v_current_stock := 0;
    v_diff := 0;

    -- Tentar encontrar variante existente por ID (canônico)
    IF v_item->>'id' IS NOT NULL AND (v_item->>'id') <> '' AND (v_item->>'id') <> 'null' THEN
      SELECT id, COALESCE(stock_on_hand, 0) INTO v_variant_id, v_current_stock
      FROM public.product_variants
      WHERE id = (v_item->>'id')::uuid AND product_id = product_id_param
      LIMIT 1;
    END IF;

    -- Tentar encontrar variante por SKU (fallback)
    IF v_variant_id IS NULL AND v_item->>'sku' IS NOT NULL AND (v_item->>'sku') <> '' AND (v_item->>'sku') <> 'null' THEN
      SELECT id, COALESCE(stock_on_hand, 0) INTO v_variant_id, v_current_stock
      FROM public.product_variants
      WHERE product_id = product_id_param AND sku = (v_item->>'sku')
      LIMIT 1;
    END IF;

    -- Tentar encontrar variante por igualdade de atributos JSONB (fallback)
    IF v_variant_id IS NULL AND v_item->'attributes' IS NOT NULL THEN
      SELECT id, COALESCE(stock_on_hand, 0) INTO v_variant_id, v_current_stock
      FROM public.product_variants
      WHERE product_id = product_id_param AND attributes = (v_item->'attributes')
      LIMIT 1;
    END IF;

    -- Gerar SKU caso não exista na entrada
    IF v_item->>'sku' IS NULL OR v_item->>'sku' = '' OR v_item->>'sku' = 'null' THEN
      SELECT string_agg(upper(substring(value, 1, 3)), '-') INTO v_sku_suffix
      FROM jsonb_each_text(v_item->'attributes');

      v_sku := 'SKU-' || upper(substring(product_id_param::text, 1, 8)) || '-' || COALESCE(v_sku_suffix, 'VAR-' || v_count);
    ELSE
      v_sku := v_item->>'sku';
    END IF;

    -- Concorrência de Estoque: Calculando o Delta seguro
    -- Se a UI enviou original_stock, calculamos a diferença baseada no que o usuário VIU na tela.
    -- Se não enviou, assumimos que stock = stock (nenhuma mudança intencional via delta).
    v_new_stock := COALESCE(NULLIF(v_item->>'stock', '')::integer, 0);
    IF v_item ? 'original_stock' AND v_item->>'original_stock' IS NOT NULL AND v_item->>'original_stock' <> 'null' THEN
      v_original_stock := (v_item->>'original_stock')::integer;
      v_diff := v_new_stock - v_original_stock;
    ELSE
      -- Fallback legacy se UI não enviou original_stock (assume overwrite direto, o que é arriscado, mas mantém compatibilidade)
      v_diff := v_new_stock - COALESCE(v_current_stock, 0);
    END IF;

    IF v_variant_id IS NOT NULL THEN
      -- Atualiza variante existente na prateleira (canônico) aplicando o delta
      UPDATE public.product_variants
      SET 
        sku = COALESCE(v_sku, sku),
        price_override_cents = CASE 
          WHEN v_item->>'price_override_cents' IS NULL OR v_item->>'price_override_cents' = 'null' OR v_item->>'price_override_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'price_override_cents')::integer 
        END,
        attributes = COALESCE(v_item->'attributes', attributes),
        stock_on_hand = stock_on_hand + v_diff, -- Aplica o delta atomicamente!
        status = 'active', -- Reativa se estivesse arquivada
        updated_at = v_now
      WHERE id = v_variant_id;
    ELSE
      -- Cria nova variante já com saldo canônico
      INSERT INTO public.product_variants (
        product_id,
        sku,
        price_override_cents,
        attributes,
        stock_on_hand,
        created_at,
        updated_at
      ) VALUES (
        product_id_param,
        v_sku,
        CASE 
          WHEN v_item->>'price_override_cents' IS NULL OR v_item->>'price_override_cents' = 'null' OR v_item->>'price_override_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'price_override_cents')::integer 
        END,
        COALESCE(v_item->'attributes', '{}'::jsonb),
        v_new_stock,
        v_now,
        v_now
      ) RETURNING id INTO v_variant_id;
      
      -- Para novos, o diff é o estoque total inserido
      v_current_stock := 0;
      v_diff := v_new_stock;
    END IF;

    -- Movimento Imutável de Estoque no Livro Razão
    IF v_diff <> 0 THEN
      INSERT INTO public.stock_movements (
        variant_id,
        store_id,
        movement_type,
        qty,
        note,
        created_at
      ) VALUES (
        v_variant_id,
        store_id_param,
        'adjustment',
        v_diff,
        'Ajuste via painel administrativo (Matriz)',
        v_now
      );
    END IF;

    -- Vinculação Isolada de Mídia
    -- Não roubamos mais a imagem de outra variante. Se não existir o link exato variante-foto, criamos um novo.
    IF v_item->>'image_url' IS NOT NULL AND v_item->>'image_url' <> '' AND v_item->>'image_url' <> 'null' THEN
      SELECT id INTO v_media_id 
      FROM public.product_media 
      WHERE variant_id = v_variant_id AND url = v_item->>'image_url'
      LIMIT 1;

      IF v_media_id IS NULL THEN
        INSERT INTO public.product_media (
          product_id,
          variant_id,
          url,
          media_type,
          sort_order
        ) VALUES (
          product_id_param,
          v_variant_id,
          v_item->>'image_url',
          'image',
          99
        );
      END IF;
    END IF;

    -- Adiciona o ID validado na lista de processados
    v_processed_ids := array_append(v_processed_ids, v_variant_id);
    v_count := v_count + 1;
  END LOOP;

  -- 3. Limpeza Forense: Arquivar Zumbis Omitidos
  -- Se o produto tinha variantes ativas que NÃO vieram na matriz atual, elas foram deletadas na UI.
  -- Nós as arquivamos para que parem de aparecer nas listagens e store, mas mantemos o histórico para o financeiro.
  IF array_length(v_processed_ids, 1) > 0 THEN
    UPDATE public.product_variants
    SET status = 'archived', updated_at = v_now
    WHERE product_id = product_id_param
      AND status = 'active'
      AND id <> ALL(v_processed_ids);
  END IF;

  RETURN jsonb_build_object('success', true, 'count', v_count, 'processed_ids', v_processed_ids);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Falha atômica ao atualizar matriz de variações V2: %', SQLERRM;
END;
$$;
