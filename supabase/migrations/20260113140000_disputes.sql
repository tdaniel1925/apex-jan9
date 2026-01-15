-- Dispute/Appeal Workflow
-- Allows agents to dispute commissions, clawbacks, and other issues

-- ============================================
-- DISPUTE TYPE ENUM
-- ============================================
CREATE TYPE dispute_type AS ENUM (
  'commission',      -- Dispute about commission amount
  'clawback',        -- Dispute about a clawback
  'bonus',           -- Dispute about bonus calculation
  'override',        -- Dispute about override payment
  'rank',            -- Dispute about rank calculation
  'policy',          -- Dispute about policy credit
  'other'            -- Other types of disputes
);

-- ============================================
-- DISPUTE STATUS ENUM
-- ============================================
CREATE TYPE dispute_status AS ENUM (
  'pending',         -- Submitted, awaiting review
  'under_review',    -- Being investigated
  'info_requested',  -- Waiting for more information from agent
  'approved',        -- Dispute approved, action taken
  'denied',          -- Dispute denied
  'withdrawn'        -- Agent withdrew the dispute
);

-- ============================================
-- DISPUTES TABLE
-- ============================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Dispute details
  dispute_type dispute_type NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Related records (optional)
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  clawback_id UUID,  -- No FK constraint - clawbacks table may not exist yet
  bonus_id UUID REFERENCES bonuses(id) ON DELETE SET NULL,

  -- Status
  status dispute_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',  -- low, normal, high, urgent

  -- Supporting documents
  attachments JSONB DEFAULT '[]',  -- Array of {name, url, type, size}

  -- Financial impact
  amount_disputed DECIMAL(10,2),
  amount_adjusted DECIMAL(10,2),

  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISPUTE COMMENTS TABLE
-- ============================================
CREATE TABLE dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

  -- Author (either agent or admin)
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Content
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,  -- Internal admin notes (hidden from agent)
  attachments JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISPUTE HISTORY TABLE
-- ============================================
CREATE TABLE dispute_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

  -- Change details
  action TEXT NOT NULL,  -- status_changed, assigned, note_added, etc.
  old_value TEXT,
  new_value TEXT,
  notes TEXT,

  -- Actor
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_disputes_agent ON disputes(agent_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_type ON disputes(dispute_type);
CREATE INDEX idx_disputes_created ON disputes(created_at);
CREATE INDEX idx_dispute_comments_dispute ON dispute_comments(dispute_id);
CREATE INDEX idx_dispute_history_dispute ON dispute_history(dispute_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_history ENABLE ROW LEVEL SECURITY;

-- Agents can view their own disputes
CREATE POLICY "Agents can view own disputes"
  ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = disputes.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Agents can create disputes
CREATE POLICY "Agents can create disputes"
  ON disputes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Agents can view comments on their disputes (non-internal only)
CREATE POLICY "Agents can view non-internal comments"
  ON dispute_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM disputes
      JOIN agents ON agents.id = disputes.agent_id
      WHERE disputes.id = dispute_comments.dispute_id
      AND agents.user_id = auth.uid()
    )
    AND is_internal = false
  );

-- Agents can add comments to their disputes
CREATE POLICY "Agents can add comments to own disputes"
  ON dispute_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM disputes
      JOIN agents ON agents.id = disputes.agent_id
      WHERE disputes.id = dispute_comments.dispute_id
      AND agents.user_id = auth.uid()
    )
    AND admin_id IS NULL
    AND is_internal = false
  );

-- Agents can view history on their disputes
CREATE POLICY "Agents can view history on own disputes"
  ON dispute_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM disputes
      JOIN agents ON agents.id = disputes.agent_id
      WHERE disputes.id = dispute_history.dispute_id
      AND agents.user_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE disputes IS 'Agent disputes for commissions, clawbacks, and other issues';
COMMENT ON TABLE dispute_comments IS 'Comments and communication on disputes';
COMMENT ON TABLE dispute_history IS 'Audit trail for dispute status changes';
