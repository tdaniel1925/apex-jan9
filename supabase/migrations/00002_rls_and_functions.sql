-- Apex Affinity Group - RLS Policies and Helper Functions

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

-- Public read for courses and lessons
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get current agent
-- ============================================

CREATE OR REPLACE FUNCTION get_current_agent_id()
RETURNS UUID AS $$
  SELECT id FROM agents WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM agents
    WHERE user_id = auth.uid()
    AND rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- AGENTS POLICIES
-- ============================================

-- Users can create their own agent record (for auto-creation on first login)
CREATE POLICY agents_insert_own ON agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Agents can read their own data
CREATE POLICY agents_select_own ON agents
  FOR SELECT USING (user_id = auth.uid());

-- Agents can update their own profile
CREATE POLICY agents_update_own ON agents
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all agents
CREATE POLICY agents_select_admin ON agents
  FOR SELECT USING (is_admin());

-- NOTE: Downline viewing is handled in application layer to avoid RLS recursion
-- The agents_select_downline policy was removed due to circular dependency with matrix_positions

-- ============================================
-- COMMISSIONS POLICIES
-- ============================================

CREATE POLICY commissions_select_own ON commissions
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY commissions_select_admin ON commissions
  FOR SELECT USING (is_admin());

-- ============================================
-- OVERRIDES POLICIES
-- ============================================

CREATE POLICY overrides_select_own ON overrides
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY overrides_select_admin ON overrides
  FOR SELECT USING (is_admin());

-- ============================================
-- BONUSES POLICIES
-- ============================================

CREATE POLICY bonuses_select_own ON bonuses
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY bonuses_select_admin ON bonuses
  FOR SELECT USING (is_admin());

-- ============================================
-- WALLETS POLICIES
-- ============================================

-- Agents can create their own wallet (for auto-creation with agent)
CREATE POLICY wallets_insert_own ON wallets
  FOR INSERT WITH CHECK (agent_id = get_current_agent_id());

CREATE POLICY wallets_select_own ON wallets
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY wallets_select_admin ON wallets
  FOR SELECT USING (is_admin());

-- ============================================
-- WALLET TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY transactions_select_own ON wallet_transactions
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY transactions_select_admin ON wallet_transactions
  FOR SELECT USING (is_admin());

-- ============================================
-- PAYOUTS POLICIES
-- ============================================

CREATE POLICY payouts_select_own ON payouts
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY payouts_insert_own ON payouts
  FOR INSERT WITH CHECK (agent_id = get_current_agent_id());

CREATE POLICY payouts_select_admin ON payouts
  FOR SELECT USING (is_admin());

-- ============================================
-- CONTACTS POLICIES
-- ============================================

CREATE POLICY contacts_select_own ON contacts
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY contacts_insert_own ON contacts
  FOR INSERT WITH CHECK (agent_id = get_current_agent_id());

CREATE POLICY contacts_update_own ON contacts
  FOR UPDATE USING (agent_id = get_current_agent_id());

CREATE POLICY contacts_delete_own ON contacts
  FOR DELETE USING (agent_id = get_current_agent_id());

-- ============================================
-- MATRIX POSITIONS POLICIES
-- ============================================

-- Matrix positions are readable by the agent who owns them
-- Using direct auth.uid() lookup to avoid recursion
CREATE POLICY matrix_select_own ON matrix_positions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Agents can insert their own matrix position
CREATE POLICY matrix_insert_own ON matrix_positions
  FOR INSERT WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Admins can see all matrix positions
CREATE POLICY matrix_select_admin ON matrix_positions
  FOR SELECT USING (is_admin());

-- NOTE: Downline matrix viewing is handled in application layer to avoid RLS recursion

-- ============================================
-- COURSES & LESSONS - PUBLIC READ
-- ============================================

CREATE POLICY courses_select_all ON courses
  FOR SELECT USING (true);

CREATE POLICY lessons_select_all ON lessons
  FOR SELECT USING (true);

-- ============================================
-- COURSE PROGRESS POLICIES
-- ============================================

CREATE POLICY progress_select_own ON course_progress
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY progress_insert_own ON course_progress
  FOR INSERT WITH CHECK (agent_id = get_current_agent_id());

CREATE POLICY progress_update_own ON course_progress
  FOR UPDATE USING (agent_id = get_current_agent_id());

-- ============================================
-- RANK HISTORY POLICIES
-- ============================================

CREATE POLICY rank_history_select_own ON rank_history
  FOR SELECT USING (agent_id = get_current_agent_id());

CREATE POLICY rank_history_select_admin ON rank_history
  FOR SELECT USING (is_admin());

-- ============================================
-- HELPER FUNCTIONS FOR WORKFLOWS
-- ============================================

-- Update agent's 90-day premium total
CREATE OR REPLACE FUNCTION update_agent_premium_90_days(p_agent_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_premium DECIMAL;
BEGIN
  SELECT COALESCE(SUM(premium_amount), 0) INTO v_premium
  FROM commissions
  WHERE agent_id = p_agent_id
    AND status = 'paid'
    AND created_at >= NOW() - INTERVAL '90 days';

  UPDATE agents SET premium_90_days = v_premium WHERE id = p_agent_id;

  RETURN v_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment sponsor's recruit count
CREATE OR REPLACE FUNCTION increment_sponsor_recruit_count(p_sponsor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET personal_recruits_count = personal_recruits_count + 1
  WHERE id = p_sponsor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment sponsor's MGA count
CREATE OR REPLACE FUNCTION increment_sponsor_mga_count(p_sponsor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET mgas_in_downline = mgas_in_downline + 1
  WHERE id = p_sponsor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update active agents count for a sponsor
CREATE OR REPLACE FUNCTION update_active_agents_count(p_sponsor_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM agents
  WHERE sponsor_id = p_sponsor_id
    AND status = 'active';

  UPDATE agents SET active_agents_count = v_count WHERE id = p_sponsor_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get agent's upline (for override calculations)
CREATE OR REPLACE FUNCTION get_agent_upline(p_agent_id UUID, p_generations INTEGER DEFAULT 6)
RETURNS TABLE(agent_id UUID, generation INTEGER) AS $$
DECLARE
  v_path TEXT;
  v_parts TEXT[];
  v_i INTEGER;
BEGIN
  -- Get agent's matrix path
  SELECT path INTO v_path FROM matrix_positions WHERE matrix_positions.agent_id = p_agent_id;

  IF v_path IS NULL THEN
    RETURN;
  END IF;

  -- Split path and walk up
  v_parts := string_to_array(v_path, '.');

  FOR v_i IN REVERSE (array_length(v_parts, 1) - 1)..1 LOOP
    EXIT WHEN (array_length(v_parts, 1) - v_i) > p_generations;

    RETURN QUERY
    SELECT mp.agent_id, (array_length(v_parts, 1) - v_i)::INTEGER
    FROM matrix_positions mp
    WHERE mp.path = array_to_string(v_parts[1:v_i], '.');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get dashboard stats for an agent
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(p_agent_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'agent', (SELECT row_to_json(a) FROM agents a WHERE a.id = p_agent_id),
    'wallet', (SELECT row_to_json(w) FROM wallets w WHERE w.agent_id = p_agent_id),
    'commissions_this_month', (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM commissions
      WHERE agent_id = p_agent_id
        AND created_at >= date_trunc('month', NOW())
    ),
    'overrides_this_month', (
      SELECT COALESCE(SUM(override_amount), 0)
      FROM overrides
      WHERE agent_id = p_agent_id
        AND created_at >= date_trunc('month', NOW())
    ),
    'bonuses_this_month', (
      SELECT COALESCE(SUM(amount), 0)
      FROM bonuses
      WHERE agent_id = p_agent_id
        AND status = 'paid'
        AND created_at >= date_trunc('month', NOW())
    ),
    'team_size', (
      SELECT COUNT(*)
      FROM matrix_positions mp
      WHERE mp.path LIKE (SELECT path || '.%' FROM matrix_positions WHERE agent_id = p_agent_id)
    ),
    'direct_recruits', (
      SELECT COUNT(*) FROM agents WHERE sponsor_id = p_agent_id
    ),
    'pending_contacts', (
      SELECT COUNT(*) FROM contacts
      WHERE agent_id = p_agent_id AND stage NOT IN ('closed_won', 'closed_lost')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
