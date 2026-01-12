-- =============================================
-- Supabase RPC Functions for Apex Affinity Group
-- =============================================
-- These functions are called by the application workflows
-- Run this migration in Supabase SQL Editor

-- =============================================
-- DROP EXISTING FUNCTIONS (to handle parameter name changes)
-- =============================================
DROP FUNCTION IF EXISTS update_agent_premium_90_days(UUID);
DROP FUNCTION IF EXISTS increment_sponsor_mga_count(UUID);
DROP FUNCTION IF EXISTS increment_sponsor_recruit_count(UUID);
DROP FUNCTION IF EXISTS update_upline_active_counts(UUID);
DROP FUNCTION IF EXISTS get_agent_upline(UUID, INT);
DROP FUNCTION IF EXISTS check_rank_eligibility(UUID, TEXT);
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- =============================================
-- 1. Update Agent's 90-Day Premium
-- =============================================
-- Recalculates the agent's premium_90_days based on commissions
-- from the last 90 days
CREATE OR REPLACE FUNCTION update_agent_premium_90_days(p_agent_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_premium NUMERIC;
BEGIN
  -- Calculate sum of premiums from last 90 days
  SELECT COALESCE(SUM(premium_amount), 0)
  INTO total_premium
  FROM commissions
  WHERE commissions.agent_id = p_agent_id
    AND policy_date >= CURRENT_DATE - INTERVAL '90 days'
    AND status != 'reversed';

  -- Update the agent's cached premium
  UPDATE agents
  SET
    premium_90_days = total_premium,
    updated_at = NOW()
  WHERE id = p_agent_id;

  RETURN total_premium;
END;
$$;

-- =============================================
-- 2. Increment Sponsor's MGA Count
-- =============================================
-- Called when a downline agent achieves MGA rank
CREATE OR REPLACE FUNCTION increment_sponsor_mga_count(p_sponsor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the MGA count for this sponsor
  UPDATE agents
  SET
    mgas_in_downline = mgas_in_downline + 1,
    updated_at = NOW()
  WHERE id = p_sponsor_id;

  -- Recursively update upline sponsors (up to 6 generations)
  -- by finding all sponsors in the matrix path
  WITH RECURSIVE upline AS (
    -- Get the sponsor's matrix position
    SELECT
      mp.agent_id,
      mp.path,
      1 as generation
    FROM matrix_positions mp
    WHERE mp.agent_id = p_sponsor_id

    UNION ALL

    -- Get parent positions up to 6 generations
    SELECT
      mp.agent_id,
      mp.path,
      u.generation + 1
    FROM upline u
    JOIN matrix_positions mp ON mp.path =
      (SELECT string_agg(part, '.')
       FROM (
         SELECT part FROM unnest(string_to_array(u.path, '.')) WITH ORDINALITY AS t(part, ord)
         WHERE ord < (SELECT COUNT(*) FROM unnest(string_to_array(u.path, '.')))
       ) subq)
    WHERE u.generation < 6
  )
  UPDATE agents
  SET
    mgas_in_downline = mgas_in_downline + 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT agent_id FROM upline WHERE generation > 1
  );
END;
$$;

-- =============================================
-- 3. Increment Sponsor's Recruit Count
-- =============================================
-- Called when a new agent registers under a sponsor
CREATE OR REPLACE FUNCTION increment_sponsor_recruit_count(p_sponsor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment personal recruits for direct sponsor
  UPDATE agents
  SET
    personal_recruits_count = personal_recruits_count + 1,
    updated_at = NOW()
  WHERE id = p_sponsor_id;
END;
$$;

-- =============================================
-- 4. Update Agent Active Counts
-- =============================================
-- Recalculates active agent counts for an agent's upline
CREATE OR REPLACE FUNCTION update_upline_active_counts(p_agent_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get agent's matrix position
  WITH agent_position AS (
    SELECT path FROM matrix_positions WHERE agent_id = p_agent_id
  ),
  -- Calculate active counts for each level of upline
  upline_agents AS (
    SELECT DISTINCT mp.agent_id
    FROM matrix_positions mp
    WHERE EXISTS (
      SELECT 1 FROM agent_position ap
      WHERE ap.path LIKE mp.path || '.%'
    )
  )
  UPDATE agents a
  SET
    active_agents_count = (
      SELECT COUNT(*)
      FROM agents downline
      JOIN matrix_positions dmp ON dmp.agent_id = downline.id
      JOIN matrix_positions amp ON amp.agent_id = a.id
      WHERE dmp.path LIKE amp.path || '.%'
        AND downline.status = 'active'
    ),
    updated_at = NOW()
  WHERE a.id IN (SELECT agent_id FROM upline_agents);
END;
$$;

-- =============================================
-- 5. Get Agent Upline (for override calculation)
-- =============================================
-- Returns up to 6 generations of upline agents
CREATE OR REPLACE FUNCTION get_agent_upline(p_agent_id UUID, p_max_generations INT DEFAULT 6)
RETURNS TABLE(
  upline_agent_id UUID,
  generation INT,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH agent_path AS (
    SELECT path FROM matrix_positions WHERE agent_id = p_agent_id
  )
  SELECT
    a.id as upline_agent_id,
    (SELECT array_length(string_to_array(ap.path, '.'), 1) - array_length(string_to_array(mp.path, '.'), 1)) as generation,
    a.first_name,
    a.last_name
  FROM matrix_positions mp
  JOIN agents a ON a.id = mp.agent_id
  CROSS JOIN agent_path ap
  WHERE ap.path LIKE mp.path || '.%'
    AND array_length(string_to_array(ap.path, '.'), 1) - array_length(string_to_array(mp.path, '.'), 1) <= p_max_generations
  ORDER BY generation ASC;
END;
$$;

-- =============================================
-- 6. Calculate Agent Rank Eligibility
-- =============================================
-- Checks if an agent meets all requirements for a rank
CREATE OR REPLACE FUNCTION check_rank_eligibility(
  p_agent_id UUID,
  p_target_rank TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_record RECORD;
  result JSONB;
BEGIN
  -- Get agent data
  SELECT * INTO agent_record FROM agents WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'error', 'Agent not found');
  END IF;

  -- Build eligibility result based on rank requirements
  -- This is a simplified version - full requirements would be checked in application code
  result := jsonb_build_object(
    'agent_id', p_agent_id,
    'current_rank', agent_record.rank,
    'target_rank', p_target_rank,
    'metrics', jsonb_build_object(
      'premium_90_days', agent_record.premium_90_days,
      'active_agents_count', agent_record.active_agents_count,
      'personal_recruits_count', agent_record.personal_recruits_count,
      'mgas_in_downline', agent_record.mgas_in_downline,
      'persistency_rate', agent_record.persistency_rate,
      'placement_rate', agent_record.placement_rate
    )
  );

  RETURN result;
END;
$$;

-- =============================================
-- 7. Get Dashboard Stats
-- =============================================
-- Returns aggregated stats for admin dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agents', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM agents),
      'active', (SELECT COUNT(*) FROM agents WHERE status = 'active'),
      'pending', (SELECT COUNT(*) FROM agents WHERE status = 'pending')
    ),
    'commissions', jsonb_build_object(
      'total_count', (SELECT COUNT(*) FROM commissions),
      'total_amount', (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions),
      'pending_count', (SELECT COUNT(*) FROM commissions WHERE status = 'pending')
    ),
    'payouts', jsonb_build_object(
      'pending_count', (SELECT COUNT(*) FROM payouts WHERE status = 'pending'),
      'pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE status = 'pending'),
      'completed_amount', (SELECT COALESCE(SUM(net_amount), 0) FROM payouts WHERE status = 'completed')
    ),
    'bonuses', jsonb_build_object(
      'pending_count', (SELECT COUNT(*) FROM bonuses WHERE status = 'pending'),
      'pending_amount', (SELECT COALESCE(SUM(amount), 0) FROM bonuses WHERE status = 'pending')
    ),
    'wallets', jsonb_build_object(
      'total_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallets),
      'total_pending', (SELECT COALESCE(SUM(pending_balance), 0) FROM wallets),
      'total_lifetime', (SELECT COALESCE(SUM(lifetime_earnings), 0) FROM wallets)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- =============================================
-- Grant execute permissions to authenticated users
-- =============================================
GRANT EXECUTE ON FUNCTION update_agent_premium_90_days(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_sponsor_mga_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_sponsor_recruit_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_upline_active_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_upline(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rank_eligibility(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Grant to service_role for admin operations
GRANT EXECUTE ON FUNCTION update_agent_premium_90_days(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_sponsor_mga_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_sponsor_recruit_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_upline_active_counts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_upline(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION check_rank_eligibility(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;
