-- Founders Club - Part 1: Add Enum Value
-- This must be committed before Part 2 can run

-- Add 'founder' to agent_rank enum
ALTER TYPE agent_rank ADD VALUE IF NOT EXISTS 'founder' BEFORE 'pre_associate';
