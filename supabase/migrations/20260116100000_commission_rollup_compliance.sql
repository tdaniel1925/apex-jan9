-- ============================================
-- Commission Roll-Up & License Compliance Migration
-- Date: January 16, 2026
-- Purpose: Add license compliance tracking for commission roll-up
--
-- This migration:
-- 1. Adds license status fields to agents table
-- 2. Creates license_history audit table
-- 3. Creates compliance_logs table
-- 4. Creates compensation_plan_configs table
-- 5. Extends overrides table for roll-up tracking
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- License status enum
CREATE TYPE license_status AS ENUM (
  'licensed',     -- Valid, active license
  'unlicensed',   -- Never licensed or not applied
  'pending',      -- Application submitted, awaiting approval
  'expired',      -- License past expiration date
  'suspended'     -- License suspended by regulatory authority
);

-- Compliance event types
CREATE TYPE compliance_event_type AS ENUM (
  'unlicensed_override_prevented',  -- Override blocked due to unlicensed status
  'commission_rolled_up',           -- Override rolled up to next licensed upline
  'commission_forfeited',           -- Override forfeited to company
  'license_status_change',          -- Agent license status changed
  'compliance_review_required'      -- Manual review flagged
);

-- Roll-up reason types
CREATE TYPE roll_up_reason AS ENUM (
  'upline_unlicensed',        -- Upline has never been licensed
  'upline_license_expired',   -- Upline license has expired
  'upline_license_suspended', -- Upline license is suspended
  'company_policy'            -- Company policy retention
);

-- Unlicensed override handling options
CREATE TYPE unlicensed_override_handling AS ENUM (
  'roll_up_to_next_licensed',  -- Pass to next licensed upline
  'company_retains'            -- Company keeps the override
);

-- ============================================
-- EXTEND AGENTS TABLE
-- ============================================

-- Add license compliance fields to existing agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_status license_status DEFAULT 'unlicensed';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_state CHAR(2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_expiration_date DATE;

-- Add index for license status queries
CREATE INDEX IF NOT EXISTS idx_agents_license_status ON agents(license_status);
CREATE INDEX IF NOT EXISTS idx_agents_license_expiration ON agents(license_expiration_date);

-- ============================================
-- LICENSE HISTORY (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS license_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Status change
  previous_status license_status,
  new_status license_status NOT NULL,

  -- License details at time of change
  license_number TEXT,
  license_state CHAR(2),
  effective_date DATE,
  expiration_date DATE,

  -- Audit info
  change_reason TEXT,
  changed_by TEXT,  -- User ID or 'system' for automated changes
  source TEXT DEFAULT 'manual',  -- 'manual', 'smartoffice_sync', 'expiration_check'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_license_history_agent ON license_history(agent_id);
CREATE INDEX idx_license_history_created ON license_history(created_at);

-- ============================================
-- COMPLIANCE LOGS (Immutable Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agent involved
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Event classification
  event_type compliance_event_type NOT NULL,

  -- Related records (optional)
  policy_id UUID,  -- Reference to commission if applicable
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  override_id UUID REFERENCES overrides(id) ON DELETE SET NULL,

  -- Event details
  description TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  regulatory_reference TEXT NOT NULL,  -- Citation to applicable law

  -- Roll-up specific fields
  original_amount DECIMAL(12,2),
  rolled_up_to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- Metadata
  triggered_by TEXT,  -- 'system', user ID, or 'smartoffice_sync'
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for compliance queries
CREATE INDEX idx_compliance_logs_agent ON compliance_logs(agent_id);
CREATE INDEX idx_compliance_logs_event_type ON compliance_logs(event_type);
CREATE INDEX idx_compliance_logs_created ON compliance_logs(created_at);
CREATE INDEX idx_compliance_logs_commission ON compliance_logs(commission_id);

-- IMPORTANT: Compliance logs are IMMUTABLE
-- No UPDATE or DELETE policies will be created
-- This is required for regulatory examination

-- ============================================
-- COMPENSATION PLAN CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS compensation_plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan identification
  name TEXT NOT NULL DEFAULT 'Default Plan',
  description TEXT,

  -- Effective dates
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,

  -- CRITICAL: How to handle unlicensed upline overrides
  unlicensed_override_handling unlicensed_override_handling NOT NULL DEFAULT 'roll_up_to_next_licensed',

  -- Override configuration
  max_generation_levels INTEGER NOT NULL DEFAULT 6,  -- Direct overrides
  max_rollup_generations INTEGER NOT NULL DEFAULT 7,  -- Roll-up search depth

  -- Chargeback policy
  chargeback_period_months INTEGER NOT NULL DEFAULT 12,

  -- Payment settings
  minimum_payout_threshold DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',  -- 'weekly', 'biweekly', 'monthly'

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one active plan at a time
CREATE UNIQUE INDEX idx_compensation_plan_active ON compensation_plan_configs(is_active) WHERE is_active = true;

-- Insert default compensation plan
INSERT INTO compensation_plan_configs (
  name,
  description,
  unlicensed_override_handling,
  max_generation_levels,
  max_rollup_generations,
  chargeback_period_months,
  minimum_payout_threshold,
  payment_frequency,
  is_active
) VALUES (
  'Apex Standard Plan',
  'Default compensation plan with roll-up to next licensed upline',
  'roll_up_to_next_licensed',
  6,
  7,
  12,
  25.00,
  'monthly',
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- EXTEND OVERRIDES TABLE FOR ROLL-UP TRACKING
-- ============================================

-- Add roll-up tracking fields to existing overrides table
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS is_rolled_up BOOLEAN DEFAULT false;
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS roll_up_reason roll_up_reason;
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS original_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS rolled_up_from_generation INTEGER;
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS compliance_log_id UUID REFERENCES compliance_logs(id) ON DELETE SET NULL;
ALTER TABLE overrides ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for roll-up queries
CREATE INDEX IF NOT EXISTS idx_overrides_rolled_up ON overrides(is_rolled_up) WHERE is_rolled_up = true;
CREATE INDEX IF NOT EXISTS idx_overrides_original_agent ON overrides(original_agent_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if an agent is licensed (for commission eligibility)
CREATE OR REPLACE FUNCTION is_agent_licensed(p_agent_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_agent RECORD;
BEGIN
  SELECT license_status, license_number, license_expiration_date
  INTO v_agent
  FROM agents
  WHERE id = p_agent_id;

  -- Must have 'licensed' status
  IF v_agent.license_status IS NULL OR v_agent.license_status != 'licensed' THEN
    RETURN false;
  END IF;

  -- Must have a license number
  IF v_agent.license_number IS NULL OR v_agent.license_number = '' THEN
    RETURN false;
  END IF;

  -- License must not be expired
  IF v_agent.license_expiration_date IS NOT NULL AND v_agent.license_expiration_date < CURRENT_DATE THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Function to get next licensed upline
CREATE OR REPLACE FUNCTION get_next_licensed_upline(p_agent_id UUID, p_max_generations INTEGER DEFAULT 7)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  generation_level INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_current_id UUID;
  v_generation INTEGER := 0;
  v_visited UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Start with the agent's sponsor
  SELECT sponsor_id INTO v_current_id
  FROM agents
  WHERE id = p_agent_id;

  WHILE v_current_id IS NOT NULL AND v_generation < p_max_generations LOOP
    v_generation := v_generation + 1;

    -- Prevent infinite loops
    IF v_current_id = ANY(v_visited) THEN
      EXIT;
    END IF;
    v_visited := v_visited || v_current_id;

    -- Check if this agent is licensed
    IF is_agent_licensed(v_current_id) THEN
      RETURN QUERY
      SELECT
        a.id,
        a.first_name || ' ' || a.last_name,
        v_generation
      FROM agents a
      WHERE a.id = v_current_id;
      RETURN;
    END IF;

    -- Move to next upline
    SELECT sponsor_id INTO v_current_id
    FROM agents
    WHERE id = v_current_id;
  END LOOP;

  -- No licensed upline found
  RETURN;
END;
$$;

-- Function to log license status change (creates history record)
CREATE OR REPLACE FUNCTION log_license_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if license_status actually changed
  IF OLD.license_status IS DISTINCT FROM NEW.license_status THEN
    INSERT INTO license_history (
      agent_id,
      previous_status,
      new_status,
      license_number,
      license_state,
      effective_date,
      expiration_date,
      change_reason,
      changed_by,
      source
    ) VALUES (
      NEW.id,
      OLD.license_status,
      NEW.license_status,
      NEW.license_number,
      NEW.license_state,
      NEW.licensed_date,
      NEW.license_expiration_date,
      'License status updated',
      current_setting('app.current_user_id', true),
      COALESCE(current_setting('app.change_source', true), 'manual')
    );

    -- Also create compliance log for status changes
    INSERT INTO compliance_logs (
      agent_id,
      event_type,
      description,
      action_taken,
      regulatory_reference,
      triggered_by
    ) VALUES (
      NEW.id,
      'license_status_change',
      'License status changed from ' || COALESCE(OLD.license_status::TEXT, 'null') || ' to ' || NEW.license_status::TEXT,
      'Status change recorded in license_history',
      'Internal audit requirement',
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for license status changes
DROP TRIGGER IF EXISTS trigger_log_license_status_change ON agents;
CREATE TRIGGER trigger_log_license_status_change
  AFTER UPDATE OF license_status ON agents
  FOR EACH ROW
  EXECUTE FUNCTION log_license_status_change();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- License History RLS
ALTER TABLE license_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin APIs use service role)
CREATE POLICY "Service role full access on license_history"
  ON license_history FOR ALL
  TO service_role
  USING (true);

-- Agents can view their own license history
CREATE POLICY "Agents can view own license history"
  ON license_history FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Compliance Logs RLS (Admin-only via service role)
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin APIs use service role)
CREATE POLICY "Service role full access on compliance_logs"
  ON compliance_logs FOR ALL
  TO service_role
  USING (true);

-- NO authenticated access to compliance_logs (admin APIs only)
-- NO UPDATE OR DELETE policies for compliance_logs (immutable)

-- Compensation Plan Config RLS
ALTER TABLE compensation_plan_configs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on compensation_plan_configs"
  ON compensation_plan_configs FOR ALL
  TO service_role
  USING (true);

-- Authenticated users can read active plan (for display purposes)
CREATE POLICY "Authenticated can read active compensation plan"
  ON compensation_plan_configs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE license_history IS 'Audit trail of all license status changes for regulatory compliance';
COMMENT ON TABLE compliance_logs IS 'Immutable audit log for commission compliance events - NO UPDATES OR DELETES';
COMMENT ON TABLE compensation_plan_configs IS 'Configuration for compensation plan including unlicensed override handling';

COMMENT ON COLUMN agents.license_status IS 'Current license status - synced from SmartOffice';
COMMENT ON COLUMN agents.license_number IS 'State-issued insurance license number';
COMMENT ON COLUMN agents.license_state IS 'Two-letter state code for license jurisdiction';
COMMENT ON COLUMN agents.license_expiration_date IS 'License expiration date for proactive compliance checks';

COMMENT ON COLUMN overrides.is_rolled_up IS 'Whether this override includes rolled-up amount from unlicensed upline';
COMMENT ON COLUMN overrides.roll_up_reason IS 'Reason for roll-up if is_rolled_up is true';
COMMENT ON COLUMN overrides.original_agent_id IS 'The unlicensed agent whose override was rolled up';
COMMENT ON COLUMN overrides.rolled_up_from_generation IS 'Original generation level before roll-up';

COMMENT ON FUNCTION is_agent_licensed IS 'Check if agent is eligible to receive commissions based on license status';
COMMENT ON FUNCTION get_next_licensed_upline IS 'Find the next licensed agent in upline hierarchy for roll-up';
