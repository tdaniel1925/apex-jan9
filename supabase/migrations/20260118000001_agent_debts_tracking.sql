-- ============================================
-- FIX: Clawback Negative Balance Masking
-- Add agent_debts table to track amounts owed to platform
-- ============================================

-- Create agent_debts table
CREATE TABLE IF NOT EXISTS agent_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  debt_type VARCHAR(50) NOT NULL, -- clawback_commission, clawback_override, clawback_bonus, adjustment
  original_amount DECIMAL(12,2) NOT NULL, -- Original debt amount
  remaining_amount DECIMAL(12,2) NOT NULL, -- Amount still owed
  commission_id UUID REFERENCES commissions(id), -- Reference to clawed back commission
  override_id UUID REFERENCES overrides(id), -- Reference to clawed back override
  bonus_id UUID REFERENCES bonuses(id), -- Reference to clawed back bonus
  description TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL, -- 'system' or admin user ID
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, repaying, paid, forgiven
  repayment_plan_id UUID, -- Future: link to repayment plan
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_debts_agent ON agent_debts(agent_id);
CREATE INDEX idx_agent_debts_status ON agent_debts(status);
CREATE INDEX idx_agent_debts_commission ON agent_debts(commission_id);

-- Add debt repayments tracking table
CREATE TABLE IF NOT EXISTS agent_debt_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES agent_debts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  repayment_amount DECIMAL(12,2) NOT NULL,
  repayment_type VARCHAR(50) NOT NULL, -- automatic_deduction, manual_payment, commission_offset, forgiven
  source_transaction_id UUID REFERENCES wallet_transactions(id),
  description TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debt_repayments_debt ON agent_debt_repayments(debt_id);
CREATE INDEX idx_debt_repayments_agent ON agent_debt_repayments(agent_id);

-- ============================================
-- FUNCTION: Calculate total active debt for an agent
-- ============================================
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

-- ============================================
-- FUNCTION: Create debt record from clawback
-- ============================================
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
    p_amount, -- Initially, remaining = original
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

-- ============================================
-- FUNCTION: Apply repayment to debt
-- ============================================
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
  FOR UPDATE; -- Lock row

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
-- FUNCTION: Auto-deduct debt from new commissions
-- ============================================
CREATE OR REPLACE FUNCTION auto_deduct_debt_from_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debt DECIMAL(12,2);
  v_deduction_amount DECIMAL(12,2);
  v_remaining_commission DECIMAL(12,2);
  v_debt_record RECORD;
BEGIN
  -- Get agent's total active debt
  v_total_debt := get_agent_total_debt(NEW.agent_id);

  -- If no debt, nothing to do
  IF v_total_debt <= 0 THEN
    RETURN NEW;
  END IF;

  -- Calculate how much to deduct (up to 50% of commission or total debt, whichever is less)
  v_deduction_amount := LEAST(NEW.commission_amount * 0.5, v_total_debt);
  v_remaining_commission := NEW.commission_amount - v_deduction_amount;

  -- Apply deduction to oldest debts first (FIFO)
  FOR v_debt_record IN
    SELECT id, remaining_amount
    FROM agent_debts
    WHERE agent_id = NEW.agent_id
      AND status = 'active'
    ORDER BY created_at ASC
  LOOP
    -- Exit if we've used all deduction amount
    EXIT WHEN v_deduction_amount <= 0;

    -- Apply partial or full repayment
    DECLARE
      v_payment DECIMAL(12,2);
    BEGIN
      v_payment := LEAST(v_deduction_amount, v_debt_record.remaining_amount);

      PERFORM apply_debt_repayment(
        v_debt_record.id,
        v_payment,
        'commission_offset',
        format('Auto-deducted from commission %s', NEW.id),
        'system'
      );

      v_deduction_amount := v_deduction_amount - v_payment;
    END;
  END LOOP;

  -- Update commission amount to reflect deduction
  NEW.commission_amount := v_remaining_commission;

  -- Log the deduction in notes
  NEW.notes := COALESCE(NEW.notes || E'\n', '') ||
               format('Debt deduction applied: $%.2f', NEW.commission_amount);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- OPTIONAL: Enable auto-deduction from commissions (can be toggled)
-- DROP TRIGGER IF EXISTS trigger_auto_deduct_debt ON commissions;
-- CREATE TRIGGER trigger_auto_deduct_debt
--   BEFORE INSERT ON commissions
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_deduct_debt_from_commission();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
