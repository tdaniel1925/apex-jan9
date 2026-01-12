-- Migration: Fix RLS infinite recursion
-- Problem: agents_select_downline and matrix policies reference each other causing recursion
-- Date: 2026-01-10

-- Drop the problematic policies that cause circular references
DROP POLICY IF EXISTS agents_select_downline ON agents;
DROP POLICY IF EXISTS matrix_select_downline ON matrix_positions;

-- Recreate matrix policies without circular references
-- Matrix positions are readable by the agent who owns them
DROP POLICY IF EXISTS matrix_select_own ON matrix_positions;
CREATE POLICY matrix_select_own ON matrix_positions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Admins can see all matrix positions (uses is_admin which is SECURITY DEFINER)
DROP POLICY IF EXISTS matrix_select_admin ON matrix_positions;
CREATE POLICY matrix_select_admin ON matrix_positions
  FOR SELECT USING (is_admin());

-- For downline viewing, we'll handle this in the application layer instead of RLS
-- This avoids the circular dependency issue

-- Also need INSERT policy for matrix_positions (for when agents are created)
CREATE POLICY matrix_insert_own ON matrix_positions
  FOR INSERT WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );
