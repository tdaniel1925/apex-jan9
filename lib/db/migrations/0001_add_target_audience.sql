-- Migration: Add target_audience to distributors table
-- Created: 2026-02-16
-- Purpose: Allow distributors to specify their target recruitment audience

-- Create enum type for target audience
CREATE TYPE target_audience AS ENUM ('agents', 'newcomers', 'both');

-- Add target_audience column to distributors table
ALTER TABLE distributors
ADD COLUMN target_audience target_audience NOT NULL DEFAULT 'both';

-- Create index for potential filtering/reporting
CREATE INDEX idx_distributors_target_audience ON distributors(target_audience);

-- Add comment for documentation
COMMENT ON COLUMN distributors.target_audience IS 'Specifies the primary audience this distributor recruits: licensed agents, newcomers to insurance, or both';
