-- Setup Script: Four Horsemen
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Convert mike.davis to apex-vision
-- ============================================

UPDATE distributors
SET
  username = 'apex-vision',
  first_name = 'The Apex',
  last_name = 'Vision',
  email = 'vision@apexaffinitygroup.com',
  business_name = 'The Apex Vision',
  display_preference = 'business',
  auth_user_id = NULL, -- Will be handled by founder_logins
  updated_at = NOW()
WHERE username = 'mike.davis';

-- ============================================
-- STEP 2: Get the distributor ID (for reference)
-- ============================================

DO $$
DECLARE
  v_distributor_id UUID;
BEGIN
  SELECT id INTO v_distributor_id
  FROM distributors
  WHERE username = 'apex-vision';

  RAISE NOTICE 'Apex Vision Distributor ID: %', v_distributor_id;
END $$;

-- ============================================
-- STEP 3: Create founder member for Shell Hall
-- ============================================

-- First, create auth user for Shell Hall in Supabase Auth Dashboard:
-- Email: shall@botmakers.ai
-- Password: (your choice)
-- Then get the auth_user_id and use it below

-- INSERT founder member (uncomment and add auth_user_id after creating Shell's auth account)
/*
INSERT INTO founder_members (
  distributor_id,
  first_name,
  last_name,
  email,
  commission_percentage,
  is_active
)
VALUES (
  (SELECT id FROM distributors WHERE username = 'apex-vision'),
  'Shell',
  'Hall',
  'shall@botmakers.ai',
  25,
  true
)
RETURNING id, first_name, last_name, email;

-- Link auth user to founder member (replace AUTH_USER_ID with Shell's actual auth ID)
INSERT INTO founder_logins (
  founder_member_id,
  auth_user_id
)
VALUES (
  (SELECT id FROM founder_members WHERE email = 'shall@botmakers.ai'),
  'AUTH_USER_ID_HERE'
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check distributor
SELECT
  id,
  username,
  first_name,
  last_name,
  email,
  business_name,
  display_preference
FROM distributors;

-- Check founders (after you add them)
SELECT
  id,
  first_name,
  last_name,
  email,
  commission_percentage,
  is_active
FROM founder_members;

-- Check founder logins (after you add them)
SELECT
  fl.id,
  fm.first_name,
  fm.last_name,
  fm.email,
  fl.auth_user_id
FROM founder_logins fl
JOIN founder_members fm ON fl.founder_member_id = fm.id;
