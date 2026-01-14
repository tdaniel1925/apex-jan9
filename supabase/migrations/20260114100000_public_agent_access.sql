-- ============================================
-- PUBLIC ACCESS FOR REPLICATED SITES
-- ============================================
-- Allow public (anonymous) users to view agent profiles
-- This is needed for /team/[username] and /join/[agentCode] pages
-- which are public-facing replicated sites

-- Allow anyone to read agents (for public replicated sites)
-- Note: Sensitive fields like tax_id should never be selected in public queries
CREATE POLICY "Public can view agents for replicated sites"
  ON agents FOR SELECT
  TO anon, authenticated
  USING (
    -- Only show agents with active-ish status that can have replicated sites
    status IN ('active', 'pending')
  );

-- Note: The application should only SELECT necessary public fields:
-- first_name, last_name, username, agent_code, avatar_url, bio, rank, etc.
-- Sensitive fields like tax_id, personal email details should NOT be selected
-- in public-facing queries even though RLS allows row access.
