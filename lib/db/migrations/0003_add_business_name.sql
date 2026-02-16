-- Migration: Add business_name and display_preference to distributors table
-- Created: 2026-02-16
-- Description: Allow distributors to have a business name and choose how to display it on their replicated site

-- Create enum for display preference
CREATE TYPE display_preference AS ENUM ('personal', 'business', 'both');

-- Add business_name column
ALTER TABLE distributors
ADD COLUMN business_name text;

-- Add display_preference column
ALTER TABLE distributors
ADD COLUMN display_preference display_preference NOT NULL DEFAULT 'personal';

-- Add comments
COMMENT ON COLUMN distributors.business_name IS 'Optional business name for the distributor';
COMMENT ON COLUMN distributors.display_preference IS 'How to display name on replicated site: personal name, business name, or both';
