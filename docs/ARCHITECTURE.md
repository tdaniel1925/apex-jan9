# Apex Affinity Group - Architecture Rules

> **IMPORTANT**: Claude must read this file at the start of every session and after any conversation compaction.

---

## Core Principle: Event-Driven Workflows

When something happens in the system, we trigger a workflow that handles ALL downstream effects.

### Workflow Files
```
/lib/workflows/
  on-commission-created.ts    → Handles: rank recalc, overrides, fast start, contests
  on-agent-registered.ts      → Handles: matrix placement, welcome email, sponsor notification
  on-rank-changed.ts          → Handles: rank bonus, rate updates, notifications
  on-subscription-started.ts  → Handles: AI copilot bonuses, team counts
  on-payout-processed.ts      → Handles: wallet debit, transaction record
```

### The Rule
**NEVER** process an event inline. Always call the workflow:

```typescript
// WRONG - forgets downstream effects
await db.commissions.create(data);

// RIGHT - workflow handles everything
await db.commissions.create(data);
await onCommissionCreated(data);
```

---

## Core Principle: Single Calculation Engines

Each type of calculation lives in ONE file. Never duplicate.

### Engine Files
```
/lib/engines/
  rank-engine.ts       → calculateRank(), getRequirements(), checkPromotion()
  override-engine.ts   → calculate6GenOverrides(), getOverrideRate()
  bonus-engine.ts      → checkFastStart(), checkRankAdvancement(), checkAICopilot()
  wallet-engine.ts     → credit(), debit(), getBalance(), getPending()
  matrix-engine.ts     → place(), getDownline(), getUpline(), findSpillover()
```

### The Rule
**NEVER** calculate rank/bonus/override anywhere except the engine:

```typescript
// WRONG - duplicates logic
const rank = premium > 75000 ? 'Sr. Agent' : 'Agent';

// RIGHT - single source of truth
const rank = await RankEngine.calculateRank(agentId);
```

---

## Core Principle: Config as Data

All business rules that might change are in config files, not hardcoded.

### Config Files
```
/lib/config/
  ranks.ts             → Rank names, requirements, order
  bonuses.ts           → Bonus amounts, caps, phase requirements
  carriers.ts          → Carrier names, commission rates by rank
  overrides.ts         → Generation percentages (15%, 5%, 3%, 2%, 1%, 0.5%)
  phases.ts            → Agent thresholds for bonus phases
```

---

## Database Schema Principles

1. **Store facts, calculate derived values**
   - Store: individual commissions
   - Calculate: 90-day premium totals (via query or view)

2. **Use views for computed metrics**
   ```sql
   CREATE VIEW agent_metrics AS
   SELECT agent_id, SUM(amount) as premium_90d FROM commissions...
   ```

3. **Transactions for related writes**
   - Commission + overrides + wallet credits = one transaction

---

## File Structure Overview

```
/app                    → Next.js pages and API routes
/components             → React components
/lib
  /config              → Business rules as data
  /engines             → Calculation logic (one per domain)
  /workflows           → Event handlers (one per event type)
  /services            → Orchestration (uses engines + workflows)
  /db                  → Database queries and types
  /utils               → Pure helper functions
/docs
  ARCHITECTURE.md      → This file (rules)
  PROJECT_STATE.md     → Current status
  DEVLOG.md            → Decision history
```

---

## What Claude Must Do

1. **Before writing code**: Check if an engine/workflow already exists
2. **When adding features**: Follow existing patterns in the codebase
3. **When unsure**: Read PROJECT_STATE.md and DEVLOG.md for context
4. **After making changes**: Update DEVLOG.md with what was done and why

---

## Core Principle: Simplicity Over Complexity

**Auth Context Pattern** (Updated: 2026-01-12)

Authentication context must be kept simple to avoid race conditions and deadlocks.

### The Pattern
```typescript
// ✅ GOOD - Simple, predictable
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>...</AuthContext.Provider>;
}
```

### Anti-Patterns
```typescript
// ❌ BAD - Locks cause deadlocks
let authStateChangeLock = false;
if (authStateChangeLock) return; // Can get stuck forever
authStateChangeLock = true;

// ❌ BAD - Retry logic causes race conditions
let retries = 0;
while (!data && retries < 3) { /* complex retry */ }

// ❌ BAD - Global subscriptions leak memory
globalSubscription?.unsubscribe();
globalSubscription = supabase.auth.onAuthStateChange(...);

// ❌ BAD - Performance tracking adds overhead
await measureAsync('fetchAgent', async () => { /* fetch */ });
```

### The Rule
**Authentication should be direct and simple:**
1. No locks - they cause deadlocks
2. No retries - they cause race conditions
3. No global state - use component state only
4. No performance tracking in auth flow - keep it fast

---

## Agent Recruitment System (Added: 2026-01-12)

A comprehensive system for agents to capture leads, nurture prospects, and convert to AI Copilot subscriptions.

### System Components

```
/lib
  /email
    resend.ts              → Resend API client
    scheduler.ts           → Process email queue (cron)
    templates/             → React Email templates
  /services
    lead-service.ts        → Lead capture, scoring, pipeline
    copilot-service.ts     → Subscription management, usage tracking
  /workflows
    on-lead-captured.ts    → Start nurturing sequence
    on-copilot-subscribed.ts → Commission + upline overrides
```

### New Database Tables

| Table | Purpose |
|-------|---------|
| `email_sequences` | Nurturing sequence definitions |
| `email_sequence_steps` | Individual emails in a sequence |
| `lead_email_queue` | Scheduled emails pending send |
| `lead_activities` | Track opens, clicks, page views |
| `copilot_usage` | Daily message counts per agent |
| `copilot_subscriptions` | Stripe subscription tracking |

### Email System Pattern

```typescript
// Send email on agent's behalf
await sendEmail({
  to: lead.email,
  from: {
    name: `${agent.first_name} ${agent.last_name}`,
    email: 'noreply@theapexway.net', // System email
    replyTo: agent.email, // Agent's real email
  },
  subject: step.subject,
  html: renderTemplate(step.body_html, { agent, lead }),
});
```

### Lead Scoring

| Activity | Points |
|----------|--------|
| Email opened | +10 |
| Link clicked | +20 |
| Page viewed | +5 |
| Copilot demo started | +50 |
| Form submitted | +30 |

### Copilot Tiers & Commission (Based on Bonus Volume)

**IMPORTANT**: Commissions are based on Bonus Volume (BV), NOT retail price.
BV is set at product/subscription setup level.

| Tier | Price | Bonus Volume | Messages/Day |
|------|-------|--------------|--------------|
| Trial | Free | 0 BV | 5 |
| Basic | $29/mo | 20 BV | 50 |
| Pro | $79/mo | 60 BV | 200 |
| Agency | $199/mo | 150 BV | Unlimited |

### Override Structure (Per Generation, on BV)

```typescript
// Overrides are calculated on Bonus Volume, not retail price
const COPILOT_OVERRIDES = {
  1: 0.10,  // 10% of BV - Direct sponsor
  2: 0.08,  // 8% of BV
  3: 0.06,  // 6% of BV
  4: 0.04,  // 4% of BV
  5: 0.03,  // 3% of BV
  6: 0.02,  // 2% of BV
};

// Example: Agent subscribes to Pro (60 BV)
// Sponsor (Gen 1): 60 × 0.10 = 6 BV
// Gen 2: 60 × 0.08 = 4.8 BV
// etc.
```

### The Rules

1. **Lead capture always triggers nurturing** - No manual intervention needed
2. **Emails sent on agent's behalf** - Agent's name, system sends
3. **Trial = limited access** - 5 messages/day, not time-limited
4. **Commissions flow through genealogy** - Same as insurance overrides

### PRD Location

Full requirements: `docs/PRD-AGENT-RECRUITMENT-SYSTEM.md`

---

## Marketing Site Architecture (Added: 2026-01-12)

Public-facing marketing pages with SEO optimization for the main corporate site.

### Route Structure

```
/app
  /(marketing)/           → Route group (no URL prefix)
    layout.tsx            → Shared nav + footer layout
    about/page.tsx        → Company story, mission, values
    carriers/page.tsx     → 7 carrier partner profiles
    opportunity/page.tsx  → Agent opportunity overview
    contact/page.tsx      → Contact form + info
    faq/page.tsx          → Accordion FAQ (5 categories)
    privacy/page.tsx      → GDPR/CCPA privacy policy
    terms/page.tsx        → Terms of service
    income-disclaimer/page.tsx → FTC-compliant income disclosure
  /api
    /contact/route.ts     → Contact form submission API
  sitemap.ts              → Dynamic XML sitemap
  robots.ts               → Crawler rules
  layout.tsx              → Root layout with full SEO metadata
  page.tsx                → Homepage (enhanced with stats, testimonials)
```

### Component Structure

```
/components
  /marketing
    footer.tsx            → Full-width footer with links
    contact-form.tsx      → React Hook Form + Zod validation (client)
```

### SEO Implementation

```typescript
// Root layout.tsx - metadataBase enables relative OG images
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: '...', template: '%s | Apex Affinity Group' },
  openGraph: { type: 'website', locale: 'en_US', ... },
  twitter: { card: 'summary_large_image', ... },
  robots: { index: true, follow: true, googleBot: { ... } },
};
```

### The Rules

1. **Marketing pages are server components** - No `'use client'` needed
2. **Homepage is client component** - Uses `useAuth` for conditional CTA
3. **Contact form uses server action pattern** - Form posts to `/api/contact`
4. **Legal pages required for compliance** - Privacy, Terms, Income Disclaimer
5. **Income disclaimer links everywhere** - FTC requires clear disclosure

### Replicated Sites vs Marketing Site

| Aspect | Marketing Site | Replicated Sites |
|--------|---------------|------------------|
| URL | apexaffinity.com/* | /join/[agentCode]/* |
| Purpose | Corporate, SEO, general public | Agent-specific lead capture |
| Layout | Shared marketing layout | Agent-branded layout |
| Legal pages | Corporate versions | Agent-attributed versions |
| Forms | General contact | Lead capture (tied to agent) |

---

## Anti-Patterns (Never Do These)

| Bad | Good |
|-----|------|
| Calculate rank in a component | Call RankEngine.calculateRank() |
| Inline override percentages | Read from config/overrides.ts |
| Process commission without workflow | Always call onCommissionCreated() |
| Duplicate validation logic | Create shared validator in /lib/utils |
| Hardcode bonus amounts | Read from config/bonuses.ts |
| Add locks to auth context | Keep auth simple with direct state |
| Use retry loops in auth flow | Fail fast, let user retry |
| Put API keys in client code | Always use server-side API routes |
| Skip income disclaimer links | FTC compliance requires disclosure |

---

## SmartOffice CRM Integration (Added: 2026-01-12)

External CRM integration to sync agent hierarchy, policies, and commissions from SmartOffice.

### System Components

```
/lib
  /smartoffice
    client.ts              → SmartOffice API client (lazy-loaded singleton)
    types.ts               → TypeScript types for SmartOffice data
    xml-builder.ts         → Build XML request bodies
    xml-parser.ts          → Parse XML responses (fast-xml-parser)
    sync-service.ts        → Main sync orchestration
    index.ts               → Public exports

/app/api
  /admin/smartoffice
    route.ts               → GET/POST config
    sync/route.ts          → POST trigger sync
    agents/route.ts        → GET/POST agent mapping
    policies/route.ts      → GET imported policies
    logs/route.ts          → GET sync history
    explorer/route.ts      → POST execute raw XML
    dictionary/route.ts    → GET/POST known objects
    samples/route.ts       → GET sample requests
  /cron
    smartoffice-sync/route.ts → Scheduled sync endpoint
```

### Database Tables (Migration Complete ✅)

| Table | Purpose |
|-------|---------|
| `smartoffice_sync_config` | API credentials and settings (sandbox configured) |
| `smartoffice_agents` | Imported agents with Apex mapping |
| `smartoffice_policies` | Imported policy data |
| `smartoffice_commissions` | Imported commission data (`commission_role` column) |
| `smartoffice_sync_logs` | Sync history and audit trail |

### SmartOffice XML API Pattern

```typescript
// Building requests
const xml = buildSearchRequest({
  object: 'Agent',
  properties: ['Status'],
  condition: { property: 'Contact.ClientType', operator: 'eq', value: '7' },
  options: { pageSize: 50, keepSession: true },
});

// Parsing responses
const result = parseSmartOfficeXML(responseXml);
if (result.success) {
  // result.data contains parsed response
}
```

### Sync Flow

1. **Full Sync** - Fetches all agents, policies, commissions
2. **Incremental Sync** - Only changes since last sync
3. **Agent Mapping** - Match SmartOffice agents to Apex agents (by email or manual)
4. **Cron Sync** - Scheduled via external scheduler (every 6 hours)

### The Rules

1. **SmartOffice client is lazy-loaded** - Only instantiated when needed
2. **Credentials stored in database** - Not in environment variables
3. **Agent mapping is explicit** - Must map SmartOffice → Apex agents
4. **All syncs are logged** - Full audit trail in sync_logs table
5. **XML responses are validated** - Parser handles errors gracefully

### Developer Tools (Admin UI)

| Tab | Purpose |
|-----|---------|
| API Explorer | Test raw XML requests |
| Dictionary | Browse known objects and properties |
| Samples | Pre-built request examples |
| Discover | Test if properties exist in API |

---

*Last updated: January 13, 2026*
