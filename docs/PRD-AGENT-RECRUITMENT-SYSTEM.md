# Product Requirements Document: Agent Recruitment System

**Version:** 1.0
**Date:** January 12, 2026
**Status:** Planning

---

## Overview

Build a comprehensive agent recruitment system that enables agents to:
1. Capture leads through their replicated site
2. Nurture prospects with automated email sequences
3. Offer AI Copilot trial with limited access
4. Convert prospects to paid Copilot subscriptions
5. Earn commissions on Copilot sales (with upline overrides)

---

## User Decisions

| Question | Answer |
|----------|--------|
| AI Copilot trial type | Limited access (message limits per day) |
| Who sends nurturing emails | System sends on agent's behalf |
| What triggers "signup" | Full account creation |
| Commission on Copilot sales | Yes - agent earns, upline gets override based on genealogy |

---

## What Already Exists

### Database Types (lib/types/database.ts)
- `Agent.ai_copilot_tier`: 'none' | 'basic' | 'pro' | 'agency'
- `Agent.ai_copilot_subscribed_at`: timestamp
- `Contact`: Full CRM with type ('lead' | 'customer' | 'recruit'), pipeline stages
- `Bonus`: AI copilot bonus types already defined
- `Commission`: Multi-source including 'retail'

### Pages
- `/join/[agentCode]/*` - Agent replicated site (landing, contact, signup, etc.)
- Contact form exists but just simulates submission

### Missing
- Email sequences tables
- Email sending integration (Resend)
- Lead activity tracking
- Copilot subscription Stripe flow
- Copilot usage limits tracking

---

## Architecture

### Phase 1: Database Schema

#### New Tables

```sql
-- Email Sequences (templates for nurturing)
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'lead_capture', 'signup', 'copilot_trial', 'manual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Sequence Steps
CREATE TABLE email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  delay_days INTEGER NOT NULL DEFAULT 0, -- Days after previous step
  delay_hours INTEGER NOT NULL DEFAULT 0, -- Hours after previous step
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Email Queue (scheduled emails)
CREATE TABLE lead_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_step_id UUID REFERENCES email_sequence_steps(id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Activities (tracking engagement)
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'email_open', 'email_click', 'page_view', 'form_submit', 'copilot_demo'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copilot Usage (track daily message limits)
CREATE TABLE copilot_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_used INTEGER DEFAULT 0,
  UNIQUE(agent_id, date)
);

-- Copilot Subscriptions (Stripe integration)
CREATE TABLE copilot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL, -- 'basic', 'pro', 'agency'
  status TEXT NOT NULL, -- 'trialing', 'active', 'past_due', 'cancelled'
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2: Email Nurturing System

#### Components
1. **Resend Integration** (`lib/email/resend.ts`)
   - Send transactional emails
   - Send on behalf of agent (agent name in From)

2. **Email Templates** (`lib/email/templates/`)
   - Welcome email
   - Nurturing series (5-7 emails)
   - Copilot trial invitation
   - Copilot trial ending reminder

3. **Email Scheduler** (`lib/email/scheduler.ts`)
   - Cron job to process email queue
   - Respects delay_days/delay_hours

4. **Email Tracking** (`app/api/email/track/`)
   - Open tracking (pixel)
   - Click tracking (redirect)

#### Email Sequence: Lead Nurturing (Default)
| Step | Delay | Subject |
|------|-------|---------|
| 1 | 0 days | Welcome! Here's what you need to know |
| 2 | 2 days | Why insurance agents are choosing Apex |
| 3 | 4 days | Meet our AI Copilot - your secret weapon |
| 4 | 7 days | Success stories from agents like you |
| 5 | 10 days | Ready to get started? |
| 6 | 14 days | Last chance: Special offer inside |

### Phase 3: Lead Tracking Dashboard

#### Agent Dashboard Features
- **Lead Pipeline View**
  - New leads count
  - Engaged leads (opened email)
  - Hot leads (multiple engagements)
  - Converted

- **Lead Score Calculation**
  - Email opened: +10 points
  - Link clicked: +20 points
  - Copilot demo started: +50 points
  - Multiple page views: +5 each

- **Activity Feed**
  - Real-time updates on lead activities
  - "John opened your email 5 min ago"

### Phase 4: AI Copilot Subscription

#### Tiers & Limits
| Tier | Price | Messages/Day | Features |
|------|-------|--------------|----------|
| Trial | Free | 5 | Basic AI chat |
| Basic | $29/mo | 50 | AI chat + scripts |
| Pro | $79/mo | 200 | + Lead insights |
| Agency | $199/mo | Unlimited | + Team access |

#### Stripe Products
- `copilot_basic`: $29/month
- `copilot_pro`: $79/month
- `copilot_agency`: $199/month

#### Commission Structure
- **Personal Sale**: 30% of subscription price
  - Basic: $8.70/mo
  - Pro: $23.70/mo
  - Agency: $59.70/mo

- **Upline Override**: Based on genealogy generation
  - Gen 1: 10%
  - Gen 2: 8%
  - Gen 3: 6%
  - Gen 4: 4%
  - Gen 5: 3%
  - Gen 6: 2%

---

## Implementation Order

### Phase 1: Database & Types (Day 1)
1. Create Supabase migrations for new tables
2. Add TypeScript types to database.ts
3. Update Database interface

### Phase 2: Email System (Days 2-3)
1. Set up Resend integration
2. Create email templates
3. Build email scheduler
4. Add tracking endpoints
5. Connect contact form to create leads

### Phase 3: Lead Dashboard (Days 4-5)
1. Create leads dashboard page
2. Build lead scoring service
3. Add activity feed component
4. Implement pipeline view

### Phase 4: Copilot Subscriptions (Days 6-7)
1. Create Stripe products
2. Build subscription checkout flow
3. Implement usage tracking
4. Add commission calculation
5. Create upline override logic

---

## API Endpoints

### Email
- `POST /api/email/send` - Send single email
- `POST /api/email/queue` - Add to queue
- `GET /api/email/track/open/[id]` - Track open
- `GET /api/email/track/click/[id]` - Track click

### Leads
- `GET /api/leads` - Get agent's leads
- `GET /api/leads/[id]` - Get lead details
- `GET /api/leads/[id]/activities` - Get lead activities
- `POST /api/leads/[id]/note` - Add note to lead

### Copilot
- `POST /api/copilot/subscribe` - Start subscription
- `POST /api/copilot/usage` - Log usage
- `GET /api/copilot/usage` - Get usage stats
- `POST /api/webhooks/stripe/copilot` - Handle Stripe events

---

## Environment Variables

```env
# Resend (Email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@theapexway.net
RESEND_FROM_NAME=Apex Affinity Group

# Stripe (Copilot Subscriptions)
STRIPE_COPILOT_BASIC_PRICE_ID=price_xxxxx
STRIPE_COPILOT_PRO_PRICE_ID=price_xxxxx
STRIPE_COPILOT_AGENCY_PRICE_ID=price_xxxxx
```

---

## Success Metrics

- Lead capture rate: % of visitors who submit contact form
- Email open rate: Target 25%+
- Email click rate: Target 5%+
- Copilot trial conversion: Target 10%
- Trial to paid conversion: Target 20%

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Email deliverability | Use Resend with proper SPF/DKIM |
| Spam complaints | Include unsubscribe link, honor opt-outs |
| Copilot abuse | Rate limiting, usage tracking |
| Payment failures | Dunning emails, grace period |

---

*Last Updated: January 12, 2026*
