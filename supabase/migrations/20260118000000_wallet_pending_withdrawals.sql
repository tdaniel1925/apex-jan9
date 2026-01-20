-- ============================================
-- FIX: Wallet Concurrent Withdrawal Race Condition
-- Add pending_withdrawals column to track locked funds
-- ============================================

-- Add pending_withdrawals column to wallets table
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS pending_withdrawals DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Add CHECK constraint to ensure pending_withdrawals never exceeds balance
ALTER TABLE wallets
ADD CONSTRAINT wallets_pending_withdrawals_check
CHECK (pending_withdrawals >= 0 AND pending_withdrawals <= balance);

-- Add index for queries on pending withdrawals
CREATE INDEX IF NOT EXISTS idx_wallets_pending_withdrawals
ON wallets(pending_withdrawals)
WHERE pending_withdrawals > 0;

-- Add comment explaining the column
COMMENT ON COLUMN wallets.pending_withdrawals IS 'Amount locked by pending withdrawal requests to prevent double-withdrawal race conditions';

-- ============================================
-- FUNCTION: Lock funds for pending withdrawal
-- ============================================
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

-- ============================================
-- FUNCTION: Unlock funds when withdrawal completes/fails
-- ============================================
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

-- ============================================
-- TRIGGER: Auto-unlock funds on payout status changes
-- ============================================
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
-- MIGRATION COMPLETE
-- ============================================
