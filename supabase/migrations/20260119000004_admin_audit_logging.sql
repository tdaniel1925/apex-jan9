-- Migration: Admin Audit Logging
-- Phase 2 - Issue #16: Track all admin actions for compliance and security
-- Created: 2026-01-19

-- =============================================================================
-- ADMIN AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL, -- User/Agent ID who performed the action
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB, -- { before: {}, after: {}, fields: [] }
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_audit_log IS 'Immutable audit trail of all admin actions for compliance';
COMMENT ON COLUMN admin_audit_log.changes IS 'Before/after values and list of changed fields';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);

-- =============================================================================
-- LOG ADMIN ACTION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_admin_email TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_changes JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
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
  )
  VALUES (
    p_admin_id,
    p_admin_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_admin_action IS 'Create audit log entry for admin action (Phase 2 Fix - Issue #16)';

-- =============================================================================
-- QUERY HELPER FUNCTIONS
-- =============================================================================

-- Get recent actions by admin
CREATE OR REPLACE FUNCTION get_admin_recent_actions(
  p_admin_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aal.id,
    aal.admin_id,
    aal.admin_email,
    aal.action,
    aal.resource_type,
    aal.resource_id,
    aal.changes,
    aal.ip_address,
    aal.created_at
  FROM admin_audit_log aal
  WHERE aal.admin_id = p_admin_id
  ORDER BY aal.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get audit trail for a specific resource
CREATE OR REPLACE FUNCTION get_resource_audit_trail(
  p_resource_type TEXT,
  p_resource_id TEXT
)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aal.id,
    aal.admin_id,
    aal.admin_email,
    aal.action,
    aal.changes,
    aal.ip_address,
    aal.created_at
  FROM admin_audit_log aal
  WHERE aal.resource_type = p_resource_type
    AND aal.resource_id = p_resource_id
  ORDER BY aal.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- ROW-LEVEL SECURITY (IMMUTABLE LOGS)
-- =============================================================================

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can only read audit logs, never update or delete
CREATE POLICY admin_audit_log_read_policy ON admin_audit_log
  FOR SELECT
  USING (true); -- All authenticated users can read (enforced by API)

-- Prevent updates and deletes (immutable audit trail)
CREATE POLICY admin_audit_log_no_update ON admin_audit_log
  FOR UPDATE
  USING (false);

CREATE POLICY admin_audit_log_no_delete ON admin_audit_log
  FOR DELETE
  USING (false);

-- Only allow inserts through the function (enforced by grants)
CREATE POLICY admin_audit_log_insert_policy ON admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- VIEWS FOR COMMON REPORTS
-- =============================================================================

-- Actions by admin user (for dashboard)
CREATE OR REPLACE VIEW admin_audit_summary AS
SELECT
  admin_email,
  action,
  COUNT(*) as action_count,
  MAX(created_at) as last_action_at
FROM admin_audit_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY admin_email, action
ORDER BY action_count DESC;

COMMENT ON VIEW admin_audit_summary IS 'Summary of admin actions in last 30 days';

-- Recent critical actions (for security monitoring)
CREATE OR REPLACE VIEW admin_critical_actions AS
SELECT
  id,
  admin_email,
  action,
  resource_type,
  resource_id,
  changes,
  ip_address,
  created_at
FROM admin_audit_log
WHERE action IN (
  'delete_agent',
  'terminate_agent',
  'forgive_debt',
  'delete_commission',
  'delete_admin_user',
  'update_admin_roles',
  'update_withdrawal_limits'
)
ORDER BY created_at DESC
LIMIT 100;

COMMENT ON VIEW admin_critical_actions IS 'Recent critical admin actions requiring review';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on functions to authenticated users (API will enforce admin role)
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_recent_actions TO authenticated;
GRANT EXECUTE ON FUNCTION get_resource_audit_trail TO authenticated;

-- Grant select on views
GRANT SELECT ON admin_audit_summary TO authenticated;
GRANT SELECT ON admin_critical_actions TO authenticated;
