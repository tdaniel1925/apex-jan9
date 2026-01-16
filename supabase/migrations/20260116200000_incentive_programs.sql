-- ============================================
-- INCENTIVE PROGRAMS MODULE
-- APEX Drive (Car Bonus), APEX Ignition (Fast Start), Elite 10
-- ============================================

-- ============================================
-- INCENTIVE PROGRAM SETTINGS (Admin Toggles)
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key VARCHAR(50) UNIQUE NOT NULL, -- car_bonus, fast_start, elite_10
  program_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Additional program-specific settings
  updated_by UUID REFERENCES agents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default program settings
INSERT INTO incentive_program_settings (program_key, program_name, is_enabled, settings) VALUES
  ('car_bonus', 'APEX Drive (Car Bonus)', true, '{"description": "Monthly car allowance based on premium volume"}'),
  ('fast_start', 'APEX Ignition (Fast Start)', true, '{"description": "Milestone bonuses for new agents in first 90 days"}'),
  ('elite_10', 'Elite 10 Recognition', true, '{"description": "Quarterly top performer recognition program"}')
ON CONFLICT (program_key) DO NOTHING;

-- ============================================
-- CAR BONUS TABLES
-- ============================================

-- Car bonus tier definitions
CREATE TABLE IF NOT EXISTS incentive_car_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL, -- Silver, Gold, Platinum, Elite
  min_monthly_premium DECIMAL(12,2) NOT NULL,
  max_monthly_premium DECIMAL(12,2), -- NULL for Elite (no cap)
  monthly_bonus_amount DECIMAL(10,2) NOT NULL,
  consecutive_months_required INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default car bonus tiers
INSERT INTO incentive_car_bonus_tiers (tier_name, min_monthly_premium, max_monthly_premium, monthly_bonus_amount, sort_order) VALUES
  ('Silver', 15000.00, 24999.99, 300.00, 1),
  ('Gold', 25000.00, 39999.99, 500.00, 2),
  ('Platinum', 40000.00, 59999.99, 800.00, 3),
  ('Elite', 60000.00, NULL, 1200.00, 4)
ON CONFLICT DO NOTHING;

-- Agent car bonus tracking by month
CREATE TABLE IF NOT EXISTS incentive_car_bonus_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First of month (e.g., 2026-01-01)
  placed_premium DECIMAL(12,2) NOT NULL DEFAULT 0,
  qualified_tier_id UUID REFERENCES incentive_car_bonus_tiers(id),
  consecutive_months INT DEFAULT 0,
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  quality_gate_passed BOOLEAN DEFAULT false,
  placement_ratio DECIMAL(5,2),
  persistency_ratio DECIMAL(5,2),
  has_chargebacks BOOLEAN DEFAULT false,
  warning_issued BOOLEAN DEFAULT false, -- First missed month warning
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, submitted, paid
  payout_date DATE,
  smartoffice_submission_id VARCHAR(100), -- Reference to SmartOffice submission
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, month_year)
);

CREATE INDEX idx_car_bonus_tracking_agent ON incentive_car_bonus_tracking(agent_id);
CREATE INDEX idx_car_bonus_tracking_month ON incentive_car_bonus_tracking(month_year);
CREATE INDEX idx_car_bonus_tracking_status ON incentive_car_bonus_tracking(payout_status);

-- ============================================
-- FAST START TABLES
-- ============================================

-- Fast start milestone definitions
CREATE TABLE IF NOT EXISTS incentive_fast_start_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name VARCHAR(100) NOT NULL,
  milestone_type VARCHAR(20) NOT NULL, -- first_policy, premium_threshold
  premium_threshold DECIMAL(12,2), -- NULL for first_policy type
  days_limit INT NOT NULL, -- Days from start date to achieve
  bonus_amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default fast start milestones
INSERT INTO incentive_fast_start_milestones (milestone_name, milestone_type, premium_threshold, days_limit, bonus_amount, sort_order) VALUES
  ('First Policy Placed', 'first_policy', NULL, 30, 100.00, 1),
  ('$5,000 Premium', 'premium_threshold', 5000.00, 45, 150.00, 2),
  ('$10,000 Premium', 'premium_threshold', 10000.00, 60, 250.00, 3),
  ('$25,000 Premium', 'premium_threshold', 25000.00, 90, 500.00, 4)
ON CONFLICT DO NOTHING;

-- Agent fast start tracking
CREATE TABLE IF NOT EXISTS incentive_fast_start_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  start_date DATE NOT NULL, -- Agent's contracting/start date
  end_date DATE NOT NULL, -- start_date + 90 days
  milestone_id UUID NOT NULL REFERENCES incentive_fast_start_milestones(id),
  achieved_date DATE, -- NULL if not yet achieved
  current_premium DECIMAL(12,2) DEFAULT 0, -- Premium at time of achievement
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, submitted, paid
  payout_date DATE,
  smartoffice_submission_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, milestone_id)
);

CREATE INDEX idx_fast_start_tracking_agent ON incentive_fast_start_tracking(agent_id);
CREATE INDEX idx_fast_start_tracking_status ON incentive_fast_start_tracking(payout_status);

-- Recruiter match bonuses (25% of recruit's fast start bonus)
CREATE TABLE IF NOT EXISTS incentive_fast_start_recruiter_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  new_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  fast_start_tracking_id UUID NOT NULL REFERENCES incentive_fast_start_tracking(id) ON DELETE CASCADE,
  match_percentage DECIMAL(5,2) DEFAULT 25.00,
  match_bonus_earned DECIMAL(10,2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, submitted, paid
  payout_date DATE,
  smartoffice_submission_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recruiter_match_recruiter ON incentive_fast_start_recruiter_match(recruiter_agent_id);
CREATE INDEX idx_recruiter_match_new_agent ON incentive_fast_start_recruiter_match(new_agent_id);

-- ============================================
-- ELITE 10 TABLES
-- ============================================

-- Elite 10 quarterly periods
CREATE TABLE IF NOT EXISTS incentive_elite_10_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name VARCHAR(50) NOT NULL, -- Q1 2026, Q2 2026, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  selection_date DATE, -- When Elite 10 are selected (after quarter ends)
  is_active BOOLEAN DEFAULT false, -- Only one active period at a time
  is_finalized BOOLEAN DEFAULT false, -- True after selections are made
  min_placement_ratio DECIMAL(5,2) DEFAULT 60.00,
  min_persistency_ratio DECIMAL(5,2) DEFAULT 80.00,
  quarterly_bonus_amount DECIMAL(10,2) DEFAULT 500.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_elite_10_periods_active ON incentive_elite_10_periods(is_active);
CREATE INDEX idx_elite_10_periods_dates ON incentive_elite_10_periods(start_date, end_date);

-- Elite 10 members for each period
CREATE TABLE IF NOT EXISTS incentive_elite_10_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES incentive_elite_10_periods(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  rank_position INT NOT NULL CHECK (rank_position BETWEEN 1 AND 10),

  -- Scoring breakdown
  total_score DECIMAL(10,4) NOT NULL,
  premium_score DECIMAL(10,4), -- 40% weight
  policy_count_score DECIMAL(10,4), -- 20% weight
  close_ratio_score DECIMAL(10,4), -- 20% weight
  quality_score DECIMAL(10,4), -- 20% weight

  -- Raw metrics
  total_premium DECIMAL(12,2),
  policy_count INT,
  close_ratio DECIMAL(5,2),
  placement_ratio DECIMAL(5,2),
  persistency_ratio DECIMAL(5,2),

  -- Bonus
  quarterly_bonus DECIMAL(10,2) DEFAULT 500.00,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, submitted, paid
  payout_date DATE,
  smartoffice_submission_id VARCHAR(100),

  -- Profile for display
  bio TEXT,
  specialties TEXT[], -- Array of specialties
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  profile_photo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_id, agent_id),
  UNIQUE(period_id, rank_position)
);

CREATE INDEX idx_elite_10_members_period ON incentive_elite_10_members(period_id);
CREATE INDEX idx_elite_10_members_agent ON incentive_elite_10_members(agent_id);

-- Elite 10 assist requests and completions
CREATE TABLE IF NOT EXISTS incentive_elite_10_assists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elite_member_id UUID NOT NULL REFERENCES incentive_elite_10_members(id) ON DELETE CASCADE,
  assisted_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  policy_id UUID, -- Reference to policy (no FK - policies table may not exist)

  -- Request details
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_notes TEXT,
  prospect_name VARCHAR(200),
  prospect_phone VARCHAR(20),
  prospect_email VARCHAR(255),

  -- Assist tracking
  accept_date TIMESTAMPTZ,
  assist_date TIMESTAMPTZ,
  close_date TIMESTAMPTZ,
  decline_date TIMESTAMPTZ,
  decline_reason TEXT,

  -- Policy/bonus details (filled when closed)
  policy_premium DECIMAL(12,2),
  assist_bonus DECIMAL(10,2), -- $50-$100 flat
  override_percentage DECIMAL(5,2) DEFAULT 1.00,
  override_bonus DECIMAL(10,2),
  total_bonus DECIMAL(10,2),

  status VARCHAR(20) DEFAULT 'requested', -- requested, accepted, in_progress, closed, declined, expired
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, submitted, paid
  payout_date DATE,
  smartoffice_submission_id VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_elite_10_assists_member ON incentive_elite_10_assists(elite_member_id);
CREATE INDEX idx_elite_10_assists_agent ON incentive_elite_10_assists(assisted_agent_id);
CREATE INDEX idx_elite_10_assists_status ON incentive_elite_10_assists(status);

-- Elite 10 Hall of Fame (4+ quarters)
CREATE TABLE IF NOT EXISTS incentive_elite_10_hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  total_quarters INT DEFAULT 0,
  first_selection_date DATE,
  last_selection_date DATE,
  inducted_date DATE, -- When they hit 4 quarters
  is_active BOOLEAN DEFAULT true,
  achievements TEXT[], -- Special achievements/notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);

CREATE INDEX idx_hall_of_fame_agent ON incentive_elite_10_hall_of_fame(agent_id);
CREATE INDEX idx_hall_of_fame_inducted ON incentive_elite_10_hall_of_fame(inducted_date);

-- ============================================
-- INCENTIVE PAYOUT SUBMISSIONS (To SmartOffice)
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_payout_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submission_type VARCHAR(50) NOT NULL, -- car_bonus, fast_start, elite_10_quarterly, elite_10_assist
  period_reference VARCHAR(50), -- e.g., "2026-01" for monthly, "Q1 2026" for quarterly

  total_payouts INT DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,

  status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, confirmed, failed
  smartoffice_batch_id VARCHAR(100),
  smartoffice_response JSONB,

  submitted_by UUID REFERENCES agents(id),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payout_submissions_date ON incentive_payout_submissions(submission_date);
CREATE INDEX idx_payout_submissions_type ON incentive_payout_submissions(submission_type);
CREATE INDEX idx_payout_submissions_status ON incentive_payout_submissions(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if a program is enabled
CREATE OR REPLACE FUNCTION is_incentive_program_enabled(p_program_key VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT is_enabled INTO v_enabled
  FROM incentive_program_settings
  WHERE program_key = p_program_key;

  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get current Elite 10 period
CREATE OR REPLACE FUNCTION get_current_elite_10_period()
RETURNS UUID AS $$
DECLARE
  v_period_id UUID;
BEGIN
  SELECT id INTO v_period_id
  FROM incentive_elite_10_periods
  WHERE is_active = true
  LIMIT 1;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if agent is in fast start period
CREATE OR REPLACE FUNCTION is_agent_in_fast_start(p_agent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Get agent's created_at date (contracting date)
  SELECT DATE(created_at) INTO v_start_date
  FROM agents
  WHERE id = p_agent_id;

  -- Check if within 90 days
  RETURN (CURRENT_DATE - v_start_date) <= 90;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all incentive tables
ALTER TABLE incentive_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_car_bonus_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_car_bonus_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_fast_start_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_fast_start_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_fast_start_recruiter_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_elite_10_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_elite_10_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_elite_10_assists ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_elite_10_hall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_payout_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for tier/milestone definitions
CREATE POLICY "Anyone can read car bonus tiers"
  ON incentive_car_bonus_tiers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read fast start milestones"
  ON incentive_fast_start_milestones FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read elite 10 periods"
  ON incentive_elite_10_periods FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read program settings"
  ON incentive_program_settings FOR SELECT
  USING (true);

-- Agents can read their own tracking data
CREATE POLICY "Agents can read own car bonus tracking"
  ON incentive_car_bonus_tracking FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can read own fast start tracking"
  ON incentive_fast_start_tracking FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Recruiters can read their match bonuses"
  ON incentive_fast_start_recruiter_match FOR SELECT
  USING (recruiter_agent_id = auth.uid() OR new_agent_id = auth.uid());

-- Elite 10 members are public (for visibility)
CREATE POLICY "Anyone can read elite 10 members"
  ON incentive_elite_10_members FOR SELECT
  USING (true);

-- Agents can read assists they're involved in
CREATE POLICY "Agents can read their assists"
  ON incentive_elite_10_assists FOR SELECT
  USING (
    assisted_agent_id = auth.uid() OR
    elite_member_id IN (SELECT id FROM incentive_elite_10_members WHERE agent_id = auth.uid())
  );

-- Hall of Fame is public
CREATE POLICY "Anyone can read hall of fame"
  ON incentive_elite_10_hall_of_fame FOR SELECT
  USING (true);

-- Service role has full access for admin operations
CREATE POLICY "Service role full access to program settings"
  ON incentive_program_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to car bonus tiers"
  ON incentive_car_bonus_tiers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to car bonus tracking"
  ON incentive_car_bonus_tracking FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to fast start milestones"
  ON incentive_fast_start_milestones FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to fast start tracking"
  ON incentive_fast_start_tracking FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to recruiter match"
  ON incentive_fast_start_recruiter_match FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to elite 10 periods"
  ON incentive_elite_10_periods FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to elite 10 members"
  ON incentive_elite_10_members FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to elite 10 assists"
  ON incentive_elite_10_assists FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to hall of fame"
  ON incentive_elite_10_hall_of_fame FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to payout submissions"
  ON incentive_payout_submissions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incentive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_program_settings_timestamp
  BEFORE UPDATE ON incentive_program_settings
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_car_bonus_tiers_timestamp
  BEFORE UPDATE ON incentive_car_bonus_tiers
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_car_bonus_tracking_timestamp
  BEFORE UPDATE ON incentive_car_bonus_tracking
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_fast_start_milestones_timestamp
  BEFORE UPDATE ON incentive_fast_start_milestones
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_fast_start_tracking_timestamp
  BEFORE UPDATE ON incentive_fast_start_tracking
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_elite_10_periods_timestamp
  BEFORE UPDATE ON incentive_elite_10_periods
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_elite_10_members_timestamp
  BEFORE UPDATE ON incentive_elite_10_members
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

CREATE TRIGGER update_hall_of_fame_timestamp
  BEFORE UPDATE ON incentive_elite_10_hall_of_fame
  FOR EACH ROW EXECUTE FUNCTION update_incentive_updated_at();

-- ============================================
-- SEED FIRST ELITE 10 PERIOD (Q1 2026)
-- ============================================
INSERT INTO incentive_elite_10_periods (period_name, start_date, end_date, is_active) VALUES
  ('Q1 2026', '2026-01-01', '2026-03-31', true)
ON CONFLICT DO NOTHING;
