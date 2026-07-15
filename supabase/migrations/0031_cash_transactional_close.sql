-- ============================================================================
-- Hr Shoes Commerce — Migration 0031: Cash Transactional Close
-- ============================================================================
-- Creates an atomic RPC function to close a cash register.
-- This ensures that no concurrent transactions can sneak in after we read the
-- current balance but before we update the register status, preventing silent
-- ledger discrepancies.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.close_cash_register(
  p_register_id UUID,
  p_counted_cents INTEGER,
  p_user_id UUID,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register public.cash_registers%ROWTYPE;
  v_sum_entries INTEGER;
  v_expected INTEGER;
  v_discrepancy BOOLEAN;
  v_new_status public.cash_register_status;
BEGIN
  -- 1. Lock the register row for update (prevents concurrent closes or entries if they lock)
  SELECT *
  INTO v_register
  FROM public.cash_registers
  WHERE id = p_register_id
  FOR UPDATE;

  -- 2. Validate existence and status
  IF v_register IS NULL THEN
    RAISE EXCEPTION 'Caixa não encontrado';
  END IF;

  IF v_register.status != 'open' THEN
    RAISE EXCEPTION 'Este caixa já não está mais aberto';
  END IF;

  -- 3. Calculate sum of entries
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_sum_entries
  FROM public.cash_register_entries
  WHERE register_id = p_register_id;

  -- 4. Calculate expected and determine discrepancy
  v_expected := v_register.initial_balance_cents + v_sum_entries;
  v_discrepancy := v_expected != p_counted_cents;
  
  IF v_discrepancy THEN
    v_new_status := 'discrepancy'::public.cash_register_status;
    IF p_notes IS NULL OR p_notes = '' THEN
      p_notes := 'Fechado com diferença de caixa';
    END IF;
  ELSE
    v_new_status := 'closed'::public.cash_register_status;
  END IF;

  -- 5. Update the register atomically
  UPDATE public.cash_registers
  SET 
    status = v_new_status,
    closed_by = p_user_id,
    closed_at = now(),
    expected_balance_cents = v_expected,
    final_balance_cents = p_counted_cents,
    notes = p_notes,
    updated_at = now()
  WHERE id = p_register_id;

  -- 6. Return standard result
  RETURN json_build_object(
    'status', 'success',
    'expected', v_expected,
    'counted', p_counted_cents,
    'discrepancy', v_discrepancy
  );
END;
$$;

-- Ensure only authenticated users can run this RPC (RLS is enforced manually inside if needed, 
-- but here we rely on the Server Function to authorize identity before calling the RPC).
-- Granting to service_role to be used by the backend.
REVOKE EXECUTE ON FUNCTION public.close_cash_register(UUID, INTEGER, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_cash_register(UUID, INTEGER, UUID, TEXT) TO service_role;
