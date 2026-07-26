-- ============================================================================
-- Hr Shoes Commerce — Migration 20260726100000: Fail Order Atomic RPC
-- ============================================================================
-- RPC para atomicidade em falha de pagamentos (Cartão recusado, Pix expirado,
-- Rejeição Manual). Garante a devolução do estoque preso e estorno de comissões,
-- mesmo se chamada pelo webhook (Service Role) onde auth.uid() é nulo.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fail_order_payment(
  p_order_id UUID,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_commission RECORD;
  v_actor_id UUID;
BEGIN
  -- Permite NULL se for chamado via Service Role (Webhook)
  v_actor_id := auth.uid();
  
  -- 1. Obter o pedido com LOCK
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;

  IF v_order.status IN ('payment_failed', 'cancelled', 'completed', 'delivered', 'returned', 'refunded') THEN
    RAISE EXCEPTION 'O pedido já está em um status final ou não pode ser falhado: %', v_order.status;
  END IF;

  -- 2. Atualizar status do pedido para payment_failed
  UPDATE public.orders
  SET 
    status = 'payment_failed',
    -- Injetar o motivo no customer_snapshot ou notes para histórico
    customer_snapshot = jsonb_set(
      COALESCE(customer_snapshot, '{}'::jsonb),
      '{payment_failure_reason}',
      to_jsonb(p_reason)
    ),
    updated_at = now()
  WHERE id = p_order_id;

  -- 3. Estornar as comissões pendentes
  FOR v_commission IN (
    SELECT * FROM public.commissions WHERE order_id = p_order_id FOR UPDATE
  ) LOOP
    IF v_commission.status = 'pending' THEN
      UPDATE public.commissions
      SET status = 'cancelled', updated_at = now()
      WHERE id = v_commission.id;
    END IF;
  END LOOP;

  -- 4. Estornar o estoque via stock_movements
  FOR v_item IN (
    SELECT variant_id, qty
    FROM public.order_items
    WHERE order_id = p_order_id
  ) LOOP
    -- Inserir log de movimento (devolução). Actor pode ser nulo se for Webhook
    INSERT INTO public.stock_movements (
      variant_id, store_id, movement_type, qty, reference_type, reference_id, note, actor_id
    ) VALUES (
      v_item.variant_id, v_order.store_id, 'return', v_item.qty, 
      'order', p_order_id, 'Falha de Pagamento. Motivo: ' || p_reason, v_actor_id
    );

    -- Devolver à prateleira (stock_on_hand)
    UPDATE public.product_variants
    SET stock_on_hand = stock_on_hand + v_item.qty
    WHERE id = v_item.variant_id;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Pagamento falho registrado, estoque retornado e comissões revertidas.'
  );
END;
$$;

COMMIT;
