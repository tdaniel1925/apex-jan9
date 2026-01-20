-- ============================================
-- PHASE 2: Commission Workflow Transaction Function
-- Ensures atomic creation of commission + overrides + wallet credits
-- ============================================

/**
 * Create commission with all downstream effects in a single transaction
 * This prevents partial commission creation when any step fails
 *
 * Returns: JSONB with commission_id, overrides_created, wallet_credits
 */
CREATE OR REPLACE FUNCTION create_commission_with_overrides(
  p_commission_data JSONB,
  p_agent_id UUID,
  p_upline_agent_ids UUID[],
  p_override_amounts DECIMAL[]
) RETURNS JSONB AS $$
DECLARE
  v_commission_id UUID;
  v_override_id UUID;
  v_wallet_id UUID;
  v_result JSONB;
  v_overrides_created INT := 0;
  v_wallet_credits INT := 0;
  i INT;
BEGIN
  -- Step 1: Create commission
  INSERT INTO commissions (
    agent_id,
    carrier,
    policy_number,
    premium_amount,
    commission_rate,
    commission_amount,
    bonus_volume,
    policy_date,
    source,
    status
  ) VALUES (
    p_agent_id,
    p_commission_data->>'carrier',
    p_commission_data->>'policy_number',
    (p_commission_data->>'premium_amount')::DECIMAL,
    (p_commission_data->>'commission_rate')::DECIMAL,
    (p_commission_data->>'commission_amount')::DECIMAL,
    (p_commission_data->>'bonus_volume')::DECIMAL,
    (p_commission_data->>'policy_date')::DATE,
    COALESCE(p_commission_data->>'source', 'manual'),
    'pending'
  )
  RETURNING id INTO v_commission_id;

  -- Step 2: Credit agent's wallet for commission
  -- Get agent's wallet
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE agent_id = p_agent_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for agent %', p_agent_id;
  END IF;

  -- Credit wallet (pending)
  UPDATE wallets
  SET pending_balance = pending_balance + (p_commission_data->>'commission_amount')::DECIMAL,
      lifetime_earnings = lifetime_earnings + (p_commission_data->>'commission_amount')::DECIMAL,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    agent_id,
    type,
    category,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id
  ) VALUES (
    p_agent_id,
    'credit',
    'commission',
    (p_commission_data->>'commission_amount')::DECIMAL,
    (SELECT pending_balance FROM wallets WHERE id = v_wallet_id),
    'Commission: ' || (p_commission_data->>'policy_number'),
    'commission',
    v_commission_id
  );

  v_wallet_credits := v_wallet_credits + 1;

  -- Step 3: Create overrides for upline agents
  FOR i IN 1..array_length(p_upline_agent_ids, 1)
  LOOP
    -- Get upline agent's wallet
    SELECT id INTO v_wallet_id
    FROM wallets
    WHERE agent_id = p_upline_agent_ids[i];

    IF v_wallet_id IS NULL THEN
      -- Skip if wallet doesn't exist (should not happen)
      CONTINUE;
    END IF;

    -- Create override record
    INSERT INTO overrides (
      agent_id,
      commission_id,
      generation,
      override_amount,
      source_agent_id,
      status
    ) VALUES (
      p_upline_agent_ids[i],
      v_commission_id,
      i, -- Generation number
      p_override_amounts[i],
      p_agent_id,
      'pending'
    )
    RETURNING id INTO v_override_id;

    v_overrides_created := v_overrides_created + 1;

    -- Credit upline wallet (pending)
    UPDATE wallets
    SET pending_balance = pending_balance + p_override_amounts[i],
        lifetime_earnings = lifetime_earnings + p_override_amounts[i],
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Create transaction record
    INSERT INTO wallet_transactions (
      agent_id,
      type,
      category,
      amount,
      balance_after,
      description,
      reference_type,
      reference_id
    ) VALUES (
      p_upline_agent_ids[i],
      'credit',
      'override',
      p_override_amounts[i],
      (SELECT pending_balance FROM wallets WHERE id = v_wallet_id),
      format('Gen %s override from policy %s', i, p_commission_data->>'policy_number'),
      'override',
      v_override_id
    );

    v_wallet_credits := v_wallet_credits + 1;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'commission_id', v_commission_id,
    'overrides_created', v_overrides_created,
    'wallet_credits', v_wallet_credits
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on any error
    RAISE EXCEPTION 'Commission creation transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION create_commission_with_overrides IS 'Creates commission, overrides, and wallet credits in a single atomic transaction';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
