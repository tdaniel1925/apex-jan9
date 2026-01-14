-- Founders Club Seed Data
-- Run this AFTER the 20260114000000_founders_club.sql migration
-- This creates the FC Inc. root agent and matrix position

-- ============================================
-- CREATE FC INC. ROOT AGENT
-- ============================================

-- First, we need to create the FC Inc. agent
-- Note: This agent won't have a user_id initially (no login)
-- A user account can be created later and linked

DO $$
DECLARE
  v_fc_agent_id UUID;
  v_fc_position_id UUID;
BEGIN
  -- Check if FC Inc. already exists
  SELECT id INTO v_fc_agent_id
  FROM agents
  WHERE agent_code = 'FC-INC-001';

  IF v_fc_agent_id IS NULL THEN
    -- Create FC Inc. agent
    INSERT INTO agents (
      id,
      agent_code,
      first_name,
      last_name,
      email,
      rank,
      status,
      bio,
      replicated_site_enabled
    ) VALUES (
      gen_random_uuid(),
      'FC-INC-001',
      'FC',
      'Inc.',
      'founders@theapexway.net',
      'founder',
      'active',
      'Founders Club - The root of the Apex Affinity Group matrix. Four partners sharing equally in the success of all agents.',
      false
    )
    RETURNING id INTO v_fc_agent_id;

    RAISE NOTICE 'Created FC Inc. agent with ID: %', v_fc_agent_id;

    -- Create the root matrix position (level 0, position 0)
    INSERT INTO matrix_positions (
      id,
      agent_id,
      parent_id,
      position,
      level,
      path
    ) VALUES (
      gen_random_uuid(),
      v_fc_agent_id,
      NULL,  -- No parent - this is the root
      0,     -- Position 0 for root
      0,     -- Level 0 (root level)
      '0'    -- Path is just '0' for root
    )
    RETURNING id INTO v_fc_position_id;

    RAISE NOTICE 'Created root matrix position with ID: %', v_fc_position_id;

    -- Create wallet for FC Inc. (to track total founder earnings)
    INSERT INTO wallets (agent_id, balance, pending_balance, lifetime_earnings)
    VALUES (v_fc_agent_id, 0, 0, 0);

    RAISE NOTICE 'Created wallet for FC Inc.';

  ELSE
    RAISE NOTICE 'FC Inc. already exists with ID: %', v_fc_agent_id;
  END IF;
END $$;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Show the created FC Inc. agent
SELECT
  a.id,
  a.agent_code,
  a.first_name || ' ' || a.last_name as name,
  a.rank,
  a.status,
  mp.level,
  mp.position,
  mp.path
FROM agents a
LEFT JOIN matrix_positions mp ON mp.agent_id = a.id
WHERE a.agent_code = 'FC-INC-001';

-- Show the founder partner slots
SELECT
  slot_number,
  name,
  share_percentage,
  is_active
FROM founder_partners
ORDER BY slot_number;
