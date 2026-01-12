-- Migration: Agent Recruitment System
-- Created: 2026-01-12
-- Description: Add tables for email sequences, lead tracking, and copilot subscriptions

-- ============================================
-- EMAIL SEQUENCES (Nurturing Campaigns)
-- ============================================
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('lead_capture', 'signup', 'copilot_trial', 'manual')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active sequences lookup
CREATE INDEX idx_email_sequences_active ON email_sequences(is_active) WHERE is_active = true;
CREATE INDEX idx_email_sequences_trigger ON email_sequences(trigger_type);

-- ============================================
-- EMAIL SEQUENCE STEPS
-- ============================================
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- Create index for step lookup
CREATE INDEX idx_email_sequence_steps_sequence ON email_sequence_steps(sequence_id);

-- ============================================
-- LEAD EMAIL QUEUE (Scheduled Emails)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_step_id UUID NOT NULL REFERENCES email_sequence_steps(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for queue processing
CREATE INDEX idx_lead_email_queue_pending ON lead_email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_lead_email_queue_contact ON lead_email_queue(contact_id);
CREATE INDEX idx_lead_email_queue_status ON lead_email_queue(status);

-- ============================================
-- LEAD ACTIVITIES (Engagement Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'email_sent', 'email_open', 'email_click', 'page_view',
    'form_submit', 'copilot_demo', 'copilot_message'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for activity queries
CREATE INDEX idx_lead_activities_contact ON lead_activities(contact_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created ON lead_activities(created_at DESC);

-- ============================================
-- COPILOT USAGE (Daily Message Limits)
-- ============================================
CREATE TABLE IF NOT EXISTS copilot_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_used INTEGER DEFAULT 0,
  UNIQUE(agent_id, date)
);

-- Create index for usage lookup
CREATE INDEX idx_copilot_usage_agent_date ON copilot_usage(agent_id, date);

-- ============================================
-- COPILOT SUBSCRIPTIONS (Stripe Integration)
-- ============================================
CREATE TABLE IF NOT EXISTS copilot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'agency')),
  bonus_volume INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscription queries
CREATE INDEX idx_copilot_subscriptions_agent ON copilot_subscriptions(agent_id);
CREATE INDEX idx_copilot_subscriptions_status ON copilot_subscriptions(status);
CREATE INDEX idx_copilot_subscriptions_stripe ON copilot_subscriptions(stripe_subscription_id);

-- ============================================
-- ADD LEAD SCORE TO CONTACTS
-- ============================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_sequence_id UUID REFERENCES email_sequences(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_sequence_started_at TIMESTAMPTZ;

CREATE INDEX idx_contacts_lead_score ON contacts(lead_score DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Email Sequences (admin only for management, read for all authenticated)
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sequences" ON email_sequences
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage sequences" ON email_sequences
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Email Sequence Steps (follow parent permissions)
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active steps" ON email_sequence_steps
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage steps" ON email_sequence_steps
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Lead Email Queue (service role only)
ALTER TABLE lead_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage email queue" ON lead_email_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Lead Activities (agents can view their own contacts' activities)
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their leads activities" ON lead_activities
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts WHERE agent_id IN (
        SELECT id FROM agents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage activities" ON lead_activities
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Copilot Usage (agents can view/update their own)
ALTER TABLE copilot_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own usage" ON copilot_usage
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage usage" ON copilot_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Copilot Subscriptions (agents can view their own)
ALTER TABLE copilot_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own subscription" ON copilot_subscriptions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage subscriptions" ON copilot_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update lead score when activity is added
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  score_delta INTEGER;
BEGIN
  -- Calculate score based on activity type
  score_delta := CASE NEW.activity_type
    WHEN 'email_open' THEN 10
    WHEN 'email_click' THEN 20
    WHEN 'page_view' THEN 5
    WHEN 'form_submit' THEN 30
    WHEN 'copilot_demo' THEN 50
    WHEN 'copilot_message' THEN 5
    ELSE 0
  END;

  -- Update contact's lead score
  UPDATE contacts
  SET lead_score = COALESCE(lead_score, 0) + score_delta
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update lead score
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();

-- Function to increment copilot usage
CREATE OR REPLACE FUNCTION increment_copilot_usage(p_agent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO copilot_usage (agent_id, date, messages_used)
  VALUES (p_agent_id, CURRENT_DATE, 1)
  ON CONFLICT (agent_id, date)
  DO UPDATE SET messages_used = copilot_usage.messages_used + 1
  RETURNING messages_used INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DEFAULT EMAIL SEQUENCE (Lead Nurturing)
-- ============================================
INSERT INTO email_sequences (id, name, description, trigger_type, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Lead Nurturing - Default',
  'Automated email sequence for new leads captured through agent replicated sites',
  'lead_capture',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO email_sequence_steps (sequence_id, step_number, subject, body_html, delay_days, delay_hours)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 1,
   'Welcome! Here''s what you need to know about Apex',
   '<p>Hi {{lead.first_name}},</p><p>Thank you for your interest in Apex Affinity Group!</p><p>I''m {{agent.first_name}} {{agent.last_name}}, and I''m excited to share this opportunity with you.</p><p>Over the next few days, I''ll be sending you some valuable information about how you can build a successful career with us.</p><p>Talk soon,<br>{{agent.first_name}}</p>',
   0, 0),
  ('a0000000-0000-0000-0000-000000000001', 2,
   'Why insurance agents are choosing Apex',
   '<p>Hi {{lead.first_name}},</p><p>Did you know that Apex agents earn some of the highest commissions in the industry?</p><p>Here''s what sets us apart:</p><ul><li>Industry-leading commission rates</li><li>Cutting-edge AI tools to help you succeed</li><li>Comprehensive training and support</li><li>Flexible schedule - work from anywhere</li></ul><p>Ready to learn more? Reply to this email and let''s schedule a quick call.</p><p>Best,<br>{{agent.first_name}}</p>',
   2, 0),
  ('a0000000-0000-0000-0000-000000000001', 3,
   'Meet our AI Copilot - your secret weapon',
   '<p>Hi {{lead.first_name}},</p><p>Imagine having an AI assistant that helps you:</p><ul><li>Find the best products for your clients</li><li>Answer complex insurance questions instantly</li><li>Generate professional scripts and emails</li><li>Track your leads and follow-ups</li></ul><p>That''s exactly what our AI Copilot does. And as an Apex agent, you get access to it.</p><p>Want to see it in action? Reply and I''ll set up a quick demo for you.</p><p>{{agent.first_name}}</p>',
   4, 0),
  ('a0000000-0000-0000-0000-000000000001', 4,
   'Success stories from agents like you',
   '<p>Hi {{lead.first_name}},</p><p>Here are some real results from Apex agents:</p><ul><li>"I made more in my first 90 days than I did in 6 months at my previous company." - Sarah T.</li><li>"The AI Copilot saves me hours every week. It''s like having a genius assistant." - Mike R.</li><li>"The training and support here is unlike anything I''ve experienced." - Jennifer L.</li></ul><p>Your success story could be next. Are you ready?</p><p>{{agent.first_name}}</p>',
   7, 0),
  ('a0000000-0000-0000-0000-000000000001', 5,
   'Ready to get started?',
   '<p>Hi {{lead.first_name}},</p><p>I''ve shared a lot of information over the past week. Now it''s time to take the next step.</p><p>If you''re serious about building a successful career in insurance, I''d love to chat and answer any questions you have.</p><p><a href="{{agent.calendar_link}}">Click here to schedule a call with me</a></p><p>Or simply reply to this email and let me know what''s on your mind.</p><p>Looking forward to connecting,<br>{{agent.first_name}}</p>',
   10, 0),
  ('a0000000-0000-0000-0000-000000000001', 6,
   'Last chance: Special offer inside',
   '<p>Hi {{lead.first_name}},</p><p>I wanted to reach out one more time before I move on.</p><p>If you''re still considering joining Apex, now is the perfect time. We have some exciting things happening and I''d hate for you to miss out.</p><p>If this isn''t the right fit for you, no worries at all. I wish you the best!</p><p>But if you''re still interested, just reply to this email and let''s talk.</p><p>Best,<br>{{agent.first_name}}</p>',
   14, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE email_sequences IS 'Email nurturing sequences for lead automation';
COMMENT ON TABLE email_sequence_steps IS 'Individual emails within a sequence';
COMMENT ON TABLE lead_email_queue IS 'Scheduled emails pending send';
COMMENT ON TABLE lead_activities IS 'Tracking lead engagement (opens, clicks, page views)';
COMMENT ON TABLE copilot_usage IS 'Daily AI copilot message usage per agent';
COMMENT ON TABLE copilot_subscriptions IS 'AI copilot subscription status and Stripe integration';
