-- ============================================
-- FIX: Rate Limiting and Audit Migration
-- This handles the existing admin_audit_log table
-- ============================================

-- ============================================
-- RATE LIMITING TABLE (Missing)
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key_created ON rate_limit_requests(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_requests(created_at);

-- ============================================
-- WEBHOOK EVENTS TABLE (Missing)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type ON webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- ============================================
-- ADMIN AUDIT LOG (Already exists - add missing columns)
-- ============================================
-- Add admin_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_log' AND column_name = 'admin_email'
  ) THEN
    ALTER TABLE admin_audit_log ADD COLUMN admin_email VARCHAR(255);
  END IF;
END$$;

-- Add changes column if it doesn't exist (combines old_values/new_values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_audit_log' AND column_name = 'changes'
  ) THEN
    ALTER TABLE admin_audit_log ADD COLUMN changes JSONB;
  END IF;
END$$;

-- Update existing indexes if needed
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS (Updated for existing schema)
-- ============================================

-- Function to log admin action (adapted for existing schema)
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_admin_email VARCHAR(255),
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id VARCHAR(255),
  p_changes JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    user_id,  -- Using existing column name
    admin_email,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_action,
    p_resource_type,
    p_resource_id::UUID,  -- Cast to UUID to match existing schema
    p_changes,
    p_ip_address,
    p_user_agent,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check webhook idempotency
CREATE OR REPLACE FUNCTION check_webhook_processed(
  p_provider VARCHAR(50),
  p_event_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM webhook_events
    WHERE provider = p_provider
      AND event_id = p_event_id
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to record webhook event
CREATE OR REPLACE FUNCTION record_webhook_event(
  p_provider VARCHAR(50),
  p_event_id VARCHAR(255),
  p_event_type VARCHAR(100),
  p_payload JSONB,
  p_processing_result JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO webhook_events (
    provider,
    event_id,
    event_type,
    payload,
    processing_result
  ) VALUES (
    p_provider,
    p_event_id,
    p_event_type,
    p_payload,
    p_processing_result
  )
  ON CONFLICT (provider, event_id) DO UPDATE
  SET processing_result = EXCLUDED.processing_result,
      processed_at = NOW()
  RETURNING id INTO v_webhook_id;

  RETURN v_webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE rate_limit_requests IS 'Tracks API requests for rate limiting using token bucket algorithm';
COMMENT ON TABLE webhook_events IS 'Stores webhook events for idempotency checking and audit trail';
COMMENT ON FUNCTION log_admin_action IS 'Helper function to log admin actions with context (adapted for existing schema)';
COMMENT ON FUNCTION check_webhook_processed IS 'Check if a webhook event has already been processed';
COMMENT ON FUNCTION record_webhook_event IS 'Record a webhook event to prevent duplicate processing';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Migration 3 fixed and applied!' AS status;
