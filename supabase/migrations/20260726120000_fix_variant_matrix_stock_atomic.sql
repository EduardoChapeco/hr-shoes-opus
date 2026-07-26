-- 20260726120000_fix_variant_matrix_stock_atomic.sql
-- Garante a atualização canônica de stock_on_hand e o registro imutável em stock_movements na procedure atômica em lote

CREATE OR REPLACE FUNCTION public.batch_upsert_variant_matrix_v1(
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
  v_new_stock integer;
  v_diff integer;
  v_media_id uuid;
  v_now timestamptz := now();
  v_count integer := 0;
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

    -- Tentar encontrar variante existente por ID (se provido)
    IF v_item->>'id' IS NOT NULL AND (v_item->>'id') <> '' AND (v_item->>'id') <> 'null' THEN
      SELECT id, COALESCE(stock_on_hand, 0) INTO v_variant_id, v_current_stock
      FROM public.product_variants
      WHERE id = (v_item->>'id')::uuid AND product_id = product_id_param
      LIMIT 1;
    END IF;

    -- Tentar encontrar variante por SKU (se provido e ainda não encontrado por ID)
    IF v_variant_id IS NULL AND v_item->>'sku' IS NOT NULL AND (v_item->>'sku') <> '' AND (v_item->>'sku') <> 'null' THEN
      SELECT id, COALESCE(stock_on_hand, 0) INTO v_variant_id, v_current_stock
      FROM public.product_variants
      WHERE product_id = product_id_param AND sku = (v_item->>'sku')
      LIMIT 1;
    END IF;

    -- Tentar encontrar variante por igualdade de atributos JSONB
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

    -- Determinar o estoque alvo e a diferença para movimentação
    v_new_stock := COALESCE(
      NULLIF(v_item->>'stock', '')::integer, 
      NULLIF(v_item->>'stock_on_hand', '')::integer, 
      COALESCE(v_current_stock, 0)
    );
    v_diff := v_new_stock - COALESCE(v_current_stock, 0);

    IF v_variant_id IS NOT NULL THEN
      -- Atualiza variante existente na prateleira (canônico)
      UPDATE public.product_variants
      SET 
        sku = COALESCE(v_sku, sku),
        price_override_cents = CASE 
          WHEN v_item->>'price_override_cents' IS NULL OR v_item->>'price_override_cents' = 'null' OR v_item->>'price_override_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'price_override_cents')::integer 
        END,
        attributes = COALESCE(v_item->'attributes', attributes),
        stock_on_hand = v_new_stock,
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
      
      v_current_stock := 0;
      v_diff := v_new_stock;
    END IF;

    -- Movimento Imutável de Estoque no Livro Razão (se houver diferença de inventário)
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
        'Ajuste em lote via Matriz 2D de Variações',
        v_now
      );
    END IF;

    -- Vinculação da Mídia da Variante
    IF v_item->>'image_url' IS NOT NULL AND v_item->>'image_url' <> '' AND v_item->>'image_url' <> 'null' THEN
      SELECT id INTO v_media_id 
      FROM public.product_media 
      WHERE product_id = product_id_param AND url = v_item->>'image_url'
      LIMIT 1;

      IF v_media_id IS NOT NULL THEN
        UPDATE public.product_media 
        SET variant_id = v_variant_id 
        WHERE id = v_media_id;
      ELSE
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

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'count', v_count);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Falha atômica ao atualizar matriz de variações: %', SQLERRM;
END;
$$;
