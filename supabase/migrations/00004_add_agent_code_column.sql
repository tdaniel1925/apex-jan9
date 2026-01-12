-- Migration: Add agent_code column to agents table
-- Purpose: Unique agent identifier for replicated sites and referrals
-- Date: 2026-01-10

-- Add agent_code column
ALTER TABLE agents
ADD COLUMN agent_code TEXT UNIQUE;

-- Create index for lookups
CREATE INDEX idx_agents_agent_code ON agents(agent_code);

-- Make it NOT NULL after adding (for existing rows, generate codes)
-- For existing agents without codes, generate one
UPDATE agents
SET agent_code = 'APX' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE agent_code IS NULL;

-- Now make it NOT NULL
ALTER TABLE agents
ALTER COLUMN agent_code SET NOT NULL;
