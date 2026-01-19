-- Migration: Copilot Usage Limits
-- Phase 2 - Issue #21: Enforce tier-based monthly usage limits
-- Created: 2026-01-19

-- =============================================================================
-- TIER LIMITS CONFIGURATION
-- =============================================================================

-- Create configuration table for tier limits
CREATE TABLE IF NOT EXISTS copilot_tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('basic', 'pro', 'agency')),
  monthly_message_limit INTEGER, -- NULL = unlimited
  name TEXT NOT NULL,
  description TEXT
);

-- Insert tier configurations
INSERT INTO copilot_tier_limits (tier, monthly_message_limit, name, description)
VALUES
  ('basic', 100, 'Basic', 'Perfect for getting started - 100 messages per month'),
  ('pro', 500, 'Pro', 'For active agents - 500 messages per month'),
  ('agency', NULL, 'Agency', 'Unlimited messages for power users')
ON CONFLICT (tier) DO UPDATE
SET
  monthly_message_limit = EXCLUDED.monthly_message_limit,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

COMMENT ON TABLE copilot_tier_limits IS 'Configuration for AI Copilot usage limits by tier';

-- =============================================================================
-- HELPER FUNCTION: Get monthly usage for an agent
-- =============================================================================

CREATE OR REPLACE FUNCTION get_copilot_monthly_usage(
  p_agent_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  total_usage INTEGER;
BEGIN
  SELECT COALESCE(SUM(messages_used), 0) INTO total_usage
  FROM copilot_usage
  WHERE agent_id = p_agent_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;

  RETURN total_usage;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_copilot_monthly_usage(UUID, INTEGER, INTEGER) IS 'Get total messages used by an agent in a specific month';

-- =============================================================================
-- HELPER FUNCTION: Check if agent is within usage limit
-- =============================================================================

CREATE OR REPLACE FUNCTION check_copilot_usage_limit(
  p_agent_id UUID
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  monthly_limit INTEGER,
  tier TEXT,
  remaining INTEGER,
  reset_date DATE
) AS $$
DECLARE
  agent_tier TEXT;
  tier_limit INTEGER;
  current_month_usage INTEGER;
BEGIN
  -- Get agent's copilot tier
  SELECT ai_copilot_tier INTO agent_tier
  FROM agents
  WHERE id = p_agent_id;

  -- If no tier or 'none', deny access
  IF agent_tier IS NULL OR agent_tier = 'none' THEN
    RETURN QUERY SELECT
      FALSE,
      0,
      0,
      'none'::TEXT,
      0,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
    RETURN;
  END IF;

  -- Get tier limit
  SELECT monthly_message_limit INTO tier_limit
  FROM copilot_tier_limits
  WHERE tier = agent_tier;

  -- Get current month usage
  current_month_usage := get_copilot_monthly_usage(p_agent_id);

  -- If unlimited (NULL limit), always allow
  IF tier_limit IS NULL THEN
    RETURN QUERY SELECT
      TRUE,
      current_month_usage,
      999999, -- Display as "unlimited"
      agent_tier,
      999999,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
    RETURN;
  END IF;

  -- Check if within limit
  RETURN QUERY SELECT
    current_month_usage < tier_limit,
    current_month_usage,
    tier_limit,
    agent_tier,
    GREATEST(tier_limit - current_month_usage, 0),
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_copilot_usage_limit(UUID) IS 'Check if agent is within their monthly usage limit based on tier';

-- =============================================================================
-- UPDATED FUNCTION: Increment usage with limit checking
-- =============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS increment_copilot_usage(UUID);

-- Create updated version that enforces limits
CREATE OR REPLACE FUNCTION increment_copilot_usage(p_agent_id UUID)
RETURNS TABLE (
  messages_used INTEGER,
  limit_exceeded BOOLEAN,
  monthly_usage INTEGER,
  monthly_limit INTEGER
) AS $$
DECLARE
  current_count INTEGER;
  usage_check RECORD;
BEGIN
  -- Check current usage limit
  SELECT * INTO usage_check
  FROM check_copilot_usage_limit(p_agent_id);

  -- If limit exceeded, return error info without incrementing
  IF NOT usage_check.allowed THEN
    RETURN QUERY SELECT
      0,
      TRUE,
      usage_check.current_usage,
      usage_check.monthly_limit;
    RETURN;
  END IF;

  -- Increment usage
  INSERT INTO copilot_usage (agent_id, date, messages_used)
  VALUES (p_agent_id, CURRENT_DATE, 1)
  ON CONFLICT (agent_id, date)
  DO UPDATE SET messages_used = copilot_usage.messages_used + 1
  RETURNING copilot_usage.messages_used INTO current_count;

  -- Return updated usage info
  RETURN QUERY SELECT
    current_count,
    FALSE,
    usage_check.current_usage + 1,
    usage_check.monthly_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_copilot_usage(UUID) IS 'Increment copilot usage and check limits (Phase 2 Fix - Issue #21)';

-- =============================================================================
-- CREATE INDEXES FOR USAGE QUERIES
-- =============================================================================

-- Index for monthly usage aggregation
CREATE INDEX IF NOT EXISTS idx_copilot_usage_month
ON copilot_usage(agent_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

COMMENT ON INDEX idx_copilot_usage_month IS 'Optimize monthly usage aggregation queries';

-- =============================================================================
-- VIEW: Current month usage by agent
-- =============================================================================

CREATE OR REPLACE VIEW copilot_usage_current_month AS
SELECT
  agent_id,
  SUM(messages_used) as messages_used,
  DATE_TRUNC('month', CURRENT_DATE) as month_start,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE as month_end
FROM copilot_usage
WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY agent_id;

COMMENT ON VIEW copilot_usage_current_month IS 'Current month usage summary by agent';
