-- Migration: Certificate Generation Limits
-- Phase 2 - Issue #27: Prevent infinite certificate regeneration
-- Created: 2026-01-19

-- =============================================================================
-- CERTIFICATE GENERATION LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS certificate_generation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('initial', 'regenerate', 'download')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE certificate_generation_log IS 'Track certificate generation to prevent abuse (Phase 2 Fix - Issue #27)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cert_gen_log_cert_id ON certificate_generation_log(certificate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cert_gen_log_agent_id ON certificate_generation_log(agent_id, created_at DESC);

-- =============================================================================
-- RATE LIMITING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION check_certificate_generation_limit(
  p_agent_id UUID,
  p_certificate_id UUID
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  regenerations_today INTEGER,
  daily_limit INTEGER
) AS $$
DECLARE
  regenerations_count INTEGER;
  max_regenerations INTEGER := 5; -- Max 5 regenerations per day per certificate
BEGIN
  -- Count regenerations in last 24 hours
  SELECT COUNT(*) INTO regenerations_count
  FROM certificate_generation_log
  WHERE agent_id = p_agent_id
    AND certificate_id = p_certificate_id
    AND generation_type = 'regenerate'
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Check if exceeded limit
  IF regenerations_count >= max_regenerations THEN
    RETURN QUERY SELECT
      FALSE,
      'Daily regeneration limit reached. Please contact support if you need additional copies.',
      regenerations_count,
      max_regenerations;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    'Certificate generation allowed',
    regenerations_count,
    max_regenerations;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_certificate_generation_limit IS 'Check if agent can generate/regenerate certificate';

-- =============================================================================
-- LOG CERTIFICATE GENERATION
-- =============================================================================

CREATE OR REPLACE FUNCTION log_certificate_generation(
  p_certificate_id UUID,
  p_agent_id UUID,
  p_generation_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO certificate_generation_log (
    certificate_id,
    agent_id,
    generation_type,
    ip_address,
    user_agent
  )
  VALUES (
    p_certificate_id,
    p_agent_id,
    p_generation_type,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_certificate_generation IS 'Log certificate generation event';

-- =============================================================================
-- VIEW: Certificate Generation Stats
-- =============================================================================

CREATE OR REPLACE VIEW certificate_generation_stats AS
SELECT
  c.id as certificate_id,
  c.agent_id,
  a.first_name,
  a.last_name,
  a.email,
  c.course_id,
  COUNT(*) FILTER (WHERE cgl.generation_type = 'initial') as initial_generations,
  COUNT(*) FILTER (WHERE cgl.generation_type = 'regenerate') as regenerations,
  COUNT(*) FILTER (WHERE cgl.generation_type = 'download') as downloads,
  MAX(cgl.created_at) as last_generated_at
FROM certificates c
JOIN agents a ON c.agent_id = a.id
LEFT JOIN certificate_generation_log cgl ON c.id = cgl.certificate_id
GROUP BY c.id, c.agent_id, a.first_name, a.last_name, a.email, c.course_id;

COMMENT ON VIEW certificate_generation_stats IS 'Summary of certificate generation activity';

-- =============================================================================
-- ADD WATERMARK TO CERTIFICATES TABLE
-- =============================================================================

-- Add watermark/unique identifier to prevent forgery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates'
    AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE certificates
    ADD COLUMN verification_code TEXT UNIQUE;

    COMMENT ON COLUMN certificates.verification_code IS 'Unique code to verify certificate authenticity';
  END IF;
END $$;

-- Generate verification codes for existing certificates
UPDATE certificates
SET verification_code = 'CERT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 12))
WHERE verification_code IS NULL;

-- =============================================================================
-- VERIFICATION ENDPOINT HELPER
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_certificate(p_verification_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  agent_name TEXT,
  certificate_title TEXT,
  issued_date TIMESTAMPTZ,
  certificate_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as valid,
    (a.first_name || ' ' || a.last_name) as agent_name,
    c.title as certificate_title,
    c.issued_at as issued_date,
    c.id as certificate_id
  FROM certificates c
  JOIN agents a ON c.agent_id = a.id
  WHERE c.verification_code = p_verification_code;

  -- If no rows, return invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE as valid,
      NULL::TEXT as agent_name,
      NULL::TEXT as certificate_title,
      NULL::TIMESTAMPTZ as issued_date,
      NULL::UUID as certificate_id;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION verify_certificate IS 'Verify certificate authenticity by verification code';
