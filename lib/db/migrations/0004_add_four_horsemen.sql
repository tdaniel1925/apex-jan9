-- Migration: Four Horsemen - Shared Distributor Account
-- Created: 2026-02-16
-- Description: Allow 4 founders to share 1 distributor account with commission splits

-- ============================================
-- FOUNDER MEMBERS TABLE
-- ============================================
-- Stores personal information for each of the 4 founders
CREATE TABLE founder_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,

  -- Address Information
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Tax/Legal Information
  ssn_last_four TEXT, -- Store only last 4 digits for security
  date_of_birth DATE,

  -- Commission Settings
  commission_percentage INTEGER NOT NULL DEFAULT 25, -- 25% each

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_commission CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);

-- ============================================
-- FOUNDER LOGINS TABLE
-- ============================================
-- Maps Supabase auth users to founder members (1 auth user = 1 founder)
CREATE TABLE founder_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_member_id UUID NOT NULL REFERENCES founder_members(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL UNIQUE, -- Maps to auth.users

  -- Login tracking
  last_login_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_founder_auth UNIQUE (founder_member_id, auth_user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_founder_members_distributor ON founder_members(distributor_id);
CREATE INDEX idx_founder_members_email ON founder_members(email);
CREATE INDEX idx_founder_logins_auth_user ON founder_logins(auth_user_id);
CREATE INDEX idx_founder_logins_founder ON founder_logins(founder_member_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE founder_members IS 'Stores personal information for the 4 founders who share the apex-vision distributor account';
COMMENT ON TABLE founder_logins IS 'Maps Supabase auth users to founder members, allowing 4 people to log in as one distributor';
COMMENT ON COLUMN founder_members.commission_percentage IS 'Percentage of commissions allocated to this founder (should total 100% across all 4)';
COMMENT ON COLUMN founder_members.ssn_last_four IS 'Last 4 digits of SSN for tax purposes only';
