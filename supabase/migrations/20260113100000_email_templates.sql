-- Email Templates Migration
-- Manages email templates for company and replicated websites

-- Email template categories
CREATE TYPE email_template_category AS ENUM (
  'welcome',
  'onboarding',
  'commissions',
  'notifications',
  'marketing',
  'team',
  'compliance',
  'system'
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category email_template_category NOT NULL DEFAULT 'system',
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]', -- Array of variable names like ["first_name", "agent_code"]
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System templates cannot be deleted
  for_replicated_site BOOLEAN DEFAULT false, -- Template for agent replicated websites
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_email_templates_slug ON email_templates(slug);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- Email template versions for history
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX idx_template_versions_template ON email_template_versions(template_id);

-- Email send logs
CREATE TABLE email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_slug TEXT,
  recipient_email TEXT NOT NULL,
  recipient_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, bounced, failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_template ON email_send_logs(template_id);
CREATE INDEX idx_email_logs_recipient ON email_send_logs(recipient_email);
CREATE INDEX idx_email_logs_sent_at ON email_send_logs(sent_at);

-- Insert default email templates
INSERT INTO email_templates (name, slug, category, subject, preview_text, html_content, text_content, variables, is_system, for_replicated_site) VALUES
(
  'Welcome Email',
  'welcome-new-agent',
  'welcome',
  'Welcome to Apex Affinity Group, {{first_name}}!',
  'Start your journey with Apex Affinity Group',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">Welcome to Apex Affinity Group!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We''re thrilled to have you join the Apex Affinity Group family! Your agent code is <strong>{{agent_code}}</strong>.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          As a new member, you now have access to:
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Top-tier insurance carriers</li>
          <li>Industry-leading commission structures</li>
          <li>Comprehensive training resources</li>
          <li>AI-powered sales tools</li>
        </ul>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Log in to your dashboard to get started:
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Your Dashboard</a>
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your sponsor, {{sponsor_name}}, is here to help you succeed. Don''t hesitate to reach out!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Best regards,<br>
          The Apex Affinity Group Team
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Welcome to Apex Affinity Group, {{first_name}}!

We''re thrilled to have you join the Apex Affinity Group family! Your agent code is {{agent_code}}.

As a new member, you now have access to:
- Top-tier insurance carriers
- Industry-leading commission structures
- Comprehensive training resources
- AI-powered sales tools

Log in to your dashboard to get started: {{dashboard_url}}

Your sponsor, {{sponsor_name}}, is here to help you succeed. Don''t hesitate to reach out!

Best regards,
The Apex Affinity Group Team

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478

© {{current_year}} Apex Affinity Group. All rights reserved.',
  '["first_name", "last_name", "agent_code", "sponsor_name", "dashboard_url", "logo_url", "current_year"]',
  true,
  false
),
(
  'Commission Notification',
  'commission-paid',
  'commissions',
  'Commission Payment: {{amount}} has been processed',
  'Your commission payment has been processed',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">Commission Payment Processed</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Great news! A commission payment of <strong style="color: #28a745; font-size: 20px;">{{amount}}</strong> has been processed.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Policy Number:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">{{policy_number}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Carrier:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">{{carrier}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Premium:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">{{premium}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #666;">Payment Date:</td>
            <td style="padding: 10px; font-weight: bold;">{{payment_date}}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/wallet" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Wallet</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Commission Payment: {{amount}} has been processed

Dear {{first_name}},

Great news! A commission payment of {{amount}} has been processed.

Policy Number: {{policy_number}}
Carrier: {{carrier}}
Premium: {{premium}}
Payment Date: {{payment_date}}

View your wallet: {{dashboard_url}}/wallet

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "amount", "policy_number", "carrier", "premium", "payment_date", "dashboard_url", "logo_url", "current_year"]',
  true,
  false
),
(
  'Replicated Site Lead Notification',
  'replicated-site-lead',
  'notifications',
  'New Lead from Your Website: {{lead_name}}',
  'You have a new lead from your replicated website',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🎉 New Lead!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          {{first_name}}, you have a new lead from your replicated website!
        </p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e3a5f; margin: 0 0 15px;">Lead Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> {{lead_name}}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> {{lead_email}}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> {{lead_phone}}</p>
          <p style="margin: 5px 0;"><strong>Interest:</strong> {{lead_interest}}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Follow up quickly - the best time to connect is now!
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/leads" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View All Leads</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'New Lead from Your Website: {{lead_name}}

{{first_name}}, you have a new lead from your replicated website!

Lead Details:
Name: {{lead_name}}
Email: {{lead_email}}
Phone: {{lead_phone}}
Interest: {{lead_interest}}

Follow up quickly - the best time to connect is now!

View all leads: {{dashboard_url}}/leads

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "lead_name", "lead_email", "lead_phone", "lead_interest", "dashboard_url", "logo_url", "current_year"]',
  true,
  true
),
(
  'Password Reset',
  'password-reset',
  'system',
  'Reset Your Password',
  'Password reset request for your Apex account',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">Reset Your Password</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{reset_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Reset Your Password

Hi {{first_name}},

We received a request to reset your password. Click the link below to create a new password:

{{reset_url}}

This link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "reset_url", "logo_url", "current_year"]',
  true,
  false
),
(
  'Rank Advancement',
  'rank-advancement',
  'notifications',
  'Congratulations on Your Promotion to {{new_rank}}!',
  'You''ve been promoted to a new rank',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🎉 Congratulations!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We''re excited to announce that you''ve been promoted to <strong style="color: #c41e3a; font-size: 20px;">{{new_rank}}</strong>!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          This achievement reflects your hard work, dedication, and commitment to excellence. Here''s what your new rank unlocks:
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>Increased commission rates</li>
          <li>Enhanced override structures</li>
          <li>New leadership opportunities</li>
          <li>Exclusive training resources</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Dashboard</a>
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Keep up the great work!
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Congratulations on Your Promotion to {{new_rank}}!

Dear {{first_name}},

We''re excited to announce that you''ve been promoted to {{new_rank}}!

This achievement reflects your hard work, dedication, and commitment to excellence.

Your new rank unlocks:
- Increased commission rates
- Enhanced override structures
- New leadership opportunities
- Exclusive training resources

View your dashboard: {{dashboard_url}}

Keep up the great work!

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "new_rank", "previous_rank", "dashboard_url", "logo_url", "current_year"]',
  true,
  false
);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with templates
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (true);

CREATE POLICY "Admins can manage template versions" ON email_template_versions
  FOR ALL USING (true);

CREATE POLICY "Admins can view email logs" ON email_send_logs
  FOR SELECT USING (true);

CREATE POLICY "System can insert email logs" ON email_send_logs
  FOR INSERT WITH CHECK (true);
