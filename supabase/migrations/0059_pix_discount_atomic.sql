-- ============================================================================
-- Hr Shoes Commerce — Migration 0059: PIX Discount in Checkout Transaction
-- ============================================================================

BEGIN;

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
  -- 0. Get the cart before it gets closed by atomic
  SELECT * INTO v_cart FROM public.carts WHERE id = p_cart_id FOR UPDATE;

  -- 1. Run the base checkout atomic function
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

  -- 2. Apply Match Time Offer (if any) ATOMICALLY WITH EXPIRE CHECK
  IF v_cart.match_time_offer_id IS NOT NULL AND v_total_cents > 0 THEN
    SELECT * INTO v_offer FROM public.match_time_offers WHERE id = v_cart.match_time_offer_id FOR UPDATE;
    IF FOUND AND v_offer.status = 'active' THEN
      IF v_offer.expires_at > now() THEN
        -- Verify if the product is actually in the order
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

  -- 3. Apply Manual Payment Method Surcharges or Discounts (if any)
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

  v_commission_base := v_total_cents; -- Base da comissão é o total líquido ANTES do gift card

  -- 4. Apply Gift Card (if any) ATOMICALLY WITH LOCK
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

  -- 5. Update the order and payment with final calculated values
  UPDATE public.orders SET total_cents = GREATEST(0, v_total_cents), discount_cents = v_discount_cents, seller_id = COALESCE(p_affiliate_id, seller_id) WHERE id = v_order_id;
  UPDATE public.payments SET amount_cents = GREATEST(0, v_total_cents), provider_name = COALESCE(v_provider_name, provider_name) WHERE order_id = v_order_id;

  -- 6. COMMISSION ENGINE: Calculate and insert commission for affiliate
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

COMMIT;
