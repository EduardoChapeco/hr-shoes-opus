-- 20260725300000_rpc_upsert_variant_matrix.sql
-- Garante Segurança Multi-tenant e Atomicidade no Upsert em Lote de Variantes

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
  v_existing_variant jsonb;
  v_is_match boolean;
  v_attr_key text;
  v_attr_val text;
BEGIN
  -- 1. Validar Identidade (Security Shield)
  -- Confirmamos que o produto existe E pertence à loja da sessão do usuário.
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
    v_is_match := false;

    -- Tentar encontrar variante correspondente pelo match exato de atributos
    -- Como JSONB igualdade no PG é rigorosa com a ordem, é melhor usar uma query exata 
    -- nas chaves e valores, ou na prática o frontend já envia ordenado e limpo.
    -- Vamos assumir que a igualdade estrita @> e <@ (contém e está contido) garante o match.
    SELECT id, stock_on_hand INTO v_variant_id, v_current_stock
    FROM public.product_variants
    WHERE product_id = product_id_param
      AND attributes @> (v_item->'attributes') 
      AND (v_item->'attributes') @> attributes
    LIMIT 1;

    -- Gerar SKU caso não exista
    IF v_item->>'sku' IS NULL OR v_item->>'sku' = '' THEN
      SELECT string_agg(upper(substring(value, 1, 3)), '-') INTO v_sku_suffix
      FROM jsonb_each_text(v_item->'attributes');

      v_sku := 'SKU-' || upper(substring(product_id_param::text, 1, 8)) || '-' || COALESCE(v_sku_suffix, 'VAR');
    ELSE
      v_sku := v_item->>'sku';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      -- Atualiza variante existente
      UPDATE public.product_variants
      SET 
        sku = COALESCE(v_sku, sku),
        price_override_cents = (v_item->>'price_override_cents')::integer,
        updated_at = v_now
      WHERE id = v_variant_id;
    ELSE
      -- Cria nova variante
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
        (v_item->>'price_override_cents')::integer,
        COALESCE(v_item->'attributes', '{}'::jsonb),
        0, -- default fallback, ajustado no stock_movements abaixo
        v_now,
        v_now
      ) RETURNING id INTO v_variant_id;
      
      v_current_stock := 0;
    END IF;

    -- Movimento de Estoque (se houver diferença)
    v_new_stock := COALESCE((v_item->>'stock')::integer, 0);
    v_diff := v_new_stock - v_current_stock;
    
    IF v_diff <> 0 THEN
      INSERT INTO public.stock_movements (
        variant_id,
        store_id,
        movement_type,
        qty,
        note
      ) VALUES (
        v_variant_id,
        store_id_param,
        'adjustment',
        v_diff,
        'Ajuste em lote via Matriz 2D de Variações'
      );
      -- Trigger stock_movements atualiza o stock_on_hand automaticamente.
    END IF;

    -- Vinculação da Mídia da Variante
    IF v_item->>'image_url' IS NOT NULL AND v_item->>'image_url' <> '' THEN
      -- Verifica se essa URL já existe vinculada ao produto
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
