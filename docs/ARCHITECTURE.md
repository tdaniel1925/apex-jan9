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

## Training Suite / LMS (Added: 2026-01-12)

Comprehensive Learning Management System for agent training, onboarding, and certification.

### System Components

```
/lib
  /api
    response.ts              → Standardized API responses with error codes
  /services
    training-service.ts      → 1017 lines, comprehensive training logic
  /types
    training.ts              → TypeScript types for training data

/app/api
  /training                  → Agent-facing training APIs (13 routes)
    /courses
      route.ts               → GET courses with progress
      /[courseId]
        route.ts             → GET course details
        /enroll/route.ts     → POST enroll in course
    /progress/route.ts       → POST update lesson progress
    /quizzes/[quizId]
      route.ts               → GET quiz with questions
      /submit/route.ts       → POST submit quiz answers
    /tracks/route.ts         → GET learning paths
    /tracks/[trackId]/enroll/route.ts → POST enroll in track
    /certificates/route.ts   → GET agent certificates
    /resources/route.ts      → GET/POST resources library
    /licenses/route.ts       → GET/POST insurance licenses
    /stats/route.ts          → GET training statistics
    /lessons/[lessonId]/quiz/route.ts → GET lesson quiz

  /admin/training            → Admin training management (10 routes)
    route.ts                 → GET training stats
    /courses                 → Course CRUD
    /quizzes                 → Quiz management
    /resources               → Resource management
    /analytics               → Training analytics
```

### Database Tables (Migration: `20260112_training_suite.sql`)

| Table | Purpose |
|-------|---------|
| `training_tracks` | Learning paths (new_agent, licensing, product, sales, leadership, compliance) |
| `track_courses` | Many-to-many track/course relationships |
| `course_sections` | Modules within courses |
| `quizzes` | Quiz/exam definitions with settings |
| `quiz_questions` | Questions (multiple_choice, true_false, multiple_select, short_answer) |
| `quiz_answers` | Answer options with correct flags |
| `quiz_attempts` | Agent quiz attempts with scores and timing |
| `certificates` | Issued certificates with verification URLs |
| `resources` | Downloadable resource library (pdf, video, audio, etc.) |
| `agent_licenses` | Insurance license tracking by state |
| `ce_credits` | Continuing education credit tracking |
| `course_enrollments` | Agent course enrollment and progress |
| `track_enrollments` | Agent track enrollment and progress |
| `achievements` | Gamification badges and points |
| `agent_achievements` | Earned achievements |
| `learning_streaks` | Daily activity streak tracking |

### API Response Pattern

All training API routes use standardized responses via `lib/api/response.ts`:

```typescript
// Error responses include error codes
import { ApiErrors, apiSuccess } from '@/lib/api/response';

// Success: { data: { courses: [...] } }
return apiSuccess({ courses });

// Error: { error: "Unauthorized", code: "UNAUTHORIZED" }
return ApiErrors.unauthorized();

// Error: { error: "Course not found", code: "NOT_FOUND" }
return ApiErrors.notFound('Course');

// Validation: { error: "Validation failed", code: "VALIDATION_ERROR", details: {...} }
return handleZodError(parseResult.error);
```

### Agent Portal Pages

```
/dashboard/training              → Training home (stats, featured, continue learning)
/dashboard/training/courses      → Course catalog with filters
/dashboard/training/courses/[id] → Course detail with lessons
/dashboard/training/courses/[id]/[lessonId] → Lesson player (video/text/quiz)
/dashboard/training/tracks       → Learning paths overview
/dashboard/training/resources    → Resource library with categories
/dashboard/training/certificates → Agent's earned certificates
/dashboard/training/achievements → Gamification dashboard (streaks, badges)
```

### Admin Pages

```
/admin/training                  → Training management dashboard
/admin/training/courses          → Course list with stats
/admin/training/courses/new      → Course creation wizard
/admin/training/courses/[id]     → Course editor with lesson management
/admin/training/quizzes          → Quiz list with attempt counts
/admin/training/quizzes/new      → Quiz builder with question types
/admin/training/resources        → Resource library management
/admin/training/analytics        → Training analytics and reports
```

### Quiz System

Quiz types: `multiple_choice`, `true_false`, `multiple_select`, `short_answer`

```typescript
// Quiz settings
interface Quiz {
  passing_score: number;        // Default 70%
  time_limit_minutes?: number;  // Optional timer
  max_attempts?: number;        // Default 3
  shuffle_questions: boolean;   // Randomize order
  show_correct_answers: boolean; // Show after submission
  is_certification_exam: boolean; // Issues certificate
}

// Grading logic
const isCorrect = correctAnswers.size === selectedAnswers.size &&
  [...correctAnswers].every(a => selectedAnswers.has(a));
```

### The Rules

1. **API responses use standardized format** - Always use `ApiErrors` and `apiSuccess`
2. **Progress tracking is automatic** - Updates on lesson completion
3. **Certificates are generated on course completion** - If passing score met
4. **Quizzes hide answers until submission** - `is_correct` stripped from response
5. **Resources are rank-gated** - Some resources require minimum rank
6. **Streaks update daily** - Learning activity tracked for gamification

### Tests

Training-specific tests (45+ tests):
- `tests/api/training-api.test.ts` - 12 API route tests
- `tests/components/quiz-component.test.tsx` - 11 component tests
- `tests/services/training-service.test.ts` - 22 service unit tests

---

## Admin RBAC System (Added: 2026-01-12)

Role-based access control for the admin panel with dual authentication paths.

### Dual Authentication Architecture

The admin panel supports two authentication methods:

```
Corporate Staff (RBAC)           Agent Admin (Rank-based)
────────────────────────         ────────────────────────
JWT tokens in localStorage       Supabase session
admin_users + admin_roles        agents table + rank check
37 granular permissions          Regional MGA+ = full access
Database-defined roles           Rank-implied permissions
```

### Authentication Flow

```
/admin-login
    │
    ├─► Corporate Staff Tab (Default)
    │   └─► POST /api/admin/auth/login
    │       └─► Validates credentials against admin_users
    │       └─► Returns JWT token (stored in localStorage)
    │       └─► Redirects to /admin
    │
    └─► Agent Admin Tab
        └─► Supabase signIn()
        └─► Checks agent.rank >= regional_mga
        └─► Uses existing Supabase session
        └─► Redirects to /admin
```

### Database Tables (Migration: `20260112_admin_rbac.sql`)

| Table | Purpose |
|-------|---------|
| `admin_users` | Corporate staff accounts (email, password_hash, first_name, last_name) |
| `admin_roles` | Role definitions (name, display_name, description, level) |
| `admin_user_roles` | User-role assignments (many-to-many) |
| `admin_permissions` | Permission definitions (code, name, category) |
| `admin_role_permissions` | Role-permission assignments (many-to-many) |
| `admin_sessions` | JWT session tracking (token_hash, expires_at, revoked) |
| `admin_audit_logs` | Action audit trail (action, resource_type, resource_id, details) |

### Role Hierarchy

```
super_admin (level 3)    → All permissions, system config, role management
department_head (level 2) → Department permissions, can assign staff roles
staff (level 1)          → Specific permissions per role assignment
```

### Permission Categories (37 Total)

```typescript
const PERMISSIONS = {
  // Agents (5)
  AGENTS_VIEW, AGENTS_EDIT, AGENTS_CREATE, AGENTS_DELETE, AGENTS_EXPORT,

  // Commissions (4)
  COMMISSIONS_VIEW, COMMISSIONS_EDIT, COMMISSIONS_IMPORT, COMMISSIONS_EXPORT,

  // Bonuses (4)
  BONUSES_VIEW, BONUSES_CREATE, BONUSES_EDIT, BONUSES_DELETE,

  // Payouts (3)
  PAYOUTS_VIEW, PAYOUTS_PROCESS, PAYOUTS_APPROVE,

  // Settings (6)
  SETTINGS_VIEW, SETTINGS_EDIT, SYSTEM_CONFIG, ROLES_MANAGE, USERS_MANAGE, AUDIT_VIEW,

  // Analytics (2)
  ANALYTICS_VIEW, ANALYTICS_EXPORT,

  // Training (4)
  TRAINING_VIEW, TRAINING_EDIT, TRAINING_CREATE, TRAINING_DELETE,

  // SmartOffice (4)
  SMARTOFFICE_VIEW, SMARTOFFICE_SYNC, SMARTOFFICE_CONFIG, SMARTOFFICE_EXPLORER,

  // Support (2)
  SUPPORT_VIEW, SUPPORT_RESPOND,

  // Email (3)
  EMAIL_VIEW, EMAIL_SEND, EMAIL_TEMPLATES,
};
```

### API Routes

```
/app/api/admin/auth
  /login/route.ts           → POST corporate login, returns JWT
  /logout/route.ts          → POST revoke session
  /me/route.ts              → GET current admin user with permissions

/app/api/admin/rbac
  /users/route.ts           → GET/POST admin users
  /users/[id]/route.ts      → GET/PUT/DELETE admin user
  /roles/route.ts           → GET/POST roles with permissions
  /roles/[id]/route.ts      → GET/PUT/DELETE role
  /permissions/route.ts     → GET all permissions (grouped by category)
```

### Permission Gate Components

```typescript
// Client-side permission checking
import { PermissionGate, RequirePermission, PERMISSIONS } from '@/components/admin/permission-gate';

// Wrap page content that requires permission
<RequirePermission permission={PERMISSIONS.COMMISSIONS_VIEW}>
  <CommissionsPage />
</RequirePermission>

// Conditionally show elements
<PermissionGate permission={PERMISSIONS.COMMISSIONS_IMPORT}>
  <ImportButton />
</PermissionGate>

// Multiple permissions (any of)
<PermissionGate anyOf={[PERMISSIONS.PAYOUTS_PROCESS, PERMISSIONS.PAYOUTS_APPROVE]}>
  <PayoutActions />
</PermissionGate>

// Hook for custom logic
const { hasPermission } = useAdminPermission();
if (hasPermission(PERMISSIONS.AGENTS_DELETE)) {
  // Show delete button
}
```

### Admin Layout Authentication Check

```typescript
// app/(admin)/layout.tsx
export default function AdminLayout({ children }) {
  // 1. Check for RBAC admin (JWT in localStorage)
  const adminToken = localStorage.getItem('apex_admin_token');
  if (adminToken) {
    const response = await fetch('/api/admin/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (response.ok) setAuthType('admin');
  }

  // 2. Fall back to agent rank check
  if (!adminUser && agent) {
    const isAdmin = RANK_CONFIG[agent.rank].order >= RANK_CONFIG.regional_mga.order;
    if (isAdmin) setAuthType('agent');
  }

  // 3. Redirect if neither auth valid
  if (!adminUser && !agent) router.push('/admin-login');
}
```

### The Rules

1. **Corporate staff use RBAC** - Granular permissions per role
2. **High-rank agents get implied full access** - Regional MGA+ skip permission checks
3. **JWT tokens are session-tracked** - Can be revoked via admin_sessions
4. **All admin actions are audited** - Written to admin_audit_logs
5. **Permission checks are client + server** - PermissionGate + API route validation
6. **Sidebar filters by permission** - Only shows accessible menu items

### Tests

RBAC-specific tests (40 tests):
- `tests/api/rbac-api.test.ts` - 15 API route tests
- `tests/components/permission-gate.test.tsx` - 12 component tests
- `tests/pages/admin-login.test.tsx` - 13 page tests

---

*Last updated: January 12, 2026*
