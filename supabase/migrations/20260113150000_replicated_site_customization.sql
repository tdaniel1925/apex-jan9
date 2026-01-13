-- ============================================
-- REPLICATED SITE CUSTOMIZATION
-- Adds more customization options for agent replicated sites
-- ============================================

-- Add site customization columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS site_headline TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS site_cta_text TEXT DEFAULT 'Join My Team';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS site_primary_color TEXT;  -- Hex color like #0ea5e9
ALTER TABLE agents ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT true;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT true;

-- Social media links
ALTER TABLE agents ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS social_tiktok TEXT;

-- Update the updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_replicated_site_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agents table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'agents_replicated_updated_at'
  ) THEN
    CREATE TRIGGER agents_replicated_updated_at
      BEFORE UPDATE OF site_headline, site_cta_text, site_primary_color,
                       show_phone, show_email, social_facebook, social_instagram,
                       social_linkedin, social_youtube, social_tiktok, bio
      ON agents
      FOR EACH ROW
      EXECUTE FUNCTION update_replicated_site_timestamp();
  END IF;
END
$$;
