-- SPEC: SPEC-AUTH.md > RLS Policies
-- Row-Level Security policies for all tables
-- Stage 2: Auth & Middleware

-- Enable RLS on all tables
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DISTRIBUTORS TABLE
-- ============================================

-- Distributors can read their own row
CREATE POLICY "distributors_select_own" ON distributors
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Distributors can read distributors in their downline (via matrix_positions subtree)
CREATE POLICY "distributors_select_downline" ON distributors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matrix_positions mp1
      INNER JOIN matrix_positions mp2 ON mp2.left_boundary BETWEEN mp1.left_boundary AND mp1.right_boundary
      INNER JOIN distributors d ON d.id = mp1.distributor_id
      WHERE d.auth_user_id = auth.uid()
        AND mp2.distributor_id = distributors.id
    )
  );

-- Admins can read all distributors
CREATE POLICY "distributors_select_admin" ON distributors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Distributors can update their own row (specific columns only)
CREATE POLICY "distributors_update_own" ON distributors
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Service role only for INSERT
-- (No user-facing INSERT policy - sign-up uses service role)

-- ============================================
-- MATRIX_POSITIONS TABLE
-- ============================================

-- Distributors can read positions in their subtree
CREATE POLICY "matrix_select_own_subtree" ON matrix_positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matrix_positions mp1
      INNER JOIN distributors d ON d.id = mp1.distributor_id
      WHERE d.auth_user_id = auth.uid()
        AND matrix_positions.left_boundary BETWEEN mp1.left_boundary AND mp1.right_boundary
    )
  );

-- Admins can read all positions
CREATE POLICY "matrix_select_admin" ON matrix_positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT/UPDATE
-- (Matrix placement algorithm runs as service role)

-- ============================================
-- CONTACT_SUBMISSIONS TABLE
-- ============================================

-- Distributors can read their own submissions
CREATE POLICY "contact_select_own" ON contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = contact_submissions.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  );

-- Admins can read all submissions
CREATE POLICY "contact_select_admin" ON contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Anon can insert (public contact form)
CREATE POLICY "contact_insert_anon" ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Distributors can update status of their own submissions
CREATE POLICY "contact_update_own" ON contact_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = contact_submissions.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = contact_submissions.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- Distributors can read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = notifications.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  );

-- Distributors can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = notifications.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = notifications.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT

-- ============================================
-- ACTIVITY_LOG TABLE
-- ============================================

-- Distributors can read activity log entries for their own org
CREATE POLICY "activity_select_own_org" ON activity_log
  FOR SELECT
  USING (
    actor_type = 'distributor' AND EXISTS (
      SELECT 1 FROM distributors d1
      INNER JOIN matrix_positions mp1 ON mp1.distributor_id = d1.id
      INNER JOIN distributors d2 ON d2.id = activity_log.actor_id
      INNER JOIN matrix_positions mp2 ON mp2.distributor_id = d2.id
      WHERE d1.auth_user_id = auth.uid()
        AND mp2.left_boundary BETWEEN mp1.left_boundary AND mp1.right_boundary
    )
  );

-- Admins can read all activity log
CREATE POLICY "activity_select_admin" ON activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT

-- ============================================
-- AUDIT_LOG TABLE
-- ============================================

-- Admins can read all audit log
CREATE POLICY "audit_select_admin" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT

-- ============================================
-- ADMIN_USERS TABLE
-- ============================================

-- Admins can read all admin records
CREATE POLICY "admin_users_select_admin" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT/UPDATE/DELETE

-- ============================================
-- SITE_CONTENT TABLE
-- ============================================

-- Public can read site_content (displayed on marketing pages)
CREATE POLICY "site_content_select_public" ON site_content
  FOR SELECT
  USING (true);

-- Service role only for UPDATE (super_admin via service role)

-- ============================================
-- SYSTEM_SETTINGS TABLE
-- ============================================

-- Admins can read system settings
CREATE POLICY "system_settings_select_admin" ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Service role only for UPDATE (super_admin via service role)

-- ============================================
-- DRIP_ENROLLMENTS TABLE
-- ============================================

-- Distributors can read their own drip enrollment
CREATE POLICY "drip_select_own" ON drip_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM distributors
      WHERE distributors.id = drip_enrollments.distributor_id
        AND distributors.auth_user_id = auth.uid()
    )
  );

-- Admins can read all drip enrollments
CREATE POLICY "drip_select_admin" ON drip_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Service role only for INSERT/UPDATE

-- ============================================
-- SIGNUP_ANALYTICS TABLE
-- ============================================

-- Admins can read all signup analytics
CREATE POLICY "signup_analytics_select_admin" ON signup_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Anon can insert (public signup tracking)
CREATE POLICY "signup_analytics_insert_anon" ON signup_analytics
  FOR INSERT
  WITH CHECK (true);
