-- ============================================
-- IN-APP NOTIFICATIONS SYSTEM
-- Migration: 20260116300000_notifications.sql
-- ============================================
-- Supports:
-- - In-app notifications
-- - Scheduled notifications
-- - Notification preferences
-- ============================================

-- ============================================
-- NOTIFICATION TYPE ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'commission_update',
    'bonus_approval',
    'payout_processing',
    'payout_completed',
    'withdrawal_request',
    'withdrawal_rejected',
    'welcome',
    'new_lead',
    'founders_welcome',
    'achievement_earned',
    'course_completed',
    'certificate_earned',
    'rank_promotion',
    'team_update',
    'system_alert',
    'reminder'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  action_url TEXT,
  image_url TEXT,
  priority notification_priority DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  group_key TEXT  -- For grouping related notifications
);

CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agent_unread ON notifications(agent_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_group ON notifications(group_key) WHERE group_key IS NOT NULL;

-- ============================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  options JSONB,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, sent, failed, cancelled
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_agent ON scheduled_notifications(agent_id);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_agent ON notification_preferences(agent_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications: Agents can view/update their own
CREATE POLICY "Agents can view own notifications"
  ON notifications FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can update own notifications"
  ON notifications FOR UPDATE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can delete own notifications"
  ON notifications FOR DELETE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Scheduled notifications: Same patterns
CREATE POLICY "Agents can view own scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (true);

-- Notification preferences: Agents manage their own
CREATE POLICY "Agents can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- ============================================
-- TRIGGER: UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_notification_prefs_updated_at();

-- ============================================
-- FUNCTION: Clean expired notifications
-- ============================================

CREATE OR REPLACE FUNCTION clean_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE notifications IS 'In-app notifications for agents';
COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled for future delivery';
COMMENT ON TABLE notification_preferences IS 'Per-agent notification channel preferences';
COMMENT ON FUNCTION clean_expired_notifications IS 'Removes expired notifications, call via cron job';
