-- 20260725290000_rpc_create_product_transaction.sql
-- Garante Atomicidade na Criação de Produtos e Variações

CREATE OR REPLACE FUNCTION public.create_product_transaction_v1(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id uuid;
  v_product_id uuid;
  v_variant_id uuid;
  v_category_id uuid;
  v_variant jsonb;
  v_media_url text;
  v_now timestamptz := now();
  v_result jsonb;
  v_default_variant_id uuid;
BEGIN
  -- 1. Validar Identidade e Segurança (Isolamento Multi-tenant)
  -- A identidade pode vir do auth.uid() caso seja acessado diretamente por RLS,
  -- mas neste caso, o server (BFF) é o caller, então o payload TRARÁ o store_id_param.
  -- É fundamental que o store_id seja repassado e exigido.
  v_store_id := (payload->>'store_id')::uuid;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'O store_id é obrigatório para manter o isolamento multi-tenant.';
  END IF;

  -- 2. Inserir Produto Principal
  INSERT INTO public.products (
    store_id,
    title,
    slug,
    description,
    short_description,
    manufacturer,
    ean,
    meta_title,
    meta_description,
    status,
    brand,
    price_cents,
    compare_at_cents,
    cost_cents,
    attributes,
    is_physical,
    weight_kg,
    width_cm,
    height_cm,
    length_cm,
    preparation_time_days,
    options,
    type_id,
    created_at,
    updated_at
  )
  VALUES (
    v_store_id,
    payload->>'title',
    payload->>'slug',
    payload->>'description',
    payload->>'short_description',
    payload->>'manufacturer',
    payload->>'ean',
    payload->>'meta_title',
    payload->>'meta_description',
    COALESCE(payload->>'status', 'draft'),
    payload->>'brand',
    COALESCE((payload->>'price_cents')::integer, 0),
    (payload->>'compare_at_cents')::integer,
    (payload->>'cost_cents')::integer,
    COALESCE(payload->'attributes', '{}'::jsonb),
    COALESCE((payload->>'is_physical')::boolean, true),
    (payload->>'weight_kg')::numeric,
    (payload->>'width_cm')::numeric,
    (payload->>'height_cm')::numeric,
    (payload->>'length_cm')::numeric,
    (payload->>'preparation_time_days')::integer,
    payload->'options',
    (payload->>'type_id')::uuid,
    v_now,
    v_now
  ) RETURNING id INTO v_product_id;

  -- 3. Inserir Categorias
  IF jsonb_typeof(payload->'category_ids') = 'array' AND jsonb_array_length(payload->'category_ids') > 0 THEN
    FOR v_category_id IN SELECT jsonb_array_elements_text(payload->'category_ids')::uuid
    LOOP
      INSERT INTO public.product_categories (product_id, category_id)
      VALUES (v_product_id, v_category_id);
    END LOOP;
  END IF;

  -- 4. Inserir Variantes e Estoque e Media
  IF jsonb_typeof(payload->'variants') = 'array' AND jsonb_array_length(payload->'variants') > 0 THEN
    FOR v_variant IN SELECT jsonb_array_elements(payload->'variants')
    LOOP
      INSERT INTO public.product_variants (
        product_id,
        sku,
        price_override_cents,
        attributes,
        stock_on_hand,
        created_at,
        updated_at
      )
      VALUES (
        v_product_id,
        v_variant->>'sku',
        (v_variant->>'price_cents')::integer,
        COALESCE(v_variant->'attributes', '{}'::jsonb),
        COALESCE((v_variant->>'stock')::integer, 0),
        v_now,
        v_now
      ) RETURNING id INTO v_variant_id;

      -- Mídia Específica da Variante
      IF v_variant->>'image_url' IS NOT NULL AND (v_variant->>'image_url') <> '' THEN
        INSERT INTO public.product_media (
          product_id,
          variant_id,
          url,
          media_type,
          sort_order
        ) VALUES (
          v_product_id,
          v_variant_id,
          v_variant->>'image_url',
          'image',
          0
        );
      END IF;

      -- Movimentação de Estoque Inicial
      IF COALESCE((v_variant->>'stock')::integer, 0) > 0 THEN
        INSERT INTO public.stock_movements (
          variant_id,
          store_id,
          movement_type,
          qty,
          note
        ) VALUES (
          v_variant_id,
          v_store_id,
          'adjustment',
          (v_variant->>'stock')::integer,
          'Estoque Inicial (Criação)'
        );
      END IF;
    END LOOP;
  ELSE
    -- Criação de Variante Padrão caso array esteja vazio
    INSERT INTO public.product_variants (
      product_id,
      sku,
      price_override_cents,
      attributes,
      stock_on_hand,
      created_at,
      updated_at
    )
    VALUES (
      v_product_id,
      payload->>'slug' || '-01',
      COALESCE((payload->>'price_cents')::integer, 0),
      COALESCE(payload->'attributes', '{}'::jsonb),
      10, -- default fallback
      v_now,
      v_now
    ) RETURNING id INTO v_default_variant_id;

    INSERT INTO public.stock_movements (
      variant_id,
      store_id,
      movement_type,
      qty,
      note
    ) VALUES (
      v_default_variant_id,
      v_store_id,
      'adjustment',
      10,
      'Estoque Inicial (Padrão)'
    );
  END IF;

  -- 5. Inserir Media Global do Produto (não associada a variante específica)
  IF jsonb_typeof(payload->'media_urls') = 'array' AND jsonb_array_length(payload->'media_urls') > 0 THEN
    FOR v_media_url IN SELECT jsonb_array_elements_text(payload->'media_urls')
    LOOP
      INSERT INTO public.product_media (
        product_id,
        url,
        media_type,
        sort_order
      ) VALUES (
        v_product_id,
        v_media_url,
        'image',
        99
      );
    END LOOP;
  END IF;

  SELECT jsonb_build_object('id', v_product_id) INTO v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- O Postgres garante rollback automático caso qualquer insert falhe ou a exceção seja lançada.
  RAISE EXCEPTION 'Falha atômica ao criar produto: %', SQLERRM;
END;
$$;
