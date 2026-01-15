-- ============================================
-- WALLET ENHANCEMENTS
-- Banking info, withdrawal limits, payout improvements
-- ============================================

-- ============================================
-- AGENT BANKING INFORMATION
-- ============================================
CREATE TYPE bank_account_type AS ENUM ('checking', 'savings');
CREATE TYPE bank_account_status AS ENUM ('pending', 'verified', 'failed');

CREATE TABLE agent_banking_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID UNIQUE NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- ACH Details (encrypted at rest by Supabase)
  bank_name TEXT,
  account_holder_name TEXT,
  account_type bank_account_type DEFAULT 'checking',
  routing_number TEXT,  -- 9 digits
  account_number_last4 TEXT,  -- Only store last 4 for display
  account_number_encrypted TEXT,  -- Full number encrypted

  -- Verification
  verification_status bank_account_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,

  -- Check/Wire mailing address
  mailing_address_line1 TEXT,
  mailing_address_line2 TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
  mailing_country TEXT DEFAULT 'US',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banking_agent ON agent_banking_info(agent_id);

-- ============================================
-- WITHDRAWAL LIMITS & SECURITY
-- ============================================
CREATE TABLE withdrawal_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: NULL means default for all agents
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  rank agent_rank,  -- NULL means all ranks

  -- Limits
  daily_limit DECIMAL(12,2) DEFAULT 2500,
  weekly_limit DECIMAL(12,2) DEFAULT 10000,
  monthly_limit DECIMAL(12,2) DEFAULT 50000,
  per_transaction_limit DECIMAL(12,2) DEFAULT 5000,
  min_account_age_days INTEGER DEFAULT 7,  -- Must be member for X days
  first_withdrawal_hold_hours INTEGER DEFAULT 48,  -- Hold period for first withdrawal

  -- Rate limiting
  max_withdrawals_per_day INTEGER DEFAULT 3,
  max_withdrawals_per_week INTEGER DEFAULT 10,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one default rule (agent_id = NULL)
  UNIQUE NULLS NOT DISTINCT (agent_id)
);

-- Insert default limits
INSERT INTO withdrawal_limits (
  agent_id, rank,
  daily_limit, weekly_limit, monthly_limit, per_transaction_limit,
  min_account_age_days, first_withdrawal_hold_hours,
  max_withdrawals_per_day, max_withdrawals_per_week
) VALUES (
  NULL, NULL,  -- Default for all
  2500, 10000, 50000, 5000,
  7, 48,
  3, 10
);

-- ============================================
-- ENHANCED PAYOUTS TABLE
-- ============================================
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES agents(id);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS wire_reference TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS ach_trace_number TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Add 'rejected' and 'processing' to payout_status if not exists
-- Note: ALTER TYPE doesn't support IF NOT EXISTS, so we check first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = 'payout_status'::regtype) THEN
    ALTER TYPE payout_status ADD VALUE 'rejected';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'processing' AND enumtypid = 'payout_status'::regtype) THEN
    ALTER TYPE payout_status ADD VALUE 'processing';
  END IF;
END$$;

-- ============================================
-- WITHDRAWAL AUDIT LOG
-- ============================================
CREATE TABLE withdrawal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES agents(id),
  action TEXT NOT NULL,  -- 'requested', 'approved', 'rejected', 'processed', 'cancelled'
  previous_status payout_status,
  new_status payout_status,
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_audit_payout ON withdrawal_audit_log(payout_id);
CREATE INDEX idx_withdrawal_audit_agent ON withdrawal_audit_log(agent_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Banking Info: Agents can only see their own
ALTER TABLE agent_banking_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY banking_select_own ON agent_banking_info
  FOR SELECT USING (
    agent_id = get_current_agent_id()
    OR is_admin()
  );

CREATE POLICY banking_insert_own ON agent_banking_info
  FOR INSERT WITH CHECK (
    agent_id = get_current_agent_id()
  );

CREATE POLICY banking_update_own ON agent_banking_info
  FOR UPDATE USING (
    agent_id = get_current_agent_id()
  );

-- Withdrawal Limits: Read-only for all, admin can modify
ALTER TABLE withdrawal_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY limits_select_all ON withdrawal_limits
  FOR SELECT USING (true);

CREATE POLICY limits_admin_all ON withdrawal_limits
  FOR ALL USING (is_admin());

-- Withdrawal Audit: Agents see their own, admin sees all
ALTER TABLE withdrawal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select_own ON withdrawal_audit_log
  FOR SELECT USING (
    agent_id = get_current_agent_id()
    OR is_admin()
  );

CREATE POLICY audit_insert_admin ON withdrawal_audit_log
  FOR INSERT WITH CHECK (is_admin() OR agent_id = get_current_agent_id());

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_banking_info_updated_at
  BEFORE UPDATE ON agent_banking_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_withdrawal_limits_updated_at
  BEFORE UPDATE ON withdrawal_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get agent's withdrawal stats for limit checking
CREATE OR REPLACE FUNCTION get_agent_withdrawal_stats(p_agent_id UUID)
RETURNS TABLE (
  today_total DECIMAL,
  today_count INTEGER,
  week_total DECIMAL,
  week_count INTEGER,
  month_total DECIMAL,
  first_withdrawal_at TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN p.created_at >= CURRENT_DATE THEN p.amount ELSE 0 END), 0) as today_total,
    COUNT(CASE WHEN p.created_at >= CURRENT_DATE THEN 1 END)::INTEGER as today_count,
    COALESCE(SUM(CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN p.amount ELSE 0 END), 0) as week_total,
    COUNT(CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::INTEGER as week_count,
    COALESCE(SUM(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as month_total,
    MIN(p.created_at) as first_withdrawal_at,
    a.created_at as account_created_at
  FROM agents a
  LEFT JOIN payouts p ON p.agent_id = a.id AND p.status NOT IN ('rejected', 'cancelled')
  WHERE a.id = p_agent_id
  GROUP BY a.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
