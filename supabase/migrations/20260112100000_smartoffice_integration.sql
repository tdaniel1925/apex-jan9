-- SmartOffice Integration Tables
-- Sync agent hierarchy, commissions, and policy data from SmartOffice CRM

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE smartoffice_sync_type AS ENUM ('full', 'incremental', 'webhook', 'manual');
CREATE TYPE smartoffice_sync_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ============================================
-- SMARTOFFICE SYNC CONFIG
-- ============================================

CREATE TABLE smartoffice_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- API Credentials (encrypted at rest via Supabase)
  api_url TEXT NOT NULL DEFAULT 'https://api.sandbox.smartofficecrm.com/3markapex/v1/send',
  sitename TEXT NOT NULL,
  username TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,

  -- Sync Settings
  is_active BOOLEAN NOT NULL DEFAULT false,
  sync_frequency_hours INTEGER NOT NULL DEFAULT 6,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,

  -- Webhook (if SmartOffice supports it)
  webhook_secret TEXT,
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only allow one config row
CREATE UNIQUE INDEX idx_smartoffice_config_singleton ON smartoffice_sync_config ((true));

-- ============================================
-- SMARTOFFICE AGENTS (Imported Data)
-- ============================================

CREATE TABLE smartoffice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SmartOffice IDs (from API)
  smartoffice_id TEXT NOT NULL UNIQUE, -- e.g., "Agent.90807498.180"
  contact_id TEXT, -- e.g., "Contact.90807498.180"

  -- Mapped Apex Agent (NULL if not yet mapped)
  apex_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- Profile from SmartOffice
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT, -- Masked in API responses for privacy

  -- SmartOffice-specific fields
  client_type INTEGER, -- 7 = advisor
  status INTEGER, -- 1 = active

  -- Hierarchy (field name TBD from API Dictionary)
  hierarchy_id TEXT, -- Parent SmartOffice agent ID

  -- Raw API response for reference
  raw_data JSONB,

  -- Sync tracking
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_agents_smartoffice_id ON smartoffice_agents(smartoffice_id);
CREATE INDEX idx_so_agents_apex_agent ON smartoffice_agents(apex_agent_id);
CREATE INDEX idx_so_agents_email ON smartoffice_agents(email);
CREATE INDEX idx_so_agents_hierarchy ON smartoffice_agents(hierarchy_id);

-- ============================================
-- SMARTOFFICE COMMISSIONS (Imported Data)
-- ============================================

CREATE TABLE smartoffice_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SmartOffice ID
  smartoffice_id TEXT NOT NULL UNIQUE, -- e.g., "CommPayable.1.11"

  -- Link to SmartOffice agent
  smartoffice_agent_id UUID NOT NULL REFERENCES smartoffice_agents(id) ON DELETE CASCADE,

  -- Mapped Apex commission (NULL if not yet mapped)
  apex_commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,

  -- Commission data from SmartOffice
  policy_number TEXT NOT NULL,
  current_role TEXT, -- e.g., "Primary Advisor"
  receivable DECIMAL(12,2) NOT NULL DEFAULT 0,
  payable_due_date DATE,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT, -- e.g., "Open", "Paid"
  comm_type TEXT, -- e.g., "Base"
  component_premium DECIMAL(12,2) DEFAULT 0,
  receivable_percent DECIMAL(5,2) DEFAULT 0,
  receivable_percent_of TEXT, -- e.g., "Premium"

  -- Raw API response
  raw_data JSONB,

  -- Sync tracking
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_commissions_smartoffice_id ON smartoffice_commissions(smartoffice_id);
CREATE INDEX idx_so_commissions_agent ON smartoffice_commissions(smartoffice_agent_id);
CREATE INDEX idx_so_commissions_apex ON smartoffice_commissions(apex_commission_id);
CREATE INDEX idx_so_commissions_policy ON smartoffice_commissions(policy_number);

-- ============================================
-- SMARTOFFICE POLICIES (Imported Data)
-- ============================================

CREATE TABLE smartoffice_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SmartOffice ID
  smartoffice_id TEXT NOT NULL UNIQUE, -- e.g., "Policy.90807498.109252919"

  -- Link to SmartOffice agent (primary advisor)
  smartoffice_agent_id UUID REFERENCES smartoffice_agents(id) ON DELETE SET NULL,
  primary_advisor_contact_id TEXT, -- e.g., "Contact.90807498.163076818"

  -- Policy data from SmartOffice
  policy_number TEXT NOT NULL,
  carrier_name TEXT,
  holding_type INTEGER, -- 1 = Life, 3 = other
  holding_type_name TEXT, -- Human-readable
  annual_premium DECIMAL(12,2) DEFAULT 0,

  -- Raw API response
  raw_data JSONB,

  -- Sync tracking
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_policies_smartoffice_id ON smartoffice_policies(smartoffice_id);
CREATE INDEX idx_so_policies_agent ON smartoffice_policies(smartoffice_agent_id);
CREATE INDEX idx_so_policies_policy_number ON smartoffice_policies(policy_number);

-- ============================================
-- SMARTOFFICE SYNC LOGS (Audit Trail)
-- ============================================

CREATE TABLE smartoffice_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sync info
  sync_type smartoffice_sync_type NOT NULL,
  status smartoffice_sync_status NOT NULL DEFAULT 'pending',

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  agents_synced INTEGER DEFAULT 0,
  agents_created INTEGER DEFAULT 0,
  agents_updated INTEGER DEFAULT 0,
  commissions_synced INTEGER DEFAULT 0,
  commissions_created INTEGER DEFAULT 0,
  policies_synced INTEGER DEFAULT 0,
  policies_created INTEGER DEFAULT 0,

  -- Errors
  errors JSONB DEFAULT '[]'::jsonb,
  error_count INTEGER DEFAULT 0,

  -- Triggered by
  triggered_by TEXT, -- 'cron', 'manual', 'webhook', 'system'
  triggered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_so_sync_logs_status ON smartoffice_sync_logs(status);
CREATE INDEX idx_so_sync_logs_started ON smartoffice_sync_logs(started_at DESC);
CREATE INDEX idx_so_sync_logs_type ON smartoffice_sync_logs(sync_type);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get SmartOffice config
CREATE OR REPLACE FUNCTION get_smartoffice_config()
RETURNS smartoffice_sync_config
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config smartoffice_sync_config;
BEGIN
  SELECT * INTO config FROM smartoffice_sync_config LIMIT 1;
  RETURN config;
END;
$$;

-- Function to update last sync time
CREATE OR REPLACE FUNCTION update_smartoffice_last_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE smartoffice_sync_config
  SET
    last_sync_at = NOW(),
    next_sync_at = NOW() + (sync_frequency_hours || ' hours')::interval,
    updated_at = NOW()
  WHERE true;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE smartoffice_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all SmartOffice tables
-- (Using service role for sync operations)

CREATE POLICY "Admin can read sync config"
  ON smartoffice_sync_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can update sync config"
  ON smartoffice_sync_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can insert sync config"
  ON smartoffice_sync_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can read smartoffice agents"
  ON smartoffice_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can read smartoffice commissions"
  ON smartoffice_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can read smartoffice policies"
  ON smartoffice_policies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

CREATE POLICY "Admin can read sync logs"
  ON smartoffice_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.user_id = auth.uid()
      AND a.rank IN ('national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Service role bypass for sync operations
-- (Handled by Supabase service role key)
