-- ============================================================================
-- Hr Shoes Commerce — Migration 20260731000000: Advanced Backorders, POS & ACL
-- ============================================================================
-- 1. Backorder Support (product_variants)
-- 2. POS Settings (manager override config)
-- 3. Advanced RBAC (profiles)

BEGIN;

-- ============================================================================
-- 1. BACKORDERS & INVENTORY
-- ============================================================================
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backorder_lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_payment_for_backorder BOOLEAN DEFAULT true;

-- ============================================================================
-- 2. PROFILES (ACL & POS PIN)
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS acl_permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pos_pin_code TEXT DEFAULT NULL;

-- ============================================================================
-- 3. POS SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pos_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  require_pin_for_void BOOLEAN DEFAULT true,
  require_pin_for_discount BOOLEAN DEFAULT true,
  max_discount_without_pin DECIMAL(5,2) DEFAULT 10.00,
  require_pin_for_refund BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_pos_settings_store UNIQUE (store_id)
);

ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_settings_read_staff" ON public.pos_settings
  FOR SELECT USING (public.is_store_staff(store_id));

CREATE POLICY "pos_settings_write_owner" ON public.pos_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND store_id = pos_settings.store_id AND role IN ('owner', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.batch_upsert_variant_matrix_v5(
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
  -- 1. Validar Identidade e Multi-tenancy
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

    -- Tentar encontrar variante existente por ID
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

    -- Gerar SKU caso não exista na entrada
    IF v_item->>'sku' IS NULL OR v_item->>'sku' = '' OR v_item->>'sku' = 'null' THEN
      SELECT string_agg(upper(substring(value, 1, 3)), '-') INTO v_sku_suffix
      FROM jsonb_each_text(v_item->'attributes');

      v_sku := 'SKU-' || upper(substring(product_id_param::text, 1, 8)) || '-' || COALESCE(v_sku_suffix, 'VAR-' || v_count);
    ELSE
      v_sku := v_item->>'sku';
    END IF;

    -- Concorrência de Estoque
    v_new_stock := COALESCE(NULLIF(v_item->>'stock', '')::integer, 0);
    IF v_item ? 'original_stock' AND v_item->>'original_stock' IS NOT NULL AND v_item->>'original_stock' <> 'null' THEN
      v_original_stock := (v_item->>'original_stock')::integer;
      v_diff := v_new_stock - v_original_stock;
    ELSE
      v_diff := v_new_stock - COALESCE(v_current_stock, 0);
    END IF;

    IF v_variant_id IS NOT NULL THEN
      -- Atualiza variante existente na prateleira
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
        weight_kg = CASE 
          WHEN v_item->>'weight_kg' IS NULL OR v_item->>'weight_kg' = 'null' OR v_item->>'weight_kg' = '' 
          THEN NULL 
          ELSE (v_item->>'weight_kg')::numeric(10,3) 
        END,
        ean = CASE 
          WHEN v_item->>'ean' IS NULL OR v_item->>'ean' = 'null' OR v_item->>'ean' = '' 
          THEN NULL 
          ELSE v_item->>'ean'
        END,
        allow_backorder = COALESCE((v_item->>'allow_backorder')::boolean, allow_backorder, false),
        backorder_lead_time_days = COALESCE((v_item->>'backorder_lead_time_days')::integer, backorder_lead_time_days, 0),
        requires_payment_for_backorder = COALESCE((v_item->>'requires_payment_for_backorder')::boolean, requires_payment_for_backorder, true),
        attributes = COALESCE(v_item->'attributes', attributes),
        stock_on_hand = stock_on_hand + v_diff,
        status = COALESCE(v_item->>'status', 'active'),
        updated_at = v_now
      WHERE id = v_variant_id;
    ELSE
      -- Cria nova variante já com saldo canônico
      INSERT INTO public.product_variants (
        product_id,
        sku,
        price_override_cents,
        cost_cents,
        weight_kg,
        ean,
        allow_backorder,
        backorder_lead_time_days,
        requires_payment_for_backorder,
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
          WHEN v_item->>'weight_kg' IS NULL OR v_item->>'weight_kg' = 'null' OR v_item->>'weight_kg' = '' 
          THEN NULL 
          ELSE (v_item->>'weight_kg')::numeric(10,3) 
        END,
        CASE 
          WHEN v_item->>'ean' IS NULL OR v_item->>'ean' = 'null' OR v_item->>'ean' = '' 
          THEN NULL 
          ELSE v_item->>'ean'
        END,
        COALESCE((v_item->>'allow_backorder')::boolean, false),
        COALESCE((v_item->>'backorder_lead_time_days')::integer, 0),
        COALESCE((v_item->>'requires_payment_for_backorder')::boolean, true),
        v_item->'attributes',
        v_new_stock,
        COALESCE(v_item->>'status', 'active'),
        v_now,
        v_now
      ) RETURNING id INTO v_variant_id;
    END IF;

    v_processed_ids := array_append(v_processed_ids, v_variant_id);

    -- 3. Mídia
    IF v_item->>'image_url' IS NOT NULL AND (v_item->>'image_url') <> '' AND (v_item->>'image_url') <> 'null' THEN
      SELECT id INTO v_media_id FROM public.product_media 
      WHERE product_id = product_id_param AND variant_id = v_variant_id AND url = v_item->>'image_url' 
      LIMIT 1;

      IF v_media_id IS NULL THEN
        INSERT INTO public.product_media (product_id, variant_id, url)
        VALUES (product_id_param, v_variant_id, v_item->>'image_url');
      END IF;
    END IF;

    -- 4. Stock Movement
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

  -- 5. Lidar com Zumbis (Variantes removidas da UI viram archived)
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

COMMIT;
