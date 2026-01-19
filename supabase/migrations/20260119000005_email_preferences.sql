-- Migration: Email Preferences
-- Phase 2 - Issue #26: Proper email unsubscribe handling
-- Created: 2026-01-19

-- =============================================================================
-- EMAIL PREFERENCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Email categories (CAN-SPAM compliant)
  marketing_emails BOOLEAN NOT NULL DEFAULT TRUE,
  training_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  commission_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  payout_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  team_updates BOOLEAN NOT NULL DEFAULT TRUE,

  -- Transactional emails (cannot be disabled)
  -- These are always sent for legal/compliance reasons:
  -- - Account security (password reset, 2FA)
  -- - Legal notices (terms updates, policy changes)
  -- - Transaction confirmations (purchases, withdrawals)
  -- - Compliance requirements (tax forms, audit requests)

  -- Unsubscribe tracking
  unsubscribed_all BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id)
);

COMMENT ON TABLE email_preferences IS 'Agent email preferences - CAN-SPAM compliant (Phase 2 Fix - Issue #26)';
COMMENT ON COLUMN email_preferences.marketing_emails IS 'Product promotions, newsletters, marketing campaigns';
COMMENT ON COLUMN email_preferences.training_notifications IS 'New courses, training reminders, certificate notifications';
COMMENT ON COLUMN email_preferences.commission_alerts IS 'Commission earned notifications (can disable, will see in dashboard)';
COMMENT ON COLUMN email_preferences.payout_notifications IS 'Payout processed notifications (can disable, will see in dashboard)';
COMMENT ON COLUMN email_preferences.team_updates IS 'Downline activity, team achievements';
COMMENT ON COLUMN email_preferences.unsubscribed_all IS 'True if agent clicked "unsubscribe from all" (marketing only)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_email_preferences_agent_id ON email_preferences(agent_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get or create email preferences for agent
CREATE OR REPLACE FUNCTION get_email_preferences(p_agent_id UUID)
RETURNS TABLE (
  marketing_emails BOOLEAN,
  training_notifications BOOLEAN,
  commission_alerts BOOLEAN,
  payout_notifications BOOLEAN,
  team_updates BOOLEAN,
  unsubscribed_all BOOLEAN
) AS $$
BEGIN
  -- Create default preferences if don't exist
  INSERT INTO email_preferences (agent_id)
  VALUES (p_agent_id)
  ON CONFLICT (agent_id) DO NOTHING;

  -- Return preferences
  RETURN QUERY
  SELECT
    ep.marketing_emails,
    ep.training_notifications,
    ep.commission_alerts,
    ep.payout_notifications,
    ep.team_updates,
    ep.unsubscribed_all
  FROM email_preferences ep
  WHERE ep.agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

-- Check if agent can receive specific email type
CREATE OR REPLACE FUNCTION can_send_email(
  p_agent_id UUID,
  p_email_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  prefs RECORD;
BEGIN
  -- Get preferences
  SELECT * INTO prefs
  FROM email_preferences
  WHERE agent_id = p_agent_id;

  -- If no preferences, create defaults and allow
  IF NOT FOUND THEN
    INSERT INTO email_preferences (agent_id)
    VALUES (p_agent_id)
    ON CONFLICT (agent_id) DO NOTHING;
    RETURN TRUE;
  END IF;

  -- Transactional emails always allowed
  IF p_email_type IN (
    'password_reset',
    'security_alert',
    'legal_notice',
    'transaction_confirmation',
    'withdrawal_confirmation',
    'tax_document',
    'compliance_required',
    'enrollment_welcome' -- Initial welcome email
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check category permissions
  CASE p_email_type
    WHEN 'marketing' THEN
      RETURN prefs.marketing_emails;
    WHEN 'training' THEN
      RETURN prefs.training_notifications;
    WHEN 'commission_alert' THEN
      RETURN prefs.commission_alerts;
    WHEN 'payout_alert' THEN
      RETURN prefs.payout_notifications;
    WHEN 'team_update' THEN
      RETURN prefs.team_updates;
    ELSE
      -- Unknown type, default to requiring permission
      RETURN NOT prefs.unsubscribed_all;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Unsubscribe from all marketing emails
CREATE OR REPLACE FUNCTION unsubscribe_all(
  p_agent_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO email_preferences (
    agent_id,
    marketing_emails,
    training_notifications,
    team_updates,
    unsubscribed_all,
    unsubscribed_at,
    unsubscribe_reason
  )
  VALUES (
    p_agent_id,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    NOW(),
    p_reason
  )
  ON CONFLICT (agent_id)
  DO UPDATE SET
    marketing_emails = FALSE,
    training_notifications = FALSE,
    team_updates = FALSE,
    unsubscribed_all = TRUE,
    unsubscribed_at = NOW(),
    unsubscribe_reason = COALESCE(p_reason, email_preferences.unsubscribe_reason);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- EMAIL TYPE CATEGORIES
-- =============================================================================

COMMENT ON FUNCTION can_send_email IS '
Email Type Categories:

TRANSACTIONAL (Always Sent):
- password_reset
- security_alert
- legal_notice
- transaction_confirmation
- withdrawal_confirmation
- tax_document
- compliance_required
- enrollment_welcome

MARKETING (Can Unsubscribe):
- marketing
- training
- commission_alert
- payout_alert
- team_update
';

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Create default preferences for existing agents
INSERT INTO email_preferences (agent_id)
SELECT id FROM agents
ON CONFLICT (agent_id) DO NOTHING;
