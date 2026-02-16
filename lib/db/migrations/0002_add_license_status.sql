-- Migration: Add license_status to distributors table
-- Created: 2026-02-16
-- Description: Add license_status field to track whether distributor is a licensed agent or new to insurance

-- Create enum for license status
CREATE TYPE license_status AS ENUM ('licensed', 'not_licensed');

-- Add license_status column to distributors table
ALTER TABLE distributors
ADD COLUMN license_status license_status;

-- Add comment to the column
COMMENT ON COLUMN distributors.license_status IS 'Whether the distributor is a licensed insurance agent or new to insurance';
