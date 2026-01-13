-- Admin Magic Link Authentication
-- Enables passwordless login for admin users via email magic links

-- ============================================
-- MAGIC LINK TOKENS TABLE
-- ============================================
CREATE TABLE admin_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX idx_admin_magic_links_token ON admin_magic_links(token_hash);
CREATE INDEX idx_admin_magic_links_email ON admin_magic_links(email);
CREATE INDEX idx_admin_magic_links_expires ON admin_magic_links(expires_at);

-- Clean up used or expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_magic_links
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE admin_magic_links ENABLE ROW LEVEL SECURITY;

-- Only allow system operations (via service role)
CREATE POLICY "Admin magic links are managed by system only"
  ON admin_magic_links
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE admin_magic_links IS 'Magic link tokens for passwordless admin authentication';
COMMENT ON COLUMN admin_magic_links.token_hash IS 'SHA-256 hash of the magic link token';
COMMENT ON COLUMN admin_magic_links.used_at IS 'When the token was used (NULL if unused)';
