-- ============================================
-- PHASE 2: Security Enhancements
-- Rate Limiting, Webhook Idempotency, Admin Audit Logging
-- ============================================

-- ============================================
-- RATE LIMITING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL, -- identifier:path combination
  identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or agent ID
  path VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rate limit lookups
CREATE INDEX idx_rate_limit_key_created ON rate_limit_requests(key, created_at DESC);
CREATE INDEX idx_rate_limit_created ON rate_limit_requests(created_at); -- For cleanup

-- Auto-cleanup: Delete records older than 24 hours (runs daily)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- WEBHOOK EVENTS TABLE (Idempotency)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- 'stripe', 'plaid', etc.
  event_id VARCHAR(255) NOT NULL, -- Provider's event ID
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_result JSONB, -- Success/error details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id) -- Prevent duplicate processing
);

CREATE INDEX idx_webhook_events_provider_type ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- ============================================
-- ADMIN AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL, -- Admin user who performed action
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'update_rank', 'approve_payout', 'delete_agent', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'agent', 'payout', 'commission', etc.
  resource_id VARCHAR(255) NOT NULL,
  changes JSONB, -- Before/after values
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to log admin action
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
    admin_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_ip_address,
    p_user_agent
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

-- ============================================
-- CLEANUP JOBS (Run via cron)
-- ============================================

-- Cleanup rate limit requests older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Cleanup webhook events older than 90 days (keep for audit)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE rate_limit_requests IS 'Tracks API requests for rate limiting using token bucket algorithm';
COMMENT ON TABLE webhook_events IS 'Stores webhook events for idempotency checking and audit trail';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log of all admin actions for compliance and security';

COMMENT ON FUNCTION log_admin_action IS 'Helper function to log admin actions with context';
COMMENT ON FUNCTION check_webhook_processed IS 'Check if a webhook event has already been processed';
COMMENT ON FUNCTION record_webhook_event IS 'Record a webhook event to prevent duplicate processing';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
