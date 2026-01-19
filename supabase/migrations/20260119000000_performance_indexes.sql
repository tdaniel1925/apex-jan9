-- Migration: Performance Indexes
-- Phase 2 - Issue #14: Add missing database indexes for query performance
-- Created: 2026-01-19

-- =============================================================================
-- PERFORMANCE INDEXES FOR COMMISSION QUERIES
-- Note: idx_commissions_agent, idx_commissions_status, idx_overrides_commission already exist
-- =============================================================================

-- Index for pending override queries (filtered partial index for performance)
CREATE INDEX IF NOT EXISTS idx_overrides_status_pending
ON overrides(status)
WHERE status = 'pending';

-- Composite index for recent pending commissions (most common admin query)
CREATE INDEX IF NOT EXISTS idx_commissions_status_date
ON commissions(status, created_at DESC);

-- =============================================================================
-- PERFORMANCE INDEXES FOR WALLET QUERIES
-- Note: idx_transactions_agent already exists
-- =============================================================================

-- Composite index for agent wallet transaction history (ordered by date)
CREATE INDEX IF NOT EXISTS idx_wallet_tx_agent_date
ON wallet_transactions(agent_id, created_at DESC);

-- =============================================================================
-- PERFORMANCE INDEXES FOR BONUS QUERIES
-- Note: idx_bonuses_agent, idx_bonuses_status, idx_bonuses_type already exist
-- =============================================================================

-- Composite index for agent bonus queries with type filtering
CREATE INDEX IF NOT EXISTS idx_bonuses_agent_type
ON bonuses(agent_id, bonus_type);

-- =============================================================================
-- PERFORMANCE INDEXES FOR AGENT QUERIES
-- Note: idx_agents_sponsor, idx_agents_username, idx_agents_status, idx_agents_rank already exist
-- =============================================================================

-- Composite index for agent status and rank queries (admin filters)
CREATE INDEX IF NOT EXISTS idx_agents_status_rank
ON agents(status, rank);

-- =============================================================================
-- PERFORMANCE INDEXES FOR TRAINING QUERIES
-- Note: idx_progress_agent, idx_progress_course already exist
-- =============================================================================

-- Composite index for lesson completion tracking by agent
CREATE INDEX IF NOT EXISTS idx_progress_agent_completed
ON course_progress(agent_id, completed);

-- =============================================================================
-- PERFORMANCE INDEXES FOR ORDER QUERIES
-- Note: idx_orders_agent already exists
-- =============================================================================

-- Composite index for agent order history (ordered by date)
CREATE INDEX IF NOT EXISTS idx_orders_agent_date
ON orders(agent_id, created_at DESC);

-- Index for order status tracking
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

-- Index for payment intent lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
ON orders(payment_intent_id)
WHERE payment_intent_id IS NOT NULL;

-- =============================================================================
-- PERFORMANCE INDEXES FOR COPILOT SUBSCRIPTIONS
-- =============================================================================

-- Index for active subscription queries by agent
CREATE INDEX IF NOT EXISTS idx_copilot_subs_agent_status
ON copilot_subscriptions(agent_id, status)
WHERE status IN ('active', 'trialing');

-- Index for Stripe subscription lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_copilot_subs_stripe
ON copilot_subscriptions(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- =============================================================================
-- VERIFY INDEXES CREATED
-- =============================================================================

-- Query to verify all indexes exist:
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Performance note: These indexes will:
-- 1. Speed up admin dashboard queries (commissions, overrides, bonuses)
-- 2. Improve wallet transaction history loading
-- 3. Optimize genealogy tree queries (sponsor downlines)
-- 4. Accelerate webhook processing (Stripe session/subscription lookups)
-- 5. Enable faster training compliance queries
