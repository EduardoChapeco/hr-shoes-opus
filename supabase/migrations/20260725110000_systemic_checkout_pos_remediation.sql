-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725110000: Systemic Checkout & POS Remediation
-- ============================================================================
-- Saneamento definitivo do ecossistema de checkout (E-commerce e POS/Balcão).
-- Correção da falha sistêmica "operator does not exist: record ->> unknown" ao
-- iterar sobre jsonb_array_elements() em PL/pgSQL com variável do tipo RECORD.
-- Unificação de contratos transacionais e remoção de assinaturas ambíguas.
-- ============================================================================

BEGIN;

-- 1. Remoção de assinaturas legadas e concorrentes para evitar ambiguidade ("function is not unique")
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID);
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID, UUID);
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.process_checkout_atomic(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

DROP FUNCTION IF EXISTS public.process_checkout_transaction_v2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.process_checkout_transaction_v2(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID, UUID);

DROP FUNCTION IF EXISTS public.process_pos_sale_transaction(UUID, UUID, UUID, TEXT, UUID, TEXT, INTEGER, JSONB, TEXT);

-- 2. Recriação canônica de `process_checkout_atomic` (Core E-commerce) com tipagem estrita
CREATE OR REPLACE FUNCTION public.process_checkout_atomic(
  p_cart_id UUID,
  p_idempotency_key TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_document TEXT,
  p_customer_phone TEXT,
  p_shipping_method TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_cart RECORD;
  v_coupon RECORD;
  v_item RECORD;

  v_subtotal_cents INTEGER := 0;
  v_discount_cents INTEGER := 0;
  v_shipping_cents INTEGER := 0;
  v_total_cents INTEGER := 0;

  v_order_id UUID;
  v_order_public_token TEXT;
  v_items_snapshot JSONB := '[]'::JSONB;
BEGIN
  -- 1. Limpeza lazy de reservas expiradas
  PERFORM public.release_expired_reservations();

  -- 2. Checagem de Idempotência
  SELECT o.public_token, o.id INTO v_order_public_token, v_order_id
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_order_public_token IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'orderToken', v_order_public_token,
      'is_idempotent_replay', true
    );
  END IF;

  -- 3. Bloqueio transacional do Carrinho (Pessimistic Lock)
  SELECT * INTO v_cart
  FROM public.carts
  WHERE id = p_cart_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carrinho não encontrado ou já processado.';
  END IF;

  v_store_id := v_cart.store_id;
  v_shipping_cents := COALESCE(v_cart.shipping_cents, 0);

  -- 4. Construção do snapshot de itens com consolidação de logística e preços
  FOR v_item IN (
    SELECT
      ci.qty,
      ci.price_snapshot_cents,
      ci.variant_id,
      pv.sku,
      pv.display_name,
      p.title AS product_title,
      p.preparation_time_days,
      COALESCE(pv.price_override_cents, p.price_cents) AS effective_price_cents,
      COALESCE(pv.cost_cents, p.cost_cents) AS effective_cost_cents,
      COALESCE(pv.weight_kg, p.weight_kg) AS effective_weight_kg,
      COALESCE(pv.width_cm,  p.width_cm)  AS effective_width_cm,
      COALESCE(pv.height_cm, p.height_cm) AS effective_height_cm,
      COALESCE(pv.length_cm, p.length_cm) AS effective_length_cm,
      p.is_physical,
      COALESCE(pv.ean, p.ean) AS effective_ean,
      pv.attributes AS variant_attributes,
      pv.stock_on_hand,
      pm.url AS image_url
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN LATERAL (
      SELECT url FROM public.product_media
      WHERE product_id = p.id AND (variant_id = pv.id OR variant_id IS NULL)
      ORDER BY (variant_id = pv.id) DESC, sort_order ASC
      LIMIT 1
    ) pm ON true
    WHERE ci.cart_id = p_cart_id
  ) LOOP
    v_subtotal_cents := v_subtotal_cents + (v_item.qty * v_item.price_snapshot_cents);

    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id',         v_item.variant_id,
      'qty',                v_item.qty,
      'unit_price_cents',   v_item.price_snapshot_cents,
      'total_cents',        (v_item.qty * v_item.price_snapshot_cents),
      'cost_cents',         v_item.effective_cost_cents,
      'product_title',      v_item.product_title,
      'display_name',       v_item.display_name,
      'variant_sku',        v_item.sku,
      'variant_ean',        v_item.effective_ean,
      'variant_attributes', COALESCE(v_item.variant_attributes, '{}'::jsonb),
      'image_url',          v_item.image_url,
      'weight_kg',          v_item.effective_weight_kg,
      'width_cm',           v_item.effective_width_cm,
      'height_cm',          v_item.effective_height_cm,
      'length_cm',          v_item.effective_length_cm,
      'is_physical',        v_item.is_physical,
      'preparation_days',   v_item.preparation_time_days
    );
  END LOOP;

  IF jsonb_array_length(v_items_snapshot) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio.';
  END IF;

  -- 5. Aplicação transacional de Cupom de Desconto
  IF v_cart.coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE store_id = v_store_id AND code = v_cart.coupon_code AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Cupom inválido ou inativo.'; END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN RAISE EXCEPTION 'Cupom expirado.'; END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN RAISE EXCEPTION 'Cupom atingiu o limite de usos.'; END IF;
    IF v_coupon.min_order_cents IS NOT NULL AND v_subtotal_cents < v_coupon.min_order_cents THEN RAISE EXCEPTION 'Valor mínimo não atingido para o cupom.'; END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount_cents := floor(v_subtotal_cents * (v_coupon.discount_value / 100.0))::INTEGER;
    ELSIF v_coupon.discount_type = 'fixed_amount' THEN
      v_discount_cents := floor(v_coupon.discount_value * 100)::INTEGER;
      IF v_discount_cents > v_subtotal_cents THEN v_discount_cents := v_subtotal_cents; END IF;
    ELSIF v_coupon.discount_type = 'free_shipping' THEN
      v_shipping_cents := 0;
      v_discount_cents := 0;
    END IF;

    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = v_coupon.id;
  END IF;

  v_total_cents := v_subtotal_cents + v_shipping_cents - v_discount_cents;
  IF v_total_cents < 0 THEN v_total_cents := 0; END IF;

  -- 6. Criação do Pedido (Status inicial: awaiting_payment para todo método online)
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, shipping_address,
    customer_snapshot
  ) VALUES (
    v_store_id, v_cart.customer_id, 'awaiting_payment', v_items_snapshot,
    v_subtotal_cents, v_shipping_cents, v_discount_cents, v_total_cents,
    p_shipping_method, p_shipping_address,
    jsonb_build_object(
      'name', p_customer_name,
      'email', p_customer_email,
      'document', p_customer_document,
      'phone', p_customer_phone
    )
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 7. Processamento estrito dos Itens de Pedido e Movimentação de Estoque
  -- CORREÇÃO CRÍTICA: Apelidar a coluna gerada por jsonb_array_elements para item_json,
  -- eliminando o erro fatal "operator does not exist: record ->> unknown".
  FOR v_item IN (
    SELECT el AS item_json FROM jsonb_array_elements(v_items_snapshot) AS el
  ) LOOP
    INSERT INTO public.order_items (
      order_id, variant_id, product_title, variant_sku,
      variant_attributes, image_url, qty, unit_price_cents, total_cents
    ) VALUES (
      v_order_id,
      (v_item.item_json->>'variant_id')::UUID,
      v_item.item_json->>'product_title',
      v_item.item_json->>'variant_sku',
      (v_item.item_json->>'variant_attributes')::JSONB,
      v_item.item_json->>'image_url',
      (v_item.item_json->>'qty')::INTEGER,
      (v_item.item_json->>'unit_price_cents')::INTEGER,
      (v_item.item_json->>'total_cents')::INTEGER
    );

    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty,
      reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item.item_json->>'variant_id')::UUID,
      v_store_id,
      'sale',
      -1 * (v_item.item_json->>'qty')::INTEGER,
      'order',
      v_order_id,
      'Pedido #' || v_order_public_token,
      v_cart.customer_id
    );

    -- Baixa transacional no estoque (físico e reservado)
    UPDATE public.product_variants
    SET
      stock_on_hand  = GREATEST(0, stock_on_hand  - (v_item.item_json->>'qty')::INTEGER),
      stock_reserved = GREATEST(0, stock_reserved - (v_item.item_json->>'qty')::INTEGER)
    WHERE id = (v_item.item_json->>'variant_id')::UUID;
  END LOOP;

  -- 8. Liberação da reserva do carrinho
  DELETE FROM public.stock_reservations WHERE cart_id = p_cart_id;

  -- 9. Registro de Tentativa de Pagamento (status inicial pending, imutável até confirmação real)
  INSERT INTO public.payments (
    order_id, store_id, method, status, amount_cents, idempotency_key
  ) VALUES (
    v_order_id,
    v_store_id,
    p_payment_method::public.payment_method,
    'pending',
    v_total_cents,
    p_idempotency_key
  );

  -- 10. Conclusão do Carrinho
  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;
  UPDATE public.carts SET status = 'completed' WHERE id = p_cart_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'orderToken', v_order_public_token,
    'is_idempotent_replay', false
  );
END;
$$;


-- 3. Recriação canônica do wrapper `process_checkout_transaction_v2` integrando tributação, ofertas e comissões
CREATE OR REPLACE FUNCTION public.process_checkout_transaction_v2(
  p_cart_id UUID,
  p_idempotency_key TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_document TEXT,
  p_customer_phone TEXT,
  p_shipping_method TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_gift_card_code TEXT,
  p_manual_payment_method_id UUID,
  p_affiliate_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkout_res JSONB;
  v_order_token TEXT;
  v_order_id UUID;
  v_store_id UUID;
  v_total_cents INTEGER;
  v_discount_cents INTEGER;
  v_surcharge_cents INTEGER := 0;
  v_gift_card_deduct INTEGER := 0;
  v_match_time_deduct INTEGER := 0;
  v_gift_card RECORD;
  v_manual_method RECORD;
  v_offer RECORD;
  v_cart RECORD;
  v_provider_name TEXT := NULL;
  
  v_seller_rate DECIMAL(5,2);
  v_commission_amount INTEGER := 0;
  v_commission_base INTEGER := 0;
BEGIN
  -- 0. Lock no carrinho antes de processar o atomic
  SELECT * INTO v_cart FROM public.carts WHERE id = p_cart_id FOR UPDATE;

  -- 1. Disparo do core checkout atomic recriado acima
  v_checkout_res := public.process_checkout_atomic(
    p_cart_id, p_idempotency_key, p_customer_name, p_customer_email,
    p_customer_document, p_customer_phone, p_shipping_method,
    p_shipping_address, p_payment_method
  );
  
  IF v_checkout_res->>'status' != 'success' THEN RETURN v_checkout_res; END IF;
  IF (v_checkout_res->>'is_idempotent_replay')::BOOLEAN THEN RETURN v_checkout_res; END IF;

  v_order_token := v_checkout_res->>'orderToken';
  
  SELECT id, store_id, total_cents, discount_cents INTO v_order_id, v_store_id, v_total_cents, v_discount_cents
  FROM public.orders WHERE public_token = v_order_token FOR UPDATE;

  -- 2. Aplicação de Ofertas Relâmpago Match Time com checagem de expiração
  IF v_cart.match_time_offer_id IS NOT NULL AND v_total_cents > 0 THEN
    SELECT * INTO v_offer FROM public.match_time_offers WHERE id = v_cart.match_time_offer_id FOR UPDATE;
    IF FOUND AND v_offer.status = 'active' THEN
      IF v_offer.expires_at > now() THEN
        IF EXISTS (SELECT 1 FROM public.order_items WHERE order_id = v_order_id AND variant_id IN (SELECT id FROM public.product_variants WHERE product_id = v_offer.product_id)) THEN
           v_match_time_deduct := floor(v_total_cents * (v_offer.discount_percentage / 100.0))::INTEGER;
           v_total_cents := GREATEST(0, v_total_cents - v_match_time_deduct);
           v_discount_cents := v_discount_cents + v_match_time_deduct;
           
           UPDATE public.match_time_offers SET status = 'redeemed', updated_at = now() WHERE id = v_offer.id;
        END IF;
      ELSE
        UPDATE public.match_time_offers SET status = 'expired', updated_at = now() WHERE id = v_offer.id;
      END IF;
    END IF;
  END IF;

  -- 3. Aplicação de taxas ou descontos por formas de pagamento e PIX
  IF p_manual_payment_method_id IS NOT NULL THEN
    SELECT * INTO v_manual_method FROM public.manual_payment_methods WHERE id = p_manual_payment_method_id;
    IF FOUND THEN
      v_provider_name := v_manual_method.name;
      IF v_manual_method.discount_percentage > 0 THEN
        v_surcharge_cents := -floor((v_total_cents + v_discount_cents) * (v_manual_method.discount_percentage / 100.0))::INTEGER;
      ELSIF v_manual_method.surcharge_percentage > 0 THEN
        v_surcharge_cents := floor((v_total_cents + v_discount_cents) * (v_manual_method.surcharge_percentage / 100.0))::INTEGER;
      END IF;
      v_total_cents := v_total_cents + v_surcharge_cents;
      IF v_surcharge_cents < 0 THEN v_discount_cents := v_discount_cents - v_surcharge_cents; END IF;
    END IF;
  ELSIF p_payment_method = 'pix' THEN
    DECLARE
      v_pix_disc_percentage NUMERIC := 0.0;
    BEGIN
      SELECT COALESCE((settings->'payment_settings'->>'pix_discount_percentage')::NUMERIC, 0.0)
      INTO v_pix_disc_percentage
      FROM public.stores
      WHERE id = v_store_id;

      IF v_pix_disc_percentage > 0 THEN
        v_surcharge_cents := -floor((v_total_cents + v_discount_cents) * (v_pix_disc_percentage / 100.0))::INTEGER;
        v_total_cents := v_total_cents + v_surcharge_cents;
        v_discount_cents := v_discount_cents - v_surcharge_cents;
        v_provider_name := 'PIX';
      END IF;
    END;
  END IF;

  v_commission_base := v_total_cents; -- Base da comissão é o total líquido antes do Gift Card

  -- 4. Aplicação Transacional do Gift Card
  IF p_gift_card_code IS NOT NULL AND v_total_cents > 0 THEN
    SELECT * INTO v_gift_card FROM public.gift_cards WHERE code = p_gift_card_code AND store_id = v_store_id FOR UPDATE;
    IF FOUND AND v_gift_card.status = 'active' AND v_gift_card.current_balance_cents > 0 THEN
      IF v_gift_card.expires_at IS NULL OR v_gift_card.expires_at > now() THEN
        v_gift_card_deduct := LEAST(v_total_cents, v_gift_card.current_balance_cents);
        v_total_cents := v_total_cents - v_gift_card_deduct;
        v_discount_cents := v_discount_cents + v_gift_card_deduct;
        
        UPDATE public.gift_cards
        SET current_balance_cents = current_balance_cents - v_gift_card_deduct,
            status = CASE WHEN current_balance_cents - v_gift_card_deduct = 0 THEN 'exhausted'::public.gift_card_status ELSE 'active'::public.gift_card_status END,
            updated_at = now()
        WHERE id = v_gift_card.id;
      END IF;
    END IF;
  END IF;

  -- 5. Atualização final de totais revalidados no servidor
  UPDATE public.orders SET total_cents = GREATEST(0, v_total_cents), discount_cents = v_discount_cents, seller_id = COALESCE(p_affiliate_id, seller_id) WHERE id = v_order_id;
  UPDATE public.payments SET amount_cents = GREATEST(0, v_total_cents), provider_name = COALESCE(v_provider_name, provider_name) WHERE order_id = v_order_id;

  -- 6. Motor de Comissões
  IF p_affiliate_id IS NOT NULL AND v_commission_base > 0 THEN
    SELECT commission_rate INTO v_seller_rate FROM public.profiles WHERE id = p_affiliate_id;
    IF v_seller_rate IS NOT NULL AND v_seller_rate > 0 THEN
      v_commission_amount := floor(v_commission_base * (v_seller_rate / 100.0))::INTEGER;
      
      INSERT INTO public.commissions (store_id, order_id, seller_id, amount_cents, status)
      VALUES (v_store_id, v_order_id, p_affiliate_id, v_commission_amount, 'pending');
    END IF;
  END IF;

  RETURN v_checkout_res;
END;
$$;


-- 4. Recriação canônica do PDV (`process_pos_sale_transaction`) corrigindo o mesmo erro sintático nos dois loops
CREATE OR REPLACE FUNCTION public.process_pos_sale_transaction(
  p_register_id UUID,
  p_store_id UUID,
  p_seller_id UUID,
  p_customer_name TEXT,
  p_customer_id UUID,
  p_payment_method TEXT,
  p_discount_cents INTEGER,
  p_items JSONB,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register RECORD;
  v_item RECORD;
  v_subtotal_cents INTEGER := 0;
  v_total_cents INTEGER := 0;
  v_order_id UUID;
  v_order_public_token TEXT;
  v_items_snapshot JSONB := '[]'::JSONB;
  v_payment_method_db TEXT;
  v_cash_entry_id UUID;
  v_has_negative_stock BOOLEAN := false;
  v_current_stock INTEGER;
  
  v_seller_rate DECIMAL(5,2);
  v_commission_amount INTEGER := 0;
BEGIN
  -- 1. Checagem de Idempotência
  SELECT o.public_token, o.id INTO v_order_public_token, v_order_id
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.idempotency_key = p_idempotency_key
  LIMIT 1;
  
  IF v_order_public_token IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success', 'orderId', v_order_id, 'orderToken', v_order_public_token, 'is_idempotent_replay', true
    );
  END IF;

  -- 2. Validação transacional do Caixa (deve estar aberto)
  SELECT * INTO v_register
  FROM public.cash_registers
  WHERE id = p_register_id AND store_id = p_store_id AND status = 'open'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caixa inválido, fechado ou não pertence a esta loja.';
  END IF;

  -- 3. Cálculo do Total e Construção de Snapshot - CORREÇÃO DO LOOP 1 DO POS
  FOR v_item IN (SELECT el AS item_json FROM jsonb_array_elements(p_items) AS el) LOOP
    v_subtotal_cents := v_subtotal_cents + ((v_item.item_json->>'qty')::INTEGER * (v_item.item_json->>'priceCents')::INTEGER);
    v_items_snapshot := v_items_snapshot || jsonb_build_object(
      'variant_id', v_item.item_json->>'variantId', 'qty', (v_item.item_json->>'qty')::INTEGER,
      'unit_price_cents', (v_item.item_json->>'priceCents')::INTEGER, 'total_cents', ((v_item.item_json->>'qty')::INTEGER * (v_item.item_json->>'priceCents')::INTEGER),
      'product_title', v_item.item_json->>'title', 'variant_sku', v_item.item_json->>'sku'
    );
  END LOOP;

  v_total_cents := GREATEST(0, v_subtotal_cents - COALESCE(p_discount_cents, 0));

  -- 4. Criação de Pedido do PDV (Status completed e delivered_at now() porque é entrega física de balcão)
  INSERT INTO public.orders (
    store_id, customer_id, status, items_snapshot,
    subtotal_cents, shipping_cents, discount_cents, total_cents,
    shipping_method, seller_id, paid_at, delivered_at, customer_snapshot
  ) VALUES (
    p_store_id, p_customer_id, 'completed', v_items_snapshot,
    v_subtotal_cents, 0, COALESCE(p_discount_cents, 0), v_total_cents,
    'pickup', p_seller_id, now(), now(),
    jsonb_build_object('name', COALESCE(p_customer_name, 'Cliente Avulso'))
  ) RETURNING id, public_token INTO v_order_id, v_order_public_token;

  -- 5. Inserção de order_items e baixa física de estoque - CORREÇÃO DO LOOP 2 DO POS
  FOR v_item IN (SELECT el AS item_json FROM jsonb_array_elements(v_items_snapshot) AS el) LOOP
    INSERT INTO public.order_items (
      order_id, variant_id, product_title, variant_sku, variant_attributes, image_url, qty, unit_price_cents, total_cents
    ) VALUES (
      v_order_id, (v_item.item_json->>'variant_id')::UUID, v_item.item_json->>'product_title', v_item.item_json->>'variant_sku', '{}'::JSONB, NULL, 
      (v_item.item_json->>'qty')::INTEGER, (v_item.item_json->>'unit_price_cents')::INTEGER, (v_item.item_json->>'total_cents')::INTEGER
    );
    
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      (v_item.item_json->>'variant_id')::UUID, p_store_id, 'sale', -1 * (v_item.item_json->>'qty')::INTEGER, 'order', v_order_id, 'PDV #' || v_order_public_token, p_seller_id
    );
    
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand - (v_item.item_json->>'qty')::INTEGER
    WHERE id = (v_item.item_json->>'variant_id')::UUID
    RETURNING stock_on_hand INTO v_current_stock;
    
    IF v_current_stock < 0 THEN v_has_negative_stock := true; END IF;
  END LOOP;

  -- 6. Registro de Pagamento do PDV
  IF p_payment_method = 'pix' THEN v_payment_method_db := 'pix';
  ELSIF p_payment_method IN ('credit', 'debit', 'credit_card') THEN v_payment_method_db := 'credit_card';
  ELSE v_payment_method_db := 'manual'; END IF;

  INSERT INTO public.payments (
    order_id, store_id, method, status, amount_cents, idempotency_key, paid_at, provider_name
  ) VALUES (
    v_order_id, p_store_id, v_payment_method_db::public.payment_method, 'paid', v_total_cents, p_idempotency_key, now(), 'PDV Balcão'
  );

  -- 7. Lançamento no Fluxo de Caixa Físico
  INSERT INTO public.cash_register_entries (
    register_id, order_id, amount_cents, method, description
  ) VALUES (
    p_register_id, v_order_id, v_total_cents, p_payment_method,
    'Venda PDV (' || COALESCE(p_customer_name, 'Cliente Avulso') || ') - Pedido: ' || v_order_public_token
  ) RETURNING id INTO v_cash_entry_id;

  -- 8. Motor de Comissões
  IF p_seller_id IS NOT NULL AND v_total_cents > 0 THEN
    SELECT commission_rate INTO v_seller_rate FROM public.profiles WHERE id = p_seller_id;
    IF v_seller_rate IS NOT NULL AND v_seller_rate > 0 THEN
      v_commission_amount := floor(v_total_cents * (v_seller_rate / 100.0))::INTEGER;
      
      INSERT INTO public.commissions (store_id, order_id, seller_id, amount_cents, status)
      VALUES (p_store_id, v_order_id, p_seller_id, v_commission_amount, 'pending');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success', 'receiptId', v_cash_entry_id, 'orderId', v_order_id,
    'orderToken', v_order_public_token, 'subtotalCents', v_subtotal_cents,
    'discountCents', COALESCE(p_discount_cents, 0), 'totalCents', v_total_cents,
    'hasNegativeStock', v_has_negative_stock, 'is_idempotent_replay', false
  );
END;
$$;

COMMIT;
