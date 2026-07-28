-- 20260728150000_batch_upsert_variant_matrix_v3.sql
-- Adiciona suporte para barcode, cost_cents, weight_grams e status no cadastro avançado de variações.

CREATE OR REPLACE FUNCTION public.batch_upsert_variant_matrix_v3(
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
    v_new_stock := COALESCE(NULLIF(v_item->>'stock', '')::integer, 0);
    IF v_item ? 'original_stock' AND v_item->>'original_stock' IS NOT NULL AND v_item->>'original_stock' <> 'null' THEN
      v_original_stock := (v_item->>'original_stock')::integer;
      v_diff := v_new_stock - v_original_stock;
    ELSE
      v_diff := v_new_stock - COALESCE(v_current_stock, 0);
    END IF;

    IF v_variant_id IS NOT NULL THEN
      -- Atualiza variante existente na prateleira (canônico) aplicando o delta e campos extras
      UPDATE public.product_variants
      SET 
        sku = COALESCE(v_sku, sku),
        price_override_cents = CASE 
          WHEN v_item->>'price_override_cents' IS NULL OR v_item->>'price_override_cents' = 'null' OR v_item->>'price_override_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'price_override_cents')::integer 
        END,
        cost_cents = CASE 
          WHEN v_item->>'cost_cents' IS NULL OR v_item->>'cost_cents' = 'null' OR v_item->>'cost_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'cost_cents')::integer 
        END,
        weight_grams = CASE 
          WHEN v_item->>'weight_grams' IS NULL OR v_item->>'weight_grams' = 'null' OR v_item->>'weight_grams' = '' 
          THEN NULL 
          ELSE (v_item->>'weight_grams')::integer 
        END,
        barcode = CASE 
          WHEN v_item->>'barcode' IS NULL OR v_item->>'barcode' = 'null' OR v_item->>'barcode' = '' 
          THEN NULL 
          ELSE v_item->>'barcode'
        END,
        attributes = COALESCE(v_item->'attributes', attributes),
        stock_on_hand = stock_on_hand + v_diff,
        status = COALESCE(v_item->>'status', 'active'),
        updated_at = v_now
      WHERE id = v_variant_id;
    ELSE
      -- Cria nova variante já com saldo canônico e campos extras
      INSERT INTO public.product_variants (
        product_id,
        sku,
        price_override_cents,
        cost_cents,
        weight_grams,
        barcode,
        attributes,
        stock_on_hand,
        status,
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
        CASE 
          WHEN v_item->>'cost_cents' IS NULL OR v_item->>'cost_cents' = 'null' OR v_item->>'cost_cents' = '' 
          THEN NULL 
          ELSE (v_item->>'cost_cents')::integer 
        END,
        CASE 
          WHEN v_item->>'weight_grams' IS NULL OR v_item->>'weight_grams' = 'null' OR v_item->>'weight_grams' = '' 
          THEN NULL 
          ELSE (v_item->>'weight_grams')::integer 
        END,
        CASE 
          WHEN v_item->>'barcode' IS NULL OR v_item->>'barcode' = 'null' OR v_item->>'barcode' = '' 
          THEN NULL 
          ELSE v_item->>'barcode'
        END,
        v_item->'attributes',
        v_new_stock,
        COALESCE(v_item->>'status', 'active'),
        v_now,
        v_now
      ) RETURNING id INTO v_variant_id;
    END IF;

    -- Tracking da variante canônica resolvida para proteção anti-zumbi
    v_processed_ids := array_append(v_processed_ids, v_variant_id);

    -- 3. Inserir Mídia se houver
    IF v_item->>'image_url' IS NOT NULL AND (v_item->>'image_url') <> '' AND (v_item->>'image_url') <> 'null' THEN
      SELECT id INTO v_media_id FROM public.product_media 
      WHERE product_id = product_id_param AND variant_id = v_variant_id AND url = v_item->>'image_url' 
      LIMIT 1;

      IF v_media_id IS NULL THEN
        INSERT INTO public.product_media (product_id, variant_id, url)
        VALUES (product_id_param, v_variant_id, v_item->>'image_url');
      END IF;
    END IF;

    -- 4. Registrar Stock Movement se houve delta de estoque
    IF v_diff <> 0 THEN
      INSERT INTO public.stock_movements (
        store_id,
        variant_id,
        qty_change,
        reason,
        reference_type
      ) VALUES (
        store_id_param,
        v_variant_id,
        v_diff,
        'manual_adjustment',
        'manual'
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- 5. Lidar com Zumbis (Variantes removidas da UI)
  IF array_length(v_processed_ids, 1) > 0 THEN
    UPDATE public.product_variants
    SET status = 'archived', updated_at = v_now
    WHERE product_id = product_id_param
      AND id != ALL(v_processed_ids)
      AND status != 'archived';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'variants_processed', v_count,
    'archived_missing', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;
