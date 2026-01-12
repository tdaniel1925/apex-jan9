-- Apex Affinity Group - Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE agent_status AS ENUM ('pending', 'active', 'inactive', 'terminated');
CREATE TYPE agent_rank AS ENUM (
  'pre_associate', 'associate', 'sr_associate', 'agent', 'sr_agent', 'mga',
  'associate_mga', 'senior_mga', 'regional_mga', 'national_mga', 'executive_mga', 'premier_mga'
);
CREATE TYPE carrier_type AS ENUM ('columbus_life', 'aig', 'fg', 'moo', 'nlg', 'symetra', 'na');
CREATE TYPE ai_copilot_tier AS ENUM ('none', 'basic', 'pro', 'agency');
CREATE TYPE commission_status AS ENUM ('pending', 'paid', 'reversed');
CREATE TYPE bonus_type AS ENUM (
  'fast_start', 'fast_start_sponsor', 'rank_advancement',
  'ai_copilot_personal', 'ai_copilot_referral', 'ai_copilot_team',
  'matching', 'car', 'leadership_pool', 'contest'
);
CREATE TYPE bonus_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE transaction_category AS ENUM ('commission', 'override', 'bonus', 'withdrawal', 'adjustment');
CREATE TYPE payout_method AS ENUM ('ach', 'wire', 'check');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE contact_type AS ENUM ('lead', 'customer', 'recruit');
CREATE TYPE pipeline_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE course_category AS ENUM ('onboarding', 'products', 'sales', 'recruiting', 'compliance');
CREATE TYPE content_type AS ENUM ('video', 'pdf', 'quiz', 'text');

-- ============================================
-- AGENTS TABLE
-- ============================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_code TEXT UNIQUE NOT NULL,

  -- Profile
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Rank & Status
  rank agent_rank NOT NULL DEFAULT 'pre_associate',
  status agent_status NOT NULL DEFAULT 'pending',
  licensed_date DATE,

  -- Metrics (updated by triggers/functions)
  premium_90_days DECIMAL(12,2) NOT NULL DEFAULT 0,
  persistency_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  placement_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  active_agents_count INTEGER NOT NULL DEFAULT 0,
  personal_recruits_count INTEGER NOT NULL DEFAULT 0,
  mgas_in_downline INTEGER NOT NULL DEFAULT 0,

  -- AI Copilot
  ai_copilot_tier ai_copilot_tier NOT NULL DEFAULT 'none',
  ai_copilot_subscribed_at TIMESTAMPTZ,

  -- Replicated Site
  username TEXT UNIQUE,
  replicated_site_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fast_start_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX idx_agents_sponsor ON agents(sponsor_id);
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_rank ON agents(rank);
CREATE INDEX idx_agents_username ON agents(username);
CREATE INDEX idx_agents_agent_code ON agents(agent_code);

-- ============================================
-- MATRIX POSITIONS (5x7)
-- ============================================

CREATE TABLE matrix_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES matrix_positions(id) ON DELETE SET NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 7),
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id),
  UNIQUE(path)
);

CREATE INDEX idx_matrix_parent ON matrix_positions(parent_id);
CREATE INDEX idx_matrix_path ON matrix_positions(path);
CREATE INDEX idx_matrix_level ON matrix_positions(level);

-- ============================================
-- COMMISSIONS
-- ============================================

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  carrier carrier_type NOT NULL,
  policy_number TEXT NOT NULL,
  premium_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  policy_date DATE NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_agent ON commissions(agent_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_date ON commissions(policy_date);
CREATE INDEX idx_commissions_created ON commissions(created_at);

-- ============================================
-- OVERRIDES (6-Generation)
-- ============================================

CREATE TABLE overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  generation INTEGER NOT NULL CHECK (generation >= 1 AND generation <= 6),
  override_rate DECIMAL(5,4) NOT NULL,
  override_amount DECIMAL(12,2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_overrides_commission ON overrides(commission_id);
CREATE INDEX idx_overrides_agent ON overrides(agent_id);
CREATE INDEX idx_overrides_source ON overrides(source_agent_id);

-- ============================================
-- BONUSES
-- ============================================

CREATE TABLE bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  bonus_type bonus_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  status bonus_status NOT NULL DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bonuses_agent ON bonuses(agent_id);
CREATE INDEX idx_bonuses_type ON bonuses(bonus_type);
CREATE INDEX idx_bonuses_status ON bonuses(status);

-- ============================================
-- WALLETS
-- ============================================

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID UNIQUE NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_agent ON wallets(agent_id);

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_agent ON wallet_transactions(agent_id);
CREATE INDEX idx_transactions_created ON wallet_transactions(created_at);
CREATE INDEX idx_transactions_category ON wallet_transactions(category);

-- ============================================
-- PAYOUTS
-- ============================================

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method payout_method NOT NULL,
  fee DECIMAL(8,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_agent ON payouts(agent_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================
-- CRM - CONTACTS
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type contact_type NOT NULL DEFAULT 'lead',

  -- Basic Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Pipeline
  stage pipeline_stage NOT NULL DEFAULT 'new',
  source TEXT,

  -- Additional
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_agent ON contacts(agent_id);
CREATE INDEX idx_contacts_stage ON contacts(stage);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_follow_up ON contacts(next_follow_up_at);

-- ============================================
-- TRAINING - COURSES
-- ============================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category course_category NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_category ON courses(category);

-- ============================================
-- TRAINING - LESSONS
-- ============================================

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type content_type NOT NULL,
  content_url TEXT,
  content_text TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id);

-- ============================================
-- TRAINING - PROGRESS
-- ============================================

CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agent_id, lesson_id)
);

CREATE INDEX idx_progress_agent ON course_progress(agent_id);
CREATE INDEX idx_progress_course ON course_progress(course_id);

-- ============================================
-- RANK HISTORY
-- ============================================

CREATE TABLE rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  previous_rank agent_rank,
  new_rank agent_rank NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rank_history_agent ON rank_history(agent_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER commissions_updated_at BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bonuses_updated_at BEFORE UPDATE ON bonuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
