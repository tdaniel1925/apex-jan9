-- Zapier/Webhook Integration
-- Allows outbound webhooks to trigger on various events

-- ============================================
-- WEBHOOK ENDPOINTS TABLE
-- ============================================
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  secret_key TEXT,  -- Optional HMAC signing key
  is_active BOOLEAN DEFAULT true,

  -- Event subscriptions
  events JSONB NOT NULL DEFAULT '[]',  -- Array of event types to subscribe to

  -- Configuration
  headers JSONB DEFAULT '{}',  -- Custom headers to include
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,

  -- Stats
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ============================================
-- WEBHOOK LOGS TABLE
-- ============================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Response
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,

  -- Status
  success BOOLEAN NOT NULL,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,

  -- Metadata
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(is_active);
CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(endpoint_id);
CREATE INDEX idx_webhook_logs_triggered ON webhook_logs(triggered_at);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);

-- ============================================
-- AVAILABLE EVENT TYPES
-- ============================================
COMMENT ON COLUMN webhook_endpoints.events IS 'Available events:
- agent.created: New agent signs up
- agent.activated: Agent status changed to active
- agent.rank_changed: Agent rank promotion/demotion
- commission.created: New commission recorded
- commission.paid: Commission marked as paid
- policy.submitted: New policy submitted
- policy.approved: Policy approved
- lead.created: New lead created in CRM
- lead.converted: Lead converted to client
- withdrawal.requested: Agent requested withdrawal
- withdrawal.approved: Withdrawal approved
- withdrawal.paid: Withdrawal processed
- bonus.awarded: Bonus awarded to agent
- training.completed: Agent completed course/track
';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admin users can manage webhooks
CREATE POLICY "Admin can manage webhook endpoints"
  ON webhook_endpoints
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Admin can view webhook logs"
  ON webhook_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- CLEANUP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  -- Keep logs for 30 days
  DELETE FROM webhook_logs
  WHERE triggered_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Increment success count
CREATE OR REPLACE FUNCTION increment_webhook_success(p_endpoint_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE webhook_endpoints
  SET
    success_count = success_count + 1,
    last_triggered_at = NOW()
  WHERE id = p_endpoint_id;
END;
$$ LANGUAGE plpgsql;

-- Increment failure count
CREATE OR REPLACE FUNCTION increment_webhook_failure(p_endpoint_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE webhook_endpoints
  SET failure_count = failure_count + 1
  WHERE id = p_endpoint_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE webhook_endpoints IS 'Webhook endpoints for Zapier and other integrations';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook delivery attempts';
