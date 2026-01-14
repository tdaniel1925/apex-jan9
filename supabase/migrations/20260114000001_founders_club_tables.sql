-- Founders Club - Part 2: Tables and Policies
-- Run AFTER 20260114000000_founders_club_enum.sql has been committed

-- ============================================
-- UPDATE MATRIX POSITIONS CONSTRAINT
-- ============================================

-- Drop the existing check constraint on position to allow position 0 for root
ALTER TABLE matrix_positions DROP CONSTRAINT IF EXISTS matrix_positions_position_check;

-- Add new constraint that allows position 0 only for level 0 (root)
ALTER TABLE matrix_positions ADD CONSTRAINT matrix_positions_position_check
  CHECK (
    (level = 0 AND position = 0) OR
    (level > 0 AND position >= 1 AND position <= 5)
  );

-- ============================================
-- FOUNDER PARTNERS TABLE
-- ============================================

-- Table to track the 4 partners who share override commissions from FC Inc.
CREATE TABLE IF NOT EXISTS founder_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner information
  name TEXT,  -- Can be null for unfilled slots
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- Position slot (1-4)
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 4),

  -- Revenue share (equal split = 25% each)
  share_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,  -- false = empty slot

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(slot_number)
);

CREATE INDEX IF NOT EXISTS idx_founder_partners_user ON founder_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_partners_agent ON founder_partners(agent_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS founder_partners_updated_at ON founder_partners;
CREATE TRIGGER founder_partners_updated_at BEFORE UPDATE ON founder_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FOUNDER OVERRIDE TRACKING TABLE
-- ============================================

-- Track total override commissions that flow to FC Inc.
-- This is aggregated for reporting - actual distribution is manual
CREATE TABLE IF NOT EXISTS founder_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to original commission
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,

  -- The agent whose commission generated this override
  source_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Override amount that flows to founders
  override_amount DECIMAL(12,2) NOT NULL,

  -- Status tracking
  status commission_status NOT NULL DEFAULT 'pending',

  -- Period tracking for reporting
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_overrides_commission ON founder_overrides(commission_id);
CREATE INDEX IF NOT EXISTS idx_founder_overrides_source ON founder_overrides(source_agent_id);
CREATE INDEX IF NOT EXISTS idx_founder_overrides_period ON founder_overrides(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_founder_overrides_status ON founder_overrides(status);

-- ============================================
-- INSERT EMPTY PARTNER SLOTS
-- ============================================

-- Create 4 empty partner slots
INSERT INTO founder_partners (slot_number, share_percentage, is_active)
VALUES
  (1, 25.00, false),
  (2, 25.00, false),
  (3, 25.00, false),
  (4, 25.00, false)
ON CONFLICT (slot_number) DO NOTHING;

-- ============================================
-- FOUNDER TOTALS VIEW
-- ============================================

-- View to show total founder overrides by period
CREATE OR REPLACE VIEW founder_override_totals AS
SELECT
  period_year,
  period_month,
  status,
  COUNT(*) as override_count,
  SUM(override_amount) as total_amount
FROM founder_overrides
GROUP BY period_year, period_month, status;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE founder_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_overrides ENABLE ROW LEVEL SECURITY;

-- Founder partners - founders and partners can view
CREATE POLICY founder_partners_select ON founder_partners
  FOR SELECT
  TO authenticated
  USING (
    -- Partners can see their own record
    user_id = auth.uid()
    OR
    -- Founder rank agents can see all partners
    EXISTS (
      SELECT 1 FROM agents
      WHERE user_id = auth.uid() AND rank = 'founder'
    )
  );

-- Founder partners - service role can manage (for admin API routes)
CREATE POLICY founder_partners_service ON founder_partners
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Founder overrides - founders can view
CREATE POLICY founder_overrides_select ON founder_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE user_id = auth.uid() AND rank = 'founder'
    )
  );

-- Founder overrides - service role can manage (for commission workflows)
CREATE POLICY founder_overrides_service ON founder_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Get Founder Override Total
-- ============================================

CREATE OR REPLACE FUNCTION get_founder_override_total(
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_status commission_status DEFAULT NULL
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_total DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(override_amount), 0)
  INTO v_total
  FROM founder_overrides
  WHERE
    (p_year IS NULL OR period_year = p_year)
    AND (p_month IS NULL OR period_month = p_month)
    AND (p_status IS NULL OR status = p_status);

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
