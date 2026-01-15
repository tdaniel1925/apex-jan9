-- ============================================
-- ADMIN USER MANAGEMENT (RBAC)
-- Migration: 20260112_admin_rbac.sql
-- ============================================

-- Role levels for hierarchy
CREATE TYPE admin_role_level AS ENUM ('super_admin', 'department_head', 'staff');

-- Admin users (separate from agents)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Roles (predefined departments + custom)
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- 'super_admin', 'finance', 'it', etc.
  display_name TEXT NOT NULL,          -- 'Super Administrator', 'Finance Team'
  description TEXT,
  level admin_role_level NOT NULL,     -- Hierarchy level
  is_system BOOLEAN DEFAULT false,     -- System roles can't be deleted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions (granular actions)
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'agents.view', 'agents.edit', etc.
  name TEXT NOT NULL,                  -- 'View Agents'
  category TEXT NOT NULL,              -- 'agents', 'finance', 'training'
  description TEXT
);

-- Role-Permission mapping
CREATE TABLE admin_role_permissions (
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping (users can have multiple roles)
CREATE TABLE admin_user_roles (
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES admin_users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Audit log for all admin actions
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,                -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type TEXT NOT NULL,         -- 'agent', 'commission', 'payout', 'admin_user'
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session management for admins
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_audit_user ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token_hash);

-- ============================================
-- SEED DEFAULT ROLES
-- ============================================

INSERT INTO admin_roles (name, display_name, description, level, is_system) VALUES
  ('super_admin', 'Super Administrator', 'Full system access, can manage all users and settings', 'super_admin', true),
  ('finance', 'Finance Team', 'Access to commissions, payouts, clawbacks, bonuses', 'department_head', true),
  ('it', 'IT Team', 'Access to system settings, integrations, SmartOffice', 'department_head', true),
  ('memberships', 'Memberships Team', 'Access to agent management and compliance', 'department_head', true),
  ('training', 'Training Team', 'Access to LMS and training management', 'department_head', true),
  ('analytics', 'Analytics Team', 'Read-only access to reports and analytics', 'staff', true);

-- ============================================
-- SEED PERMISSIONS
-- ============================================

INSERT INTO admin_permissions (code, name, category, description) VALUES
  -- Dashboard
  ('dashboard.view', 'View Dashboard', 'dashboard', 'Access admin dashboard'),

  -- Agents
  ('agents.view', 'View Agents', 'agents', 'View agent list and details'),
  ('agents.edit', 'Edit Agents', 'agents', 'Edit agent information'),
  ('agents.create', 'Create Agents', 'agents', 'Create new agents'),
  ('agents.delete', 'Delete Agents', 'agents', 'Deactivate or delete agents'),

  -- Finance
  ('commissions.view', 'View Commissions', 'finance', 'View commission reports'),
  ('commissions.import', 'Import Commissions', 'finance', 'Import commission files'),
  ('commissions.edit', 'Edit Commissions', 'finance', 'Adjust commission records'),
  ('payouts.view', 'View Payouts', 'finance', 'View payout history'),
  ('payouts.process', 'Process Payouts', 'finance', 'Process agent payouts'),
  ('clawbacks.view', 'View Clawbacks', 'finance', 'View clawback records'),
  ('clawbacks.manage', 'Manage Clawbacks', 'finance', 'Create and manage clawbacks'),
  ('bonuses.view', 'View Bonuses', 'finance', 'View bonus records'),
  ('bonuses.manage', 'Manage Bonuses', 'finance', 'Create and process bonuses'),
  ('payperiods.view', 'View Pay Periods', 'finance', 'View pay period schedule'),
  ('payperiods.manage', 'Manage Pay Periods', 'finance', 'Create and close pay periods'),

  -- Training
  ('training.view', 'View Training', 'training', 'View training analytics'),
  ('training.manage', 'Manage Training', 'training', 'Create and edit courses'),
  ('certificates.view', 'View Certificates', 'training', 'View issued certificates'),
  ('certificates.issue', 'Issue Certificates', 'training', 'Issue certificates to agents'),

  -- Compliance
  ('compliance.view', 'View Compliance', 'compliance', 'View compliance status'),
  ('compliance.manage', 'Manage Compliance', 'compliance', 'Update compliance records'),

  -- Products
  ('products.view', 'View Products', 'products', 'View product catalog'),
  ('products.manage', 'Manage Products', 'products', 'Add and edit products'),

  -- Analytics
  ('analytics.view', 'View Analytics', 'analytics', 'View analytics and reports'),
  ('overrides.view', 'View Override Report', 'analytics', 'View override commission reports'),

  -- System
  ('settings.view', 'View Settings', 'system', 'View system settings'),
  ('settings.edit', 'Edit Settings', 'system', 'Modify system settings'),
  ('smartoffice.view', 'View SmartOffice', 'system', 'Access SmartOffice integration'),
  ('smartoffice.sync', 'Sync SmartOffice', 'system', 'Run SmartOffice sync'),
  ('copilot.view', 'View Copilot', 'system', 'Access AI Copilot settings'),
  ('copilot.manage', 'Manage Copilot', 'system', 'Configure AI Copilot'),

  -- Admin Users
  ('users.view', 'View Admin Users', 'admin', 'View admin user list'),
  ('users.manage', 'Manage Admin Users', 'admin', 'Create and edit admin users'),
  ('roles.view', 'View Roles', 'admin', 'View role definitions'),
  ('roles.manage', 'Manage Roles', 'admin', 'Create and edit roles'),
  ('audit.view', 'View Audit Log', 'admin', 'View admin action audit log');

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Super Admin gets ALL permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin';

-- Finance Team permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'finance'
AND p.code IN (
  'dashboard.view',
  'agents.view',
  'commissions.view', 'commissions.import', 'commissions.edit',
  'payouts.view', 'payouts.process',
  'clawbacks.view', 'clawbacks.manage',
  'bonuses.view', 'bonuses.manage',
  'payperiods.view', 'payperiods.manage',
  'overrides.view',
  'analytics.view'
);

-- IT Team permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'it'
AND p.code IN (
  'dashboard.view',
  'settings.view', 'settings.edit',
  'smartoffice.view', 'smartoffice.sync',
  'copilot.view', 'copilot.manage',
  'products.view', 'products.manage',
  'users.view', 'users.manage',
  'roles.view',
  'audit.view'
);

-- Memberships Team permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'memberships'
AND p.code IN (
  'dashboard.view',
  'agents.view', 'agents.edit', 'agents.create',
  'compliance.view', 'compliance.manage',
  'analytics.view'
);

-- Training Team permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'training'
AND p.code IN (
  'dashboard.view',
  'training.view', 'training.manage',
  'certificates.view', 'certificates.issue',
  'agents.view',
  'analytics.view'
);

-- Analytics Team permissions (read-only)
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'analytics'
AND p.code IN (
  'dashboard.view',
  'agents.view',
  'commissions.view',
  'payouts.view',
  'clawbacks.view',
  'bonuses.view',
  'payperiods.view',
  'training.view',
  'certificates.view',
  'compliance.view',
  'analytics.view',
  'overrides.view'
);

-- ============================================
-- CREATE INITIAL SUPER ADMIN
-- Password: 'ApexAdmin2026!' (bcrypt hash)
-- ============================================

INSERT INTO admin_users (email, password_hash, first_name, last_name, is_active)
VALUES (
  'admin@theapexway.net',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJzMveQW',
  'System',
  'Administrator',
  true
);

-- Assign super_admin role to initial admin
INSERT INTO admin_user_roles (user_id, role_id)
SELECT u.id, r.id
FROM admin_users u, admin_roles r
WHERE u.email = 'admin@theapexway.net'
AND r.name = 'super_admin';

-- ============================================
-- RLS POLICIES (Optional - for Supabase)
-- ============================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON admin_users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_roles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_permissions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_role_permissions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_user_roles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_audit_log FOR ALL USING (true);
CREATE POLICY "Service role full access" ON admin_sessions FOR ALL USING (true);
