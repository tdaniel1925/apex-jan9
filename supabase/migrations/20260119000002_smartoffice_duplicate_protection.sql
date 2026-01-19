-- Migration: SmartOffice Duplicate Protection
-- Phase 2 - Issue #18: Prevent duplicate commission imports from SmartOffice
-- Created: 2026-01-19

-- =============================================================================
-- FIX EXISTING DUPLICATES FIRST (before creating unique constraints)
-- =============================================================================

-- Handle any existing records with duplicate policy numbers
-- by appending the SmartOffice ID to make them unique
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  FOR duplicate_record IN
    SELECT policy_number, array_agg(id) as ids, array_agg(smartoffice_id) as so_ids
    FROM smartoffice_policies
    WHERE policy_number IS NOT NULL AND policy_number != ''
    GROUP BY policy_number
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first one as-is, append SO ID to others
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      UPDATE smartoffice_policies
      SET policy_number = duplicate_record.policy_number || '_' || duplicate_record.so_ids[i]
      WHERE id = duplicate_record.ids[i];
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- UNIQUE CONSTRAINTS TO PREVENT DUPLICATES
-- =============================================================================

-- Ensure policy numbers in smartoffice_policies are unique (prevent double-import)
CREATE UNIQUE INDEX IF NOT EXISTS idx_smartoffice_policies_policy_number_unique
ON smartoffice_policies(policy_number)
WHERE policy_number IS NOT NULL AND policy_number != '';

COMMENT ON INDEX idx_smartoffice_policies_policy_number_unique IS 'Prevents duplicate SmartOffice policy imports';

-- Ensure we don't import the same SmartOffice commission to Apex multiple times
-- (A SmartOffice commission can only map to one Apex commission)
CREATE UNIQUE INDEX IF NOT EXISTS idx_smartoffice_commissions_apex_unique
ON smartoffice_commissions(apex_commission_id)
WHERE apex_commission_id IS NOT NULL;

COMMENT ON INDEX idx_smartoffice_commissions_apex_unique IS 'Prevents a SmartOffice commission from being imported to Apex multiple times';

-- =============================================================================
-- ADD SYNC RUN TRACKING
-- =============================================================================

-- Add sync_run_id to track which sync created/updated each record
ALTER TABLE smartoffice_policies
ADD COLUMN IF NOT EXISTS sync_run_id UUID REFERENCES smartoffice_sync_logs(id) ON DELETE SET NULL;

ALTER TABLE smartoffice_commissions
ADD COLUMN IF NOT EXISTS sync_run_id UUID REFERENCES smartoffice_sync_logs(id) ON DELETE SET NULL;

ALTER TABLE smartoffice_agents
ADD COLUMN IF NOT EXISTS sync_run_id UUID REFERENCES smartoffice_sync_logs(id) ON DELETE SET NULL;

-- Create indexes for sync run queries
CREATE INDEX IF NOT EXISTS idx_smartoffice_policies_sync_run
ON smartoffice_policies(sync_run_id);

CREATE INDEX IF NOT EXISTS idx_smartoffice_commissions_sync_run
ON smartoffice_commissions(sync_run_id);

CREATE INDEX IF NOT EXISTS idx_smartoffice_agents_sync_run
ON smartoffice_agents(sync_run_id);

COMMENT ON COLUMN smartoffice_policies.sync_run_id IS 'Links to the sync run that created/updated this record';
COMMENT ON COLUMN smartoffice_commissions.sync_run_id IS 'Links to the sync run that created/updated this record';
COMMENT ON COLUMN smartoffice_agents.sync_run_id IS 'Links to the sync run that created/updated this record';

-- =============================================================================
-- HELPER FUNCTION: Check if SmartOffice commission already imported to Apex
-- =============================================================================

CREATE OR REPLACE FUNCTION is_smartoffice_commission_imported(
  p_smartoffice_commission_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_apex_commission_id UUID;
BEGIN
  SELECT apex_commission_id INTO v_apex_commission_id
  FROM smartoffice_commissions
  WHERE id = p_smartoffice_commission_id;

  RETURN v_apex_commission_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_smartoffice_commission_imported(UUID) IS 'Check if a SmartOffice commission has already been imported to Apex';

-- =============================================================================
-- HELPER FUNCTION: Get unmapped SmartOffice commissions
-- =============================================================================

CREATE OR REPLACE FUNCTION get_unmapped_smartoffice_commissions(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  smartoffice_id TEXT,
  policy_number TEXT,
  receivable DECIMAL,
  smartoffice_agent_id UUID,
  commission_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.smartoffice_id,
    sc.policy_number,
    sc.receivable,
    sc.smartoffice_agent_id,
    sc.commission_role
  FROM smartoffice_commissions sc
  WHERE sc.apex_commission_id IS NULL
    AND sc.receivable > 0
    AND EXISTS (
      SELECT 1 FROM smartoffice_agents sa
      WHERE sa.id = sc.smartoffice_agent_id
      AND sa.apex_agent_id IS NOT NULL
    )
  ORDER BY sc.payable_due_date ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unmapped_smartoffice_commissions(INTEGER) IS 'Get SmartOffice commissions that need to be imported to Apex';
