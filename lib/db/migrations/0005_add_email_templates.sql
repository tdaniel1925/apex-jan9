-- Migration: Email Templates Storage
-- Created: 2026-02-16
-- Description: Allow admins to customize email templates

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  template_type TEXT NOT NULL, -- 'welcome', 'drip_newcomer', 'drip_licensed'
  step INTEGER, -- NULL for welcome, 1-20 for drip emails

  -- Email content
  subject TEXT NOT NULL,
  preview_text TEXT NOT NULL,
  heading TEXT NOT NULL,
  paragraphs JSONB NOT NULL, -- Array of paragraph strings
  tips JSONB, -- Optional array of tips
  call_to_action JSONB, -- Optional {text, url}

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique templates
  CONSTRAINT unique_template UNIQUE (template_type, step)
);

-- Indexes
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- Comments
COMMENT ON TABLE email_templates IS 'Custom email template overrides for drip campaign';
COMMENT ON COLUMN email_templates.template_type IS 'Type of email: welcome, drip_newcomer, or drip_licensed';
COMMENT ON COLUMN email_templates.step IS 'Email step number (1-20) for drip emails, NULL for welcome';
COMMENT ON COLUMN email_templates.paragraphs IS 'JSON array of paragraph text strings';
COMMENT ON COLUMN email_templates.tips IS 'Optional JSON array of tip strings for bullet points';
COMMENT ON COLUMN email_templates.call_to_action IS 'Optional JSON object with {text: string, url: string}';
