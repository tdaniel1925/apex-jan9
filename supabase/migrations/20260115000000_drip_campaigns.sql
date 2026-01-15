-- Migration: Drip Email Campaign System
-- Adds licensed agent tracking and automated email drip campaigns

-- ============================================
-- 1. ADD LICENSED AGENT FIELD TO AGENTS
-- ============================================

-- Track whether agent is a licensed insurance professional
-- This affects their onboarding experience and drip campaigns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_licensed_agent BOOLEAN DEFAULT false;

-- Add index for filtering by license status
CREATE INDEX IF NOT EXISTS idx_agents_is_licensed ON agents(is_licensed_agent);

-- ============================================
-- 2. DRIP CAMPAIGN TABLES
-- ============================================

-- Campaign types enum
CREATE TYPE drip_campaign_type AS ENUM (
  'new_agent_licensed',      -- For licensed insurance professionals
  'new_agent_unlicensed',    -- For non-licensed new agents
  'reactivation',            -- For inactive agents
  'promotion',               -- Promotional campaigns
  'custom'                   -- Custom campaigns
);

-- Campaign status enum
CREATE TYPE drip_campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Main campaigns table
CREATE TABLE drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  campaign_type drip_campaign_type NOT NULL,
  status drip_campaign_status NOT NULL DEFAULT 'draft',

  -- Targeting (optional - for custom campaigns)
  target_criteria JSONB DEFAULT '{}',  -- e.g., { "rank": ["pre_associate"], "days_since_signup": 30 }

  -- Stats
  total_enrolled INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_unsubscribed INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,

  -- Created by admin
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- Index for active campaigns lookup
CREATE INDEX idx_drip_campaigns_status ON drip_campaigns(status);
CREATE INDEX idx_drip_campaigns_type ON drip_campaigns(campaign_type);

-- Campaign emails (the sequence of emails in a campaign)
CREATE TABLE drip_campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,

  -- Email content
  subject TEXT NOT NULL,
  preview_text TEXT,              -- Email preview/preheader
  html_content TEXT NOT NULL,     -- Full HTML email body
  plain_text TEXT,                -- Plain text fallback

  -- Sequence
  sequence_order INTEGER NOT NULL,  -- 1, 2, 3, etc.
  delay_days INTEGER NOT NULL DEFAULT 1,  -- Days after previous email (or enrollment for first)
  delay_hours INTEGER NOT NULL DEFAULT 0, -- Additional hours after days

  -- Preferred send time (optional)
  preferred_send_hour INTEGER CHECK (preferred_send_hour >= 0 AND preferred_send_hour <= 23),

  -- Stats for this specific email
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, sequence_order)
);

CREATE INDEX idx_drip_campaign_emails_campaign ON drip_campaign_emails(campaign_id);
CREATE INDEX idx_drip_campaign_emails_order ON drip_campaign_emails(campaign_id, sequence_order);

-- Agent enrollments in campaigns
CREATE TABLE drip_campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Progress tracking
  current_email_index INTEGER NOT NULL DEFAULT 0,  -- Which email they're on (0 = not started)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unsubscribed', 'paused')),

  -- Timing
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_send_at TIMESTAMPTZ,  -- When the next email should be sent
  completed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  -- Tracking
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,

  UNIQUE(campaign_id, agent_id)
);

CREATE INDEX idx_drip_enrollments_agent ON drip_campaign_enrollments(agent_id);
CREATE INDEX idx_drip_enrollments_campaign ON drip_campaign_enrollments(campaign_id);
CREATE INDEX idx_drip_enrollments_next_send ON drip_campaign_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX idx_drip_enrollments_status ON drip_campaign_enrollments(status);

-- Individual email sends (for tracking opens/clicks)
CREATE TABLE drip_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES drip_campaign_enrollments(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES drip_campaign_emails(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Send tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Email service tracking
  message_id TEXT,  -- From Resend

  -- For unsubscribe links
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX idx_drip_sends_enrollment ON drip_campaign_sends(enrollment_id);
CREATE INDEX idx_drip_sends_agent ON drip_campaign_sends(agent_id);
CREATE INDEX idx_drip_sends_message_id ON drip_campaign_sends(message_id);
CREATE INDEX idx_drip_sends_unsubscribe ON drip_campaign_sends(unsubscribe_token);

-- ============================================
-- 3. SEED DEFAULT CAMPAIGNS
-- ============================================

-- Licensed Agent Campaign: "Maximize Your Apex Opportunities"
INSERT INTO drip_campaigns (id, name, description, campaign_type, status)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Licensed Agent Fast Start',
  'For experienced insurance professionals - how to maximize opportunities with Apex',
  'new_agent_licensed',
  'active'
);

-- Non-Licensed Agent Campaign: "Top 10 Ways to Grow Your Apex Business"
INSERT INTO drip_campaigns (id, name, description, campaign_type, status)
VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  'New Agent Success Blueprint',
  'For new agents - top 10 things to grow your Apex business starting with your network',
  'new_agent_unlicensed',
  'active'
);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_campaign_sends ENABLE ROW LEVEL SECURITY;

-- Admins can manage campaigns
CREATE POLICY "Admins can manage campaigns"
ON drip_campaigns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
  )
);

-- Admins can manage campaign emails
CREATE POLICY "Admins can manage campaign emails"
ON drip_campaign_emails FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
  )
);

-- Agents can view their own enrollments
CREATE POLICY "Agents can view own enrollments"
ON drip_campaign_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.id = agent_id
  )
);

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage enrollments"
ON drip_campaign_enrollments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
  )
);

-- Agents can view their own sends
CREATE POLICY "Agents can view own sends"
ON drip_campaign_sends FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.id = agent_id
  )
);

-- Admins can manage all sends
CREATE POLICY "Admins can manage sends"
ON drip_campaign_sends FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid()
    AND a.rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
  )
);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get the next pending email send time
CREATE OR REPLACE FUNCTION calculate_next_drip_send(
  p_enrollment_id UUID,
  p_current_email_index INTEGER
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_email RECORD;
  v_enrolled_at TIMESTAMPTZ;
  v_last_sent_at TIMESTAMPTZ;
  v_base_time TIMESTAMPTZ;
BEGIN
  -- Get enrollment info
  SELECT enrolled_at INTO v_enrolled_at
  FROM drip_campaign_enrollments
  WHERE id = p_enrollment_id;

  -- Get the next email in sequence
  SELECT * INTO v_email
  FROM drip_campaign_emails
  WHERE campaign_id = (SELECT campaign_id FROM drip_campaign_enrollments WHERE id = p_enrollment_id)
  AND sequence_order = p_current_email_index + 1;

  IF NOT FOUND THEN
    RETURN NULL;  -- No more emails in sequence
  END IF;

  -- For first email, calculate from enrollment time
  IF p_current_email_index = 0 THEN
    v_base_time := v_enrolled_at;
  ELSE
    -- For subsequent emails, calculate from last send
    SELECT sent_at INTO v_last_sent_at
    FROM drip_campaign_sends
    WHERE enrollment_id = p_enrollment_id
    ORDER BY sent_at DESC
    LIMIT 1;

    v_base_time := COALESCE(v_last_sent_at, v_enrolled_at);
  END IF;

  -- Calculate next send time
  RETURN v_base_time +
         (v_email.delay_days || ' days')::INTERVAL +
         (v_email.delay_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to enroll agent in appropriate campaign
CREATE OR REPLACE FUNCTION enroll_agent_in_drip_campaign(
  p_agent_id UUID,
  p_is_licensed BOOLEAN
) RETURNS UUID AS $$
DECLARE
  v_campaign_id UUID;
  v_enrollment_id UUID;
  v_first_email RECORD;
BEGIN
  -- Find the appropriate campaign
  IF p_is_licensed THEN
    SELECT id INTO v_campaign_id
    FROM drip_campaigns
    WHERE campaign_type = 'new_agent_licensed'
    AND status = 'active'
    LIMIT 1;
  ELSE
    SELECT id INTO v_campaign_id
    FROM drip_campaigns
    WHERE campaign_type = 'new_agent_unlicensed'
    AND status = 'active'
    LIMIT 1;
  END IF;

  IF v_campaign_id IS NULL THEN
    RETURN NULL;  -- No active campaign found
  END IF;

  -- Get first email to calculate send time
  SELECT * INTO v_first_email
  FROM drip_campaign_emails
  WHERE campaign_id = v_campaign_id
  AND sequence_order = 1;

  -- Create enrollment
  INSERT INTO drip_campaign_enrollments (
    campaign_id,
    agent_id,
    current_email_index,
    status,
    next_send_at
  ) VALUES (
    v_campaign_id,
    p_agent_id,
    0,
    'active',
    NOW() + (COALESCE(v_first_email.delay_days, 1) || ' days')::INTERVAL +
            (COALESCE(v_first_email.delay_hours, 0) || ' hours')::INTERVAL
  )
  ON CONFLICT (campaign_id, agent_id) DO NOTHING
  RETURNING id INTO v_enrollment_id;

  -- Update campaign stats
  IF v_enrollment_id IS NOT NULL THEN
    UPDATE drip_campaigns
    SET total_enrolled = total_enrolled + 1
    WHERE id = v_campaign_id;
  END IF;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_drip_campaigns_updated_at
  BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_drip_campaign_emails_updated_at
  BEFORE UPDATE ON drip_campaign_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. STATS INCREMENT FUNCTIONS (RPC)
-- ============================================

-- Increment enrolled count
CREATE OR REPLACE FUNCTION increment_campaign_enrolled(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE drip_campaigns
  SET total_enrolled = total_enrolled + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment completed count
CREATE OR REPLACE FUNCTION increment_campaign_completed(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE drip_campaigns
  SET total_completed = total_completed + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment unsubscribed count
CREATE OR REPLACE FUNCTION increment_campaign_unsubscribed(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE drip_campaigns
  SET total_unsubscribed = total_unsubscribed + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
