-- Email Templates Migration
-- Manages email templates for company and replicated websites

-- Email template categories
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category email_template_category NOT NULL DEFAULT 'system',
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  for_replicated_site BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Email template versions for history
CREATE TABLE IF NOT EXISTS email_template_versions (
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

CREATE INDEX IF NOT EXISTS idx_template_versions_template ON email_template_versions(template_id);

-- Email send logs
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_slug TEXT,
  recipient_email TEXT NOT NULL,
  recipient_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_send_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_send_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_send_logs(sent_at);

-- Delete existing templates to re-insert with updated branding
DELETE FROM email_templates WHERE is_system = true;

-- Insert email templates with proper branding
-- Header: White background with colored logo
-- Footer: Dark background (#1e3a5f) with white logo

INSERT INTO email_templates (name, slug, category, subject, preview_text, html_content, text_content, variables, is_system, for_replicated_site) VALUES

-- =============================================
-- WELCOME EMAIL
-- =============================================
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
    <!-- Header with Colored Logo on White Background -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
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
    <!-- Footer with White Logo on Dark Background -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
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

Your sponsor, {{sponsor_name}}, is here to help you succeed.

Best regards,
The Apex Affinity Group Team

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478

© {{current_year}} Apex Affinity Group. All rights reserved.',
  '["first_name", "last_name", "agent_code", "sponsor_name", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- COMMISSION NOTIFICATION
-- =============================================
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
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">💰 Commission Payment Processed</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Great news! A commission payment of <strong style="color: #28a745; font-size: 24px;">{{amount}}</strong> has been processed.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px;">
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; color: #666;">Policy Number:</td>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; font-weight: bold; text-align: right;">{{policy_number}}</td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; color: #666;">Carrier:</td>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; font-weight: bold; text-align: right;">{{carrier}}</td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; color: #666;">Premium:</td>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e9ecef; font-weight: bold; text-align: right;">{{premium}}</td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; color: #666;">Payment Date:</td>
            <td style="padding: 15px 20px; font-weight: bold; text-align: right;">{{payment_date}}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/wallet" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Wallet</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
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
  '["first_name", "amount", "policy_number", "carrier", "premium", "payment_date", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- REPLICATED SITE LEAD NOTIFICATION
-- =============================================
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
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🎉 New Lead!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          {{first_name}}, you have a new lead from your replicated website!
        </p>
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="color: #1e3a5f; margin: 0 0 15px;">Lead Details</h3>
          <p style="margin: 8px 0; color: #333;"><strong>Name:</strong> {{lead_name}}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> <a href="mailto:{{lead_email}}" style="color: #0ea5e9;">{{lead_email}}</a></p>
          <p style="margin: 8px 0; color: #333;"><strong>Phone:</strong> <a href="tel:{{lead_phone}}" style="color: #0ea5e9;">{{lead_phone}}</a></p>
          <p style="margin: 8px 0; color: #333;"><strong>Interest:</strong> {{lead_interest}}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          ⏰ <strong>Follow up quickly</strong> - the best time to connect is now!
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/leads" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View All Leads</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
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
  '["first_name", "lead_name", "lead_email", "lead_phone", "lead_interest", "dashboard_url", "base_url", "current_year"]',
  true,
  true
),

-- =============================================
-- PASSWORD RESET
-- =============================================
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
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🔐 Reset Your Password</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{reset_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; background-color: #fff3cd; padding: 15px; border-radius: 5px;">
          ⚠️ This link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
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
  '["first_name", "reset_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- RANK ADVANCEMENT
-- =============================================
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
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Celebration Banner -->
    <tr>
      <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; text-align: center;">
        <span style="font-size: 48px;">🎉🏆🎉</span>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px; text-align: center;">Congratulations!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          We''re excited to announce that you''ve been promoted to:
        </p>
        <p style="text-align: center; margin: 25px 0;">
          <span style="background-color: #c41e3a; color: #ffffff; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block;">{{new_rank}}</span>
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          This achievement reflects your hard work, dedication, and commitment to excellence. Here''s what your new rank unlocks:
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>✅ Increased commission rates</li>
          <li>✅ Enhanced override structures</li>
          <li>✅ New leadership opportunities</li>
          <li>✅ Exclusive training resources</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Dashboard</a>
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; text-align: center;">
          Keep up the great work! 🚀
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
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
  '["first_name", "new_rank", "previous_rank", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- NEW TEAM MEMBER NOTIFICATION
-- =============================================
(
  'New Team Member Notification',
  'new-team-member',
  'team',
  'New Team Member: {{new_agent_name}} has joined your team!',
  'A new agent has joined your downline',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">👋 New Team Member!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Great news! A new agent has joined your team:
        </p>
        <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; text-align: center;">
          <p style="margin: 0 0 10px; font-size: 24px; font-weight: bold; color: #1e3a5f;">{{new_agent_name}}</p>
          <p style="margin: 0; color: #666;">{{new_agent_email}}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          <strong>What to do next:</strong>
        </p>
        <ul style="color: #333; font-size: 16px; line-height: 1.8;">
          <li>📞 Reach out to welcome them personally</li>
          <li>📚 Share your onboarding resources</li>
          <li>🎯 Schedule a kickoff call</li>
          <li>💬 Add them to your team chat</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/team" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Team</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'New Team Member: {{new_agent_name}} has joined your team!

Hi {{first_name}},

Great news! A new agent has joined your team:

Name: {{new_agent_name}}
Email: {{new_agent_email}}

What to do next:
- Reach out to welcome them personally
- Share your onboarding resources
- Schedule a kickoff call
- Add them to your team chat

View your team: {{dashboard_url}}/team

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "new_agent_name", "new_agent_email", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- BONUS EARNED NOTIFICATION
-- =============================================
(
  'Bonus Earned Notification',
  'bonus-earned',
  'commissions',
  'Bonus Earned: {{bonus_type}} - {{amount}}',
  'You''ve earned a bonus',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🎁 Bonus Earned!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Congratulations! You''ve earned a bonus:
        </p>
        <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; text-transform: uppercase; font-weight: bold;">{{bonus_type}}</p>
          <p style="margin: 0; color: #1e3a5f; font-size: 36px; font-weight: bold;">{{amount}}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          {{bonus_description}}
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/wallet" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Wallet</a>
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Keep up the excellent work!
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Bonus Earned: {{bonus_type}} - {{amount}}

Dear {{first_name}},

Congratulations! You''ve earned a bonus:

Type: {{bonus_type}}
Amount: {{amount}}

{{bonus_description}}

View your wallet: {{dashboard_url}}/wallet

Keep up the excellent work!

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "bonus_type", "amount", "bonus_description", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- TRAINING COMPLETION
-- =============================================
(
  'Training Completion',
  'training-completed',
  'onboarding',
  'Course Completed: {{course_name}}',
  'You''ve completed a training course',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🎓 Course Completed!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Congratulations {{first_name}}!
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          You''ve successfully completed:
        </p>
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #0ea5e9;">
          <p style="margin: 0; color: #1e3a5f; font-size: 20px; font-weight: bold;">{{course_name}}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; color: #666;">Quiz Score:</td>
            <td style="padding: 10px; font-weight: bold; text-align: right; color: #22c55e;">{{quiz_score}}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #666;">Completion Date:</td>
            <td style="padding: 10px; font-weight: bold; text-align: right;">{{completion_date}}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/training" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Continue Training</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Course Completed: {{course_name}}

Congratulations {{first_name}}!

You''ve successfully completed: {{course_name}}

Quiz Score: {{quiz_score}}%
Completion Date: {{completion_date}}

Continue your training: {{dashboard_url}}/training

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "course_name", "quiz_score", "completion_date", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- COMPLIANCE REMINDER
-- =============================================
(
  'Compliance Reminder',
  'compliance-reminder',
  'compliance',
  'Action Required: {{compliance_item}} expires in {{days_remaining}} days',
  'Your compliance item needs attention',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Alert Banner -->
    <tr>
      <td style="background-color: #fef2f2; padding: 20px; text-align: center; border-bottom: 1px solid #fecaca;">
        <span style="color: #dc2626; font-weight: bold;">⚠️ ACTION REQUIRED</span>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">Compliance Reminder</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your <strong>{{compliance_item}}</strong> expires in <strong style="color: #dc2626;">{{days_remaining}} days</strong>.
        </p>
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
          <p style="margin: 0; color: #9a3412; font-size: 14px;">
            <strong>Expiration Date:</strong> {{expiration_date}}
          </p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Please take action to ensure your compliance status remains active.
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/compliance" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Update Compliance</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Action Required: {{compliance_item}} expires in {{days_remaining}} days

Hi {{first_name}},

Your {{compliance_item}} expires in {{days_remaining}} days.

Expiration Date: {{expiration_date}}

Please take action to ensure your compliance status remains active.

Update compliance: {{dashboard_url}}/compliance

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "compliance_item", "days_remaining", "expiration_date", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- PAYOUT PROCESSED
-- =============================================
(
  'Payout Processed',
  'payout-processed',
  'commissions',
  'Your Payout of {{amount}} Has Been Processed',
  'Your payout has been sent',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">💵 Payout Processed!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your payout has been processed successfully!
        </p>
        <div style="background-color: #f0fdf4; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #22c55e;">
          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Amount</p>
          <p style="margin: 0; color: #22c55e; font-size: 36px; font-weight: bold;">{{amount}}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #eee;">Payment Method:</td>
            <td style="padding: 12px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">{{payment_method}}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #666; border-bottom: 1px solid #eee;">Pay Period:</td>
            <td style="padding: 12px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">{{pay_period}}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #666;">Expected Arrival:</td>
            <td style="padding: 12px 0; font-weight: bold; text-align: right;">{{expected_arrival}}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}/wallet" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Wallet</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Your Payout of {{amount}} Has Been Processed

Hi {{first_name}},

Your payout has been processed successfully!

Amount: {{amount}}
Payment Method: {{payment_method}}
Pay Period: {{pay_period}}
Expected Arrival: {{expected_arrival}}

View your wallet: {{dashboard_url}}/wallet

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "amount", "payment_method", "pay_period", "expected_arrival", "dashboard_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- ADMIN MAGIC LINK LOGIN
-- =============================================
(
  'Admin Magic Link Login',
  'admin-magic-link',
  'system',
  'Your Admin Login Link',
  'Sign in to the Apex Admin Portal',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">🔐 Admin Portal Login</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Click the button below to sign in to the Admin Portal:
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{magic_link_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In to Admin Portal</a>
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          🔒 This link will expire in 15 minutes and can only be used once. If you didn''t request this, please ignore this email.
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Admin Portal Login

Hi {{first_name}},

Click the link below to sign in to the Admin Portal:

{{magic_link_url}}

This link will expire in 15 minutes and can only be used once.

If you didn''t request this, please ignore this email.

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "magic_link_url", "base_url", "current_year"]',
  true,
  false
),

-- =============================================
-- WEEKLY SUMMARY
-- =============================================
(
  'Weekly Summary',
  'weekly-summary',
  'notifications',
  'Your Weekly Summary - {{week_of}}',
  'Your performance summary for the week',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Colored Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #c41e3a;">
        <img src="{{base_url}}/images/logo.png" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">📊 Weekly Summary</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hi {{first_name}}, here''s your performance summary for {{week_of}}:
        </p>

        <!-- Stats Grid -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0fdf4; border-radius: 8px 0 0 0;">
              <p style="margin: 0 0 5px; font-size: 24px; font-weight: bold; color: #22c55e;">{{total_commissions}}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Commissions</p>
            </td>
            <td style="padding: 20px; text-align: center; background-color: #fef3c7; border-radius: 0 8px 0 0;">
              <p style="margin: 0 0 5px; font-size: 24px; font-weight: bold; color: #f59e0b;">{{policies_written}}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Policies</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f9ff; border-radius: 0 0 0 8px;">
              <p style="margin: 0 0 5px; font-size: 24px; font-weight: bold; color: #0ea5e9;">{{new_leads}}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">New Leads</p>
            </td>
            <td style="padding: 20px; text-align: center; background-color: #fdf4ff; border-radius: 0 0 8px 0;">
              <p style="margin: 0 0 5px; font-size: 24px; font-weight: bold; color: #a855f7;">{{team_growth}}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Team Growth</p>
            </td>
          </tr>
        </table>

        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Dashboard</a>
        </p>
      </td>
    </tr>
    <!-- Footer with White Logo -->
    <tr>
      <td style="padding: 30px 40px; background-color: #1e3a5f; text-align: center;">
        <img src="{{base_url}}/images/logo-w.png" alt="Apex Affinity Group" style="max-width: 150px; height: auto; margin-bottom: 15px;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;">
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Your Weekly Summary - {{week_of}}

Hi {{first_name}}, here''s your performance summary for {{week_of}}:

Commissions: {{total_commissions}}
Policies Written: {{policies_written}}
New Leads: {{new_leads}}
Team Growth: {{team_growth}}

View full dashboard: {{dashboard_url}}

---
Apex Affinity Group
1600 Highway 6 Ste 400
Sugar Land, TX 77478',
  '["first_name", "week_of", "total_commissions", "policies_written", "new_leads", "team_growth", "dashboard_url", "base_url", "current_year"]',
  true,
  false
);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage template versions" ON email_template_versions;
DROP POLICY IF EXISTS "Admins can view email logs" ON email_send_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON email_send_logs;

-- Recreate policies
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (true);

CREATE POLICY "Admins can manage template versions" ON email_template_versions
  FOR ALL USING (true);

CREATE POLICY "Admins can view email logs" ON email_send_logs
  FOR SELECT USING (true);

CREATE POLICY "System can insert email logs" ON email_send_logs
  FOR INSERT WITH CHECK (true);
