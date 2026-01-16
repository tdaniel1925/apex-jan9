-- ============================================
-- EMAIL BRANDING SETTINGS
-- Stores customizable header and footer logos for email templates
-- ============================================

-- Email branding settings table (singleton - only one row)
CREATE TABLE IF NOT EXISTS email_branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_logo_url TEXT DEFAULT '/images/logo.png',
  header_logo_width INTEGER DEFAULT 200,
  footer_logo_url TEXT DEFAULT '/images/logo-w.png',
  footer_logo_width INTEGER DEFAULT 150,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- Insert default settings if not exists
INSERT INTO email_branding_settings (id, header_logo_url, footer_logo_url)
SELECT gen_random_uuid(), '/images/logo.png', '/images/logo-w.png'
WHERE NOT EXISTS (SELECT 1 FROM email_branding_settings);

-- RLS Policies
ALTER TABLE email_branding_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update
DROP POLICY IF EXISTS "Admins can manage email branding" ON email_branding_settings;
CREATE POLICY "Admins can manage email branding" ON email_branding_settings
  FOR ALL USING (true);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_email_branding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_branding_updated_at ON email_branding_settings;
CREATE TRIGGER email_branding_updated_at
  BEFORE UPDATE ON email_branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_branding_timestamp();
