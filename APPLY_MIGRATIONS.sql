-- ============================================
-- COMBINED MIGRATIONS - Apply to Remote Database
-- Date: 2026-01-19
-- Migrations: 20260118000000 through 20260118000003
-- ============================================

-- ============================================
-- MIGRATION 1: Wallet Pending Withdrawals
-- ============================================
-- Add pending_withdrawals column to wallets table
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS pending_withdrawals DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Add CHECK constraint to ensure pending_withdrawals never exceeds balance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallets_pending_withdrawals_check'
  ) THEN
    ALTER TABLE wallets
    ADD CONSTRAINT wallets_pending_withdrawals_check
    CHECK (pending_withdrawals >= 0 AND pending_withdrawals <= balance);
  END IF;
END$$;

-- Add index for queries on pending withdrawals
CREATE INDEX IF NOT EXISTS idx_wallets_pending_withdrawals
ON wallets(pending_withdrawals)
WHERE pending_withdrawals > 0;

-- Add comment explaining the column
COMMENT ON COLUMN wallets.pending_withdrawals IS 'Amount locked by pending withdrawal requests to prevent double-withdrawal race conditions';

-- FUNCTION: Lock funds for pending withdrawal
CREATE OR REPLACE FUNCTION lock_withdrawal_funds(
  p_agent_id UUID,
  p_amount DECIMAL(12,2)
) RETURNS BOOLEAN AS $$
DECLARE
  v_available DECIMAL(12,2);
BEGIN
  -- Get available balance (balance - pending_withdrawals) with row lock
  SELECT balance - pending_withdrawals INTO v_available
  FROM wallets
  WHERE agent_id = p_agent_id
  FOR UPDATE; -- Lock the row to prevent concurrent modifications

  -- Check if sufficient funds available
  IF v_available < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Lock the funds
  UPDATE wallets
  SET pending_withdrawals = pending_withdrawals + p_amount,
      updated_at = NOW()
  WHERE agent_id = p_agent_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Unlock funds when withdrawal completes/fails
CREATE OR REPLACE FUNCTION unlock_withdrawal_funds(
  p_agent_id UUID,
  p_amount DECIMAL(12,2),
  p_deduct_from_balance BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  IF p_deduct_from_balance THEN
    -- Withdrawal completed successfully - deduct from both balance and pending_withdrawals
    UPDATE wallets
    SET balance = balance - p_amount,
        pending_withdrawals = pending_withdrawals - p_amount,
        updated_at = NOW()
    WHERE agent_id = p_agent_id;
  ELSE
    -- Withdrawal failed/cancelled - just unlock the funds
    UPDATE wallets
    SET pending_withdrawals = pending_withdrawals - p_amount,
        updated_at = NOW()
    WHERE agent_id = p_agent_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Auto-unlock funds on payout status changes
CREATE OR REPLACE FUNCTION handle_payout_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When payout is completed, unlock and deduct from balance
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM unlock_withdrawal_funds(NEW.agent_id, NEW.amount, TRUE);
  END IF;

  -- When payout is failed or rejected, unlock without deducting
  IF (NEW.status = 'failed' OR NEW.status = 'rejected')
     AND (OLD.status != 'failed' AND OLD.status != 'rejected') THEN
    PERFORM unlock_withdrawal_funds(NEW.agent_id, NEW.amount, FALSE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on payouts table
DROP TRIGGER IF EXISTS trigger_payout_status_change ON payouts;
CREATE TRIGGER trigger_payout_status_change
  AFTER UPDATE OF status ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION handle_payout_status_change();

-- ============================================
-- MIGRATION 2: Agent Debts Tracking
-- ============================================
-- Create agent_debts table
CREATE TABLE IF NOT EXISTS agent_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  debt_type VARCHAR(50) NOT NULL,
  original_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  commission_id UUID REFERENCES commissions(id),
  override_id UUID REFERENCES overrides(id),
  bonus_id UUID REFERENCES bonuses(id),
  description TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  repayment_plan_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_debts_agent ON agent_debts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_debts_status ON agent_debts(status);
CREATE INDEX IF NOT EXISTS idx_agent_debts_commission ON agent_debts(commission_id);

-- Add debt repayments tracking table
CREATE TABLE IF NOT EXISTS agent_debt_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES agent_debts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  repayment_amount DECIMAL(12,2) NOT NULL,
  repayment_type VARCHAR(50) NOT NULL,
  source_transaction_id UUID REFERENCES wallet_transactions(id),
  description TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt ON agent_debt_repayments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_repayments_agent ON agent_debt_repayments(agent_id);

-- FUNCTION: Calculate total active debt for an agent
CREATE OR REPLACE FUNCTION get_agent_total_debt(p_agent_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_total_debt DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(remaining_amount), 0)
  INTO v_total_debt
  FROM agent_debts
  WHERE agent_id = p_agent_id
    AND status = 'active';

  RETURN v_total_debt;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Create debt record from clawback
CREATE OR REPLACE FUNCTION create_clawback_debt(
  p_agent_id UUID,
  p_debt_type VARCHAR(50),
  p_amount DECIMAL(12,2),
  p_description TEXT,
  p_commission_id UUID DEFAULT NULL,
  p_override_id UUID DEFAULT NULL,
  p_bonus_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_debt_id UUID;
BEGIN
  INSERT INTO agent_debts (
    agent_id,
    debt_type,
    original_amount,
    remaining_amount,
    commission_id,
    override_id,
    bonus_id,
    description,
    created_by,
    status
  ) VALUES (
    p_agent_id,
    p_debt_type,
    p_amount,
    p_amount,
    p_commission_id,
    p_override_id,
    p_bonus_id,
    p_description,
    'system',
    'active'
  )
  RETURNING id INTO v_debt_id;

  RETURN v_debt_id;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Apply repayment to debt
CREATE OR REPLACE FUNCTION apply_debt_repayment(
  p_debt_id UUID,
  p_repayment_amount DECIMAL(12,2),
  p_repayment_type VARCHAR(50),
  p_description TEXT,
  p_created_by VARCHAR(50) DEFAULT 'system'
) RETURNS VOID AS $$
DECLARE
  v_agent_id UUID;
  v_remaining DECIMAL(12,2);
BEGIN
  -- Get agent ID and remaining debt
  SELECT agent_id, remaining_amount INTO v_agent_id, v_remaining
  FROM agent_debts
  WHERE id = p_debt_id
  FOR UPDATE;

  -- Can't repay more than remaining
  IF p_repayment_amount > v_remaining THEN
    RAISE EXCEPTION 'Repayment amount (%) exceeds remaining debt (%)', p_repayment_amount, v_remaining;
  END IF;

  -- Record repayment
  INSERT INTO agent_debt_repayments (
    debt_id,
    agent_id,
    repayment_amount,
    repayment_type,
    description,
    created_by
  ) VALUES (
    p_debt_id,
    v_agent_id,
    p_repayment_amount,
    p_repayment_type,
    p_description,
    p_created_by
  );

  -- Update remaining debt
  UPDATE agent_debts
  SET remaining_amount = remaining_amount - p_repayment_amount,
      status = CASE
        WHEN remaining_amount - p_repayment_amount <= 0 THEN 'paid'
        ELSE 'repaying'
      END,
      resolved_at = CASE
        WHEN remaining_amount - p_repayment_amount <= 0 THEN NOW()
        ELSE NULL
      END,
      updated_at = NOW()
  WHERE id = p_debt_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 3: Rate Limiting and Audit
-- ============================================
-- RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key_created ON rate_limit_requests(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_requests(created_at);

-- WEBHOOK EVENTS TABLE (Idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type ON webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- ADMIN AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_admin_email VARCHAR(255),
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id VARCHAR(255),
  p_changes JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check webhook idempotency
CREATE OR REPLACE FUNCTION check_webhook_processed(
  p_provider VARCHAR(50),
  p_event_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM webhook_events
    WHERE provider = p_provider
      AND event_id = p_event_id
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to record webhook event
CREATE OR REPLACE FUNCTION record_webhook_event(
  p_provider VARCHAR(50),
  p_event_id VARCHAR(255),
  p_event_type VARCHAR(100),
  p_payload JSONB,
  p_processing_result JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO webhook_events (
    provider,
    event_id,
    event_type,
    payload,
    processing_result
  ) VALUES (
    p_provider,
    p_event_id,
    p_event_type,
    p_payload,
    p_processing_result
  )
  ON CONFLICT (provider, event_id) DO UPDATE
  SET processing_result = EXCLUDED.processing_result,
      processed_at = NOW()
  RETURNING id INTO v_webhook_id;

  RETURN v_webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE rate_limit_requests IS 'Tracks API requests for rate limiting using token bucket algorithm';
COMMENT ON TABLE webhook_events IS 'Stores webhook events for idempotency checking and audit trail';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log of all admin actions for compliance and security';

-- ============================================
-- MIGRATION 4: Commission Workflow Transaction
-- ============================================
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
  SELECT id INTO v_wallet_id
  FROM wallets
  WHERE agent_id = p_agent_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for agent %', p_agent_id;
  END IF;

  UPDATE wallets
  SET pending_balance = pending_balance + (p_commission_data->>'commission_amount')::DECIMAL,
      lifetime_earnings = lifetime_earnings + (p_commission_data->>'commission_amount')::DECIMAL,
      updated_at = NOW()
  WHERE id = v_wallet_id;

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
    SELECT id INTO v_wallet_id
    FROM wallets
    WHERE agent_id = p_upline_agent_ids[i];

    IF v_wallet_id IS NULL THEN
      CONTINUE;
    END IF;

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
      i,
      p_override_amounts[i],
      p_agent_id,
      'pending'
    )
    RETURNING id INTO v_override_id;

    v_overrides_created := v_overrides_created + 1;

    UPDATE wallets
    SET pending_balance = pending_balance + p_override_amounts[i],
        lifetime_earnings = lifetime_earnings + p_override_amounts[i],
        updated_at = NOW()
    WHERE id = v_wallet_id;

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

  v_result := jsonb_build_object(
    'success', true,
    'commission_id', v_commission_id,
    'overrides_created', v_overrides_created,
    'wallet_credits', v_wallet_credits
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Commission creation transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_commission_with_overrides IS 'Creates commission, overrides, and wallet credits in a single atomic transaction';

-- ============================================
-- ALL MIGRATIONS COMPLETE
-- ============================================
SELECT 'All 4 migrations applied successfully!' AS status;
