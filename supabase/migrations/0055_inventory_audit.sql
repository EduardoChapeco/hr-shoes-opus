-- ============================================================================
-- Hr Shoes Commerce — Migration 0055: Inventory Audit RPC (Microfase 6)
-- ============================================================================
-- Cria a RPC oficial para realizar "Contagem de Balanço" (Auditoria),
-- garantindo que discrepâncias entre prateleira e sistema sejam imutavelmente
-- registradas como adjustments, mantendo as invariantes contábeis.

BEGIN;

CREATE OR REPLACE FUNCTION public.perform_stock_audit(
  p_variant_id UUID,
  p_counted_qty INTEGER,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variant RECORD;
  v_store_id UUID;
  v_diff INTEGER;
  v_movement_type TEXT;
  v_actor_id UUID;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Auditoria requer usuário autenticado.';
  END IF;

  -- 1. Obter a variante atual com LOCK (evita vendas simultâneas corrompendo a contagem)
  SELECT id, product_id, stock_on_hand, stock_reserved 
  INTO v_variant 
  FROM public.product_variants 
  WHERE id = p_variant_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variante não encontrada.';
  END IF;

  IF p_counted_qty < 0 THEN
    RAISE EXCEPTION 'A contagem de prateleira não pode ser negativa.';
  END IF;

  -- Para segurança da loja e do log, associamos ao store_id real
  SELECT store_id INTO v_store_id FROM public.products WHERE id = v_variant.product_id;

  -- Validação de permissões: o ator deve ter papel gerencial ou ser estoquista da loja
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_actor_id AND store_id = v_store_id AND role IN ('owner', 'admin', 'manager', 'stock')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: Apenas estoquistas ou gerentes podem realizar balanço de estoque.';
  END IF;

  -- 2. Calcular a diferença (Diff)
  v_diff := p_counted_qty - v_variant.stock_on_hand;

  -- Se a contagem for igual ao sistema, não há movimento a ser feito
  IF v_diff = 0 THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'message', 'Contagem confere com o sistema. Nenhum ajuste necessário.',
      'diff', 0
    );
  END IF;

  -- 3. Definir o tipo de movimento baseado no motivo (reason)
  -- Aceitamos: 'damage', 'loss', 'recount', 'return_defect'
  IF p_reason = 'damage' OR p_reason = 'loss' THEN
    v_movement_type := 'damage';
    IF v_diff > 0 THEN 
      RAISE EXCEPTION 'Um relato de quebra/perda não pode resultar em aumento de estoque.';
    END IF;
  ELSE
    v_movement_type := 'adjustment';
  END IF;

  -- 4. Registrar a movimentação imutável
  INSERT INTO public.stock_movements (
    variant_id, store_id, movement_type, qty, note, actor_id, reference_type
  ) VALUES (
    p_variant_id, v_store_id, v_movement_type, v_diff, 
    COALESCE(p_notes, 'Auditoria de Balanço: ' || p_reason), v_actor_id, 'inventory_audit'
  );

  -- 5. Atualizar o saldo da variante
  UPDATE public.product_variants
  SET stock_on_hand = p_counted_qty,
      updated_at = now()
  WHERE id = p_variant_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Estoque ajustado com sucesso.',
    'diff', v_diff,
    'new_stock_on_hand', p_counted_qty
  );
END;
$$;

COMMIT;
