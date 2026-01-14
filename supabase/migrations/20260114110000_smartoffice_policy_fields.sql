-- Add additional policy fields to smartoffice_policies table
-- These fields store more detailed policy information from SmartOffice

ALTER TABLE smartoffice_policies
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS effective_date DATE,
ADD COLUMN IF NOT EXISTS writing_agent_id TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_smartoffice_policies_status ON smartoffice_policies(status);
CREATE INDEX IF NOT EXISTS idx_smartoffice_policies_issue_date ON smartoffice_policies(issue_date);
