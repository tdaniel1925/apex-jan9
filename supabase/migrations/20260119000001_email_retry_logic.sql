-- Migration: Email Queue Retry Logic
-- Phase 2 - Issue #13: Add retry mechanism for failed emails
-- Created: 2026-01-19

-- =============================================================================
-- ADD RETRY COLUMNS TO EMAIL QUEUE (including updated_at first)
-- =============================================================================

-- Add updated_at column first (needed by trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_email_queue' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE lead_email_queue ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Add retry-related columns
ALTER TABLE lead_email_queue
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS permanent_failure BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN lead_email_queue.retry_count IS 'Number of send attempts made';
COMMENT ON COLUMN lead_email_queue.max_retries IS 'Maximum retry attempts before permanent failure';
COMMENT ON COLUMN lead_email_queue.next_retry_at IS 'When to retry sending (exponential backoff)';
COMMENT ON COLUMN lead_email_queue.last_attempt_at IS 'Timestamp of last send attempt';
COMMENT ON COLUMN lead_email_queue.permanent_failure IS 'True if max retries exceeded (dead letter queue)';
COMMENT ON COLUMN lead_email_queue.updated_at IS 'Timestamp of last update (auto-updated by trigger)';

-- =============================================================================
-- UPDATE STATUS CHECK CONSTRAINT
-- =============================================================================

-- Drop existing constraint
ALTER TABLE lead_email_queue
DROP CONSTRAINT IF EXISTS lead_email_queue_status_check;

-- Add new constraint with 'retrying' status
ALTER TABLE lead_email_queue
ADD CONSTRAINT lead_email_queue_status_check
CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'retrying'));

-- =============================================================================
-- CREATE INDEX FOR RETRY PROCESSING
-- =============================================================================

-- Index for finding emails due for retry
CREATE INDEX IF NOT EXISTS idx_lead_email_queue_retry
ON lead_email_queue(next_retry_at, retry_count)
WHERE status = 'retrying' AND permanent_failure = false;

-- Index for dead letter queue queries
CREATE INDEX IF NOT EXISTS idx_lead_email_queue_dead_letter
ON lead_email_queue(permanent_failure, updated_at)
WHERE permanent_failure = true;

-- =============================================================================
-- CREATE TRIGGER FOR updated_at
-- =============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_lead_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_lead_email_queue_updated_at ON lead_email_queue;

CREATE TRIGGER trigger_lead_email_queue_updated_at
  BEFORE UPDATE ON lead_email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_email_queue_updated_at();

-- =============================================================================
-- HELPER FUNCTION: Calculate next retry time with exponential backoff
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_email_retry_time(attempt_number INTEGER)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  base_delay_minutes INTEGER := 5;  -- Start with 5 minutes
  max_delay_minutes INTEGER := 1440; -- Cap at 24 hours
  delay_minutes INTEGER;
BEGIN
  -- Exponential backoff: 5min, 15min, 45min, 135min (2.25hrs), ...
  delay_minutes := base_delay_minutes * (3 ^ (attempt_number - 1));

  -- Cap at max delay
  IF delay_minutes > max_delay_minutes THEN
    delay_minutes := max_delay_minutes;
  END IF;

  RETURN NOW() + (delay_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_email_retry_time(INTEGER) IS 'Calculate next retry time using exponential backoff (5min, 15min, 45min, ...)';

-- =============================================================================
-- MIGRATION: Update existing failed emails for retry
-- =============================================================================

-- Reset failed emails to be eligible for retry (if not too old)
UPDATE lead_email_queue
SET
  status = 'retrying',
  next_retry_at = calculate_email_retry_time(1),
  retry_count = 0,
  permanent_failure = false
WHERE
  status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'  -- Only retry recent failures
  AND error_message NOT LIKE '%Invalid email%' -- Skip invalid emails
  AND error_message NOT LIKE '%bounce%'        -- Skip bounced emails
  AND error_message NOT LIKE '%unsubscribe%';  -- Skip unsubscribed

-- Mark very old failures as permanent
UPDATE lead_email_queue
SET permanent_failure = true
WHERE
  status = 'failed'
  AND created_at <= NOW() - INTERVAL '7 days';
