-- Migration: Add INSERT policies for agents and wallets tables
-- Purpose: Allow users to auto-create their agent record on first login
-- Date: 2026-01-10

-- ============================================
-- AGENTS INSERT POLICY
-- ============================================

-- Users can create their own agent record (for auto-creation on first login)
CREATE POLICY agents_insert_own ON agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- WALLETS INSERT POLICY
-- ============================================

-- Agents can create their own wallet (for auto-creation with agent)
CREATE POLICY wallets_insert_own ON wallets
  FOR INSERT WITH CHECK (agent_id = get_current_agent_id());
