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

### Copilot Tiers & Commission

| Tier | Price | Agent Commission | Upline Override |
|------|-------|-----------------|-----------------|
| Trial | Free | - | - |
| Basic | $29/mo | 30% ($8.70) | Yes (Gen 1-6) |
| Pro | $79/mo | 30% ($23.70) | Yes (Gen 1-6) |
| Agency | $199/mo | 30% ($59.70) | Yes (Gen 1-6) |

### Override Structure (Per Generation)

```typescript
const COPILOT_OVERRIDES = {
  1: 0.10,  // 10% - Direct sponsor
  2: 0.08,  // 8%
  3: 0.06,  // 6%
  4: 0.04,  // 4%
  5: 0.03,  // 3%
  6: 0.02,  // 2%
};
```

### The Rules

1. **Lead capture always triggers nurturing** - No manual intervention needed
2. **Emails sent on agent's behalf** - Agent's name, system sends
3. **Trial = limited access** - 5 messages/day, not time-limited
4. **Commissions flow through genealogy** - Same as insurance overrides

### PRD Location

Full requirements: `docs/PRD-AGENT-RECRUITMENT-SYSTEM.md`

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

---

*Last updated: January 12, 2026*
