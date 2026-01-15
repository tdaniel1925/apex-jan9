-- Migration: Seed Drip Campaign Email Content
-- Creates the email sequences for both licensed and unlicensed agent campaigns

-- ============================================
-- LICENSED AGENT CAMPAIGN EMAILS
-- "Maximize Your Apex Opportunities"
-- ============================================

-- Email 1: Welcome (Day 1)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Welcome to Apex - Let''s Maximize Your Insurance Career',
  'Your experience + Apex''s platform = unlimited potential',
  1, 1, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Welcome to Apex, {{agentName}}!</h1>

  <p>As a licensed insurance professional, you already know the value of protecting families. Now let''s talk about maximizing YOUR potential.</p>

  <h2 style="color: #1a1a1a; font-size: 18px;">Why Licensed Agents Choose Apex:</h2>

  <ul style="padding-left: 20px;">
    <li><strong>Top carrier appointments</strong> - Access to 40+ A-rated carriers</li>
    <li><strong>Competitive commissions</strong> - Keep more of what you earn</li>
    <li><strong>Advanced technology</strong> - CRM, quoting tools, and AI assistance</li>
    <li><strong>Leadership opportunities</strong> - Build and lead your own team</li>
  </ul>

  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0369a1;">Your First Steps:</h3>
    <ol style="padding-left: 20px; margin-bottom: 0;">
      <li>Complete your agent profile</li>
      <li>Submit your carrier appointments</li>
      <li>Explore the training center</li>
      <li>Connect with your sponsor</li>
    </ol>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Go to Your Dashboard</a>
  </div>

  <p>Tomorrow, I''ll share how to fast-track your carrier appointments.</p>

  <p>To your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 2: Carrier Appointments (Day 3)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Get Appointed with Top Carriers - Here''s How',
  'Your step-by-step guide to carrier appointments',
  2, 2, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Let''s Get You Appointed, {{agentName}}</h1>

  <p>Carrier appointments are your gateway to earning. Here''s the fastest path to getting contracted:</p>

  <h2 style="color: #1a1a1a; font-size: 18px;">Priority Carriers for New Apex Agents:</h2>

  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0;"><strong>National Life Group</strong></td>
        <td style="padding: 8px 0; text-align: right;">IUL Specialists</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-top: 1px solid #ddd;"><strong>Mutual of Omaha</strong></td>
        <td style="padding: 8px 0; border-top: 1px solid #ddd; text-align: right;">Final Expense</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-top: 1px solid #ddd;"><strong>Transamerica</strong></td>
        <td style="padding: 8px 0; border-top: 1px solid #ddd; text-align: right;">Term & Whole Life</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-top: 1px solid #ddd;"><strong>Athene</strong></td>
        <td style="padding: 8px 0; border-top: 1px solid #ddd; text-align: right;">Annuities</td>
      </tr>
    </table>
  </div>

  <h3 style="color: #1a1a1a;">What You''ll Need:</h3>
  <ul style="padding-left: 20px;">
    <li>Your resident state license</li>
    <li>E&O insurance certificate</li>
    <li>State licenses for any additional states</li>
    <li>FINRA registration (for variable products)</li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/carriers" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Start Carrier Appointments</a>
  </div>

  <p>Need help? Your sponsor and our support team are here for you.</p>

  <p>To your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 3: Commission Structure (Day 5)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Understanding Your Apex Commission Structure',
  'Multiple income streams await you',
  3, 2, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Your Income Potential at Apex</h1>

  <p>Hi {{agentName}},</p>

  <p>Let''s talk about what you came here for - building wealth while protecting families.</p>

  <h2 style="color: #1a1a1a; font-size: 18px;">Your Income Streams:</h2>

  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0369a1;">1. Personal Production</h3>
    <p style="margin-bottom: 0;">Competitive first-year commissions up to 140% on life products, plus renewals.</p>
  </div>

  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #15803d;">2. Override Income</h3>
    <p style="margin-bottom: 0;">Earn overrides on your team''s production as you build your organization.</p>
  </div>

  <div style="background: #fdf4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #86198f;">3. Bonus Pools</h3>
    <p style="margin-bottom: 0;">Quarterly and annual bonuses based on personal and team performance.</p>
  </div>

  <h3 style="color: #1a1a1a;">Pro Tip from Top Producers:</h3>
  <p><em>"Focus on consistent activity - 10 presentations a week will change your life."</em></p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/compensation" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">View Full Compensation Plan</a>
  </div>

  <p>To your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 4: Building Your Team (Day 8)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Ready to Build Your Team?',
  'Leadership multiplies your impact and income',
  4, 3, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Leadership Multiplies Everything</h1>

  <p>Hi {{agentName}},</p>

  <p>The most successful agents at Apex don''t just sell - they build teams. Here''s why:</p>

  <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #92400e;">The Math of Team Building</h3>
    <p>You can only see so many families yourself. But with a team of 10 producing agents, your impact (and income) multiplies dramatically.</p>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">Who Makes a Great Team Member?</h2>

  <ul style="padding-left: 20px;">
    <li>Other licensed agents looking for better opportunities</li>
    <li>Career changers with sales or teaching backgrounds</li>
    <li>Motivated individuals who want to help families</li>
    <li>People you''ve helped - satisfied clients often want to join</li>
  </ul>

  <h3 style="color: #1a1a1a;">Your Recruiting Toolkit:</h3>
  <ul style="padding-left: 20px;">
    <li>Your personalized recruiting website</li>
    <li>Social media templates and scripts</li>
    <li>Opportunity presentation materials</li>
    <li>Training systems for new team members</li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/recruiting" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Explore Recruiting Tools</a>
  </div>

  <p>To your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 5: Leadership Path (Day 12)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Your Path to Agency Ownership',
  'From agent to agency owner - the roadmap',
  5, 4, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Your Leadership Journey</h1>

  <p>Hi {{agentName}},</p>

  <p>Every successful agency owner at Apex started exactly where you are now. Here''s the path:</p>

  <div style="margin: 20px 0;">
    <div style="display: flex; margin-bottom: 15px;">
      <div style="background: #0ea5e9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">1</div>
      <div><strong>Associate</strong> - Learn the products, start producing</div>
    </div>
    <div style="display: flex; margin-bottom: 15px;">
      <div style="background: #0ea5e9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">2</div>
      <div><strong>Senior Associate</strong> - Consistent production, first recruits</div>
    </div>
    <div style="display: flex; margin-bottom: 15px;">
      <div style="background: #0ea5e9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">3</div>
      <div><strong>Marketing Director</strong> - Build and train your team</div>
    </div>
    <div style="display: flex; margin-bottom: 15px;">
      <div style="background: #0ea5e9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">4</div>
      <div><strong>Senior Marketing Director</strong> - Develop leaders</div>
    </div>
    <div style="display: flex;">
      <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">5</div>
      <div><strong>MGA</strong> - Run your own agency with equity ownership</div>
    </div>
  </div>

  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0369a1;">Ready for the Next Step?</h3>
    <p style="margin-bottom: 0;">Schedule a call with your sponsor to create your personalized advancement plan.</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/training" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">View Training Resources</a>
  </div>

  <p>Here''s to your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- ============================================
-- UNLICENSED AGENT CAMPAIGN EMAILS
-- "Top 10 Ways to Grow Your Apex Business"
-- ============================================

-- Email 1: Welcome & First Steps (Day 1)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  'Welcome! Here''s Your First Step to Success',
  'Start building your Apex business today',
  1, 1, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Welcome to Apex, {{agentName}}! 🎉</h1>

  <p>You''ve just taken the first step toward financial freedom. Over the next few weeks, I''m going to share the <strong>Top 10 Things</strong> that successful Apex agents do to build thriving businesses.</p>

  <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #92400e; font-size: 18px;">Tip #1: Complete Your Profile</h2>
    <p>Your profile is your digital business card. Make sure it''s complete with:</p>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>A professional photo</li>
      <li>Your contact information</li>
      <li>A brief bio about why you help families</li>
    </ul>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">What''s Coming Up:</h2>
  <p>Tomorrow, I''ll share the #1 thing successful new agents do in their first week - it''s simpler than you might think!</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/profile" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Complete Your Profile</a>
  </div>

  <p>Excited to have you on the team!<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 2: Build Your Contact List (Day 2)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  '🚗 Make a List of Everyone You Know With a Car',
  'This simple exercise will kickstart your business',
  2, 1, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Tip #2: Build Your Contact List 📋</h1>

  <p>Hi {{agentName}},</p>

  <p>Here''s the #1 thing successful new agents do: <strong>They make a list of everyone they know.</strong></p>

  <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">🚗 Start With This Question:</h2>
    <p style="font-size: 18px; margin-bottom: 0;"><em>"Who do I know that owns a car?"</em></p>
  </div>

  <p>Why cars? Because <strong>Apex is launching auto insurance programs</strong> and <strong>car warranty programs</strong> soon! Everyone with a car is a potential customer.</p>

  <h2 style="color: #1a1a1a; font-size: 18px;">Your Contact List Should Include:</h2>
  <ul style="padding-left: 20px;">
    <li>Family members</li>
    <li>Friends and neighbors</li>
    <li>Coworkers (current and former)</li>
    <li>Church members</li>
    <li>Parents of your kids'' friends</li>
    <li>Your phone contacts</li>
    <li>Social media connections</li>
  </ul>

  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #15803d;">🎯 Your Goal: 100 Names</h3>
    <p style="margin-bottom: 0;">Don''t prejudge anyone. Just write down names. You''d be surprised who ends up becoming a customer or even a business partner!</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/contacts" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Add Contacts to Your CRM</a>
  </div>

  <p>Tomorrow: I''ll tell you more about our upcoming auto programs!</p>

  <p>You''ve got this,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 3: Auto Insurance Program (Day 4)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  '🚗 Coming Soon: Auto Insurance You Can Sell!',
  'Get ready for our new auto insurance program',
  3, 2, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Tip #3: Our Auto Insurance Program 🚗</h1>

  <p>Hi {{agentName}},</p>

  <p>Remember that contact list we talked about? Here''s why it''s going to pay off:</p>

  <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">Apex Auto Insurance Program</h2>
    <p>We''re launching a referral-based auto insurance program that lets you:</p>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li>Help friends and family save on car insurance</li>
      <li>Earn referral commissions</li>
      <li>No insurance license required to start!</li>
    </ul>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">How It Works:</h2>
  <ol style="padding-left: 20px;">
    <li>Share your referral link with contacts</li>
    <li>They get a quote and potentially save money</li>
    <li>You earn a commission on every policy sold</li>
  </ol>

  <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #92400e;">💡 Pro Tip</h3>
    <p style="margin-bottom: 0;">Start reaching out to your contact list NOW. Ask them: "When does your car insurance renew?" Build relationships before the program launches!</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/products/auto" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Learn More About Auto Program</a>
  </div>

  <p>Tomorrow: Car warranty programs - another easy sell!</p>

  <p>To your success,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 4: Car Warranty Programs (Day 6)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  '🔧 Car Warranty Programs - Easy Money!',
  'Another product everyone with a car needs',
  4, 2, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Tip #4: Car Warranty Programs 🔧</h1>

  <p>Hi {{agentName}},</p>

  <p>Here''s another product that everyone with a car needs:</p>

  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #15803d; font-size: 18px;">Extended Vehicle Protection</h2>
    <p>Car repairs are EXPENSIVE. A single repair can cost thousands. Our vehicle protection programs help families avoid unexpected repair bills.</p>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">Perfect For People Who:</h2>
  <ul style="padding-left: 20px;">
    <li>Drive cars out of manufacturer warranty</li>
    <li>Have high-mileage vehicles</li>
    <li>Can''t afford surprise repair bills</li>
    <li>Want peace of mind when driving</li>
  </ul>

  <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #1e40af;">The Conversation Starter:</h3>
    <p style="font-style: italic; margin-bottom: 0;">"Hey [Name], how old is your car? I work with a company that helps people avoid expensive repair bills. Want me to get you a quote?"</p>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">Your Contact List Action:</h2>
  <p>Go through your list and put a ⭐ next to anyone who drives a car that''s 3+ years old. These are your warmest leads!</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/products/warranty" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Explore Warranty Programs</a>
  </div>

  <p>Next up: Should you get your insurance license?</p>

  <p>You''re doing great,<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);

-- Email 5: Getting Licensed (Day 9)
INSERT INTO drip_campaign_emails (
  campaign_id, subject, preview_text, sequence_order, delay_days, delay_hours, html_content
) VALUES (
  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
  '📜 Should You Get Your Insurance License?',
  'Unlock your full earning potential',
  5, 3, 0,
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://theapexway.net/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
  </div>

  <h1 style="color: #0ea5e9; font-size: 24px;">Tip #5: Getting Your License 📜</h1>

  <p>Hi {{agentName}},</p>

  <p>You''ve been building your contact list and learning about our products. Now let''s talk about taking your business to the NEXT level.</p>

  <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #92400e; font-size: 18px;">Why Get Licensed?</h2>
    <ul style="padding-left: 20px; margin-bottom: 0;">
      <li><strong>Higher commissions</strong> - Licensed agents earn significantly more</li>
      <li><strong>More products</strong> - Sell life insurance, annuities, and more</li>
      <li><strong>Build real wealth</strong> - Renewals create passive income</li>
      <li><strong>Help more families</strong> - Provide comprehensive protection</li>
    </ul>
  </div>

  <h2 style="color: #1a1a1a; font-size: 18px;">It''s Easier Than You Think:</h2>
  <ol style="padding-left: 20px;">
    <li>Take a pre-licensing course (40-60 hours, can do online)</li>
    <li>Pass the state exam (we help you study!)</li>
    <li>Get appointed with carriers through Apex</li>
    <li>Start earning higher commissions!</li>
  </ol>

  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #15803d;">We''ll Help You Every Step:</h3>
    <p style="margin-bottom: 0;">Apex provides study materials, exam prep resources, and your sponsor will guide you through the process.</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://theapexway.net/dashboard/training/licensing" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Start Your Licensing Journey</a>
  </div>

  <p>More tips coming soon!<br/><strong>The Apex Team</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
  <p style="color: #999; font-size: 12px; text-align: center;">
    © 2026 Apex Affinity Group | <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>'
);
