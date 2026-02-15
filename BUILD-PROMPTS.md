# BUILD-PROMPTS.md — Apex Affinity Group Platform v1

## How To Use

1. Paste **Stage 1** prompt into Claude Code.
2. Claude Code completes Stage 1, then outputs the Stage 2 prompt at the end.
3. Copy that output prompt, paste it as a new message.
4. Repeat until Stage 7 is complete.
5. After Stage 7, run the Post-Build Review prompt.

**You only manually copy Stage 1.** Every subsequent prompt is handed to you by the previous stage.

---

## STAGE 1: Schema & Types

```
STOP. Read these files completely before writing any code:
- CLAUDE.md (project rules)
- SPEC-DATA-MODEL.md (all 13 tables)
- .env.example (all environment variables)
- SPEC-DEPENDENCY-MAP.md > CROSS-CUTTING > ENV VALIDATION

You are building Stage 1 of the Apex Affinity Group Platform. This stage creates the database schema, TypeScript types, Zod validation schemas, and environment variable validation.

=== WHAT TO BUILD ===

1. Initialize Next.js 15 project with App Router, TypeScript strict, Tailwind CSS
2. Install dependencies: drizzle-orm, @supabase/supabase-js, @supabase/ssr, zod, sonner, lucide-react, resend, react-d3-tree, react-easy-crop, recharts, shadcn/ui
3. Create Drizzle schema (src/lib/db/schema.ts) with ALL 13 tables from SPEC-DATA-MODEL.md:
   - distributors, matrix_positions, contact_submissions, drip_enrollments, activity_log, admin_users, site_content, signup_analytics, notifications, system_settings, audit_log, distributor_sessions (removed — using Supabase Auth sessions)
   - Every column, type, default, and foreign key EXACTLY as specified
   - All enums as pgEnum
   - All indexes as specified
4. Create TypeScript types (src/lib/types/) — one file per domain:
   - distributor.ts (Distributor, NewDistributor, UpdateDistributor)
   - matrix.ts (MatrixPosition, TreeNode, PlacementResult)
   - contact.ts (ContactSubmission, NewContactSubmission)
   - auth.ts (AdminUser, UserRole, SessionUser)
   - common.ts (PaginatedResult, ApiResponse, SortDirection)
5. Create Zod schemas (src/lib/types/schemas.ts):
   - signUpSchema (first_name, last_name, email, phone, password, confirm_password, username, terms)
   - contactFormSchema (name, email, phone, message)
   - profileUpdateSchema (first_name, last_name, phone, bio)
   - usernameSchema (3-30 chars, lowercase, letters/numbers/dots, no consecutive dots, no start/end dot)
6. Create env validation (src/lib/env.ts):
   - Validate ALL required env vars at import time
   - Throw descriptive error if any missing
   - Export typed env object
7. Create Drizzle config (drizzle.config.ts) pointing to Supabase
8. Create Supabase client utilities (src/lib/db/client.ts):
   - createClient() for server components
   - createServiceClient() for server actions (service role)
9. Generate initial migration
10. Set up shadcn/ui: init with default config, install button, input, label, textarea, card, badge, toast (sonner), dialog, tabs, table, avatar, dropdown-menu, separator, skeleton

=== VERIFY ===
- `npm run build` passes with zero errors
- All types compile
- All Zod schemas can be imported and validated
- env.ts throws if NEXT_PUBLIC_SUPABASE_URL is missing
- Drizzle migration generates SQL for all 13 tables

=== WHEN COMPLETE ===
1. Run `npm run build` — must pass
2. Git commit: "stage-1: schema, types, env validation"
3. Git tag: stage-1-complete
4. Update BUILD-STATE.md: Stage 1 = ✅ Complete
5. Output this EXACT text so staff can paste it for Stage 2:

---BEGIN STAGE 2 PROMPT---
STOP. Read these files completely before writing any code:
- CLAUDE.md
- SPEC-AUTH.md (all roles, permissions, RLS policies)
- SPEC-DEPENDENCY-MAP.md > CROSS-CUTTING > SECURITY

You are building Stage 2 of the Apex Affinity Group Platform. Stage 1 is complete (schema, types, env validation). This stage adds authentication, middleware, and row-level security.

=== WHAT TO BUILD ===

1. Supabase Auth setup:
   - Configure email/password auth
   - Create auth helpers (src/lib/auth/):
     - getSession() — get current session from cookies
     - getUser() — get current user with role info
     - isAdmin() — check if current user is admin
     - isDistributor() — check if current user is distributor
     - requireAuth() — throw if not authenticated
     - requireAdmin() — throw if not admin
     - requireDistributor() — throw if not distributor

2. Middleware (src/middleware.ts):
   - Refresh session on every request (Supabase SSR)
   - /dashboard/* → redirect to /login if no session
   - /admin/* → redirect to /login if no session, redirect to /dashboard if not admin
   - /login → redirect to /dashboard if already authenticated distributor, /admin if admin
   - All other routes → pass through
   - Match SPEC-AUTH.md route protection table exactly

3. RLS Policies (as Drizzle migration or raw SQL):
   - distributors: distributors read own + downline, update own only, insert service role
   - matrix_positions: read own subtree, insert/update service role
   - contact_submissions: read own, insert anon, update own status
   - notifications: read own, update own (mark read), insert service role
   - activity_log: read own org (distributors), read all (admins), insert service role
   - audit_log: read admins only, insert service role
   - admin_users: read admins only
   - site_content: read public, update super_admin
   - system_settings: read admin, update super_admin
   - Match SPEC-AUTH.md RLS policies exactly

4. Login page (src/app/(auth)/login/page.tsx):
   - Email + password form
   - Zod validation
   - Sign in via Supabase Auth
   - Detect role (check admin_users table) → redirect to /admin or /dashboard
   - Error handling: invalid credentials, suspended account
   - Forgot password link (triggers Supabase reset)
   - Loading state on submit button
   - SPEC-WORKFLOWS WF-8

5. Logout action:
   - Sign out via Supabase Auth
   - Redirect to /login

6. Security headers (next.config.ts):
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - CSP header

=== VERIFY ===
- /dashboard redirects to /login when not authenticated
- /admin redirects to /login when not authenticated
- /admin redirects to /dashboard when authenticated as distributor
- Login works with valid credentials
- Login shows error with invalid credentials
- RLS blocks distributor from reading other distributor's contacts
- `npm run build` passes

=== WHEN COMPLETE ===
1. Run `npm run build` — must pass
2. Git commit: "stage-2: auth, middleware, RLS"
3. Git tag: stage-2-complete
4. Update BUILD-STATE.md: Stage 2 = ✅ Complete
5. Output the Stage 3 prompt (below)
---END STAGE 2 PROMPT---
```

---

## STAGE 3: Corporate Marketing Pages

_This prompt is output by Stage 2 when complete._

```
---BEGIN STAGE 3 PROMPT---
STOP. Read these files before writing any code:
- CLAUDE.md
- SPEC-PAGES.md > Corporate Marketing Page
- SPEC-DEPENDENCY-MAP.md > FEATURE 1: Corporate Marketing Site

You are building Stage 3 of the Apex Affinity Group Platform. Stages 1-2 complete (schema, auth). This stage converts the Optive HTML template into Next.js components for the corporate marketing page.

=== CONTEXT ===
The Optive HTML template is in the project. Use it as the visual reference:
- html/index.html (primary layout reference)
- html/css/custom.css (styling reference)
- html/images/ (assets)

We are NOT using the Optive CSS/JS directly. We are rebuilding the layout and visual design as React/Tailwind components. The structure and visual feel should match, but the code is modern Next.js.

=== WHAT TO BUILD ===

1. Marketing layout (src/components/marketing/):
   - MarketingHeader: Apex logo (placeholder), nav links, "Join Now" CTA, mobile hamburger, sticky on scroll
   - MarketingFooter: Company info, quick links, social icons, legal links, copyright
   - HeroSection: Title, subtitle, CTA button, background image/gradient
   - AboutSection: Company overview, animated stat counters
   - OpportunitySection: How it works (3 steps), benefits cards
   - TestimonialsSection: Carousel (use CSS scroll-snap, no Swiper dependency)
   - CTASection: "Ready to start?" with big CTA button

2. Corporate page (src/app/(public)/page.tsx):
   - Server component
   - Load site_content from DB (with hardcoded fallbacks if not seeded)
   - Compose all marketing sections
   - SEO: meta title, description, Open Graph

3. Seed data (src/lib/db/seed.ts):
   - Default site_content records for all section keys
   - Company root distributor (the "no sponsor" fallback)
   - Default system_settings
   - One super admin account

4. Static assets:
   - Copy relevant Optive images to public/images/
   - Placeholder logo SVG

5. 404 page (src/app/not-found.tsx):
   - Friendly design, search for distributor, link to home

6. Global error page (src/app/error.tsx):
   - "Something went wrong" with retry

=== VERIFY ===
- / renders full marketing page with all sections
- Mobile responsive (375px, 768px, 1024px)
- Nav links scroll to sections
- "Join Now" links to /join
- Images lazy load
- Lighthouse > 85
- `npm run build` passes

=== WHEN COMPLETE ===
1. `npm run build` — must pass
2. Git commit: "stage-3: corporate marketing pages"
3. Git tag: stage-3-complete
4. Update BUILD-STATE.md
5. Output the Stage 4 prompt (below)
---END STAGE 3 PROMPT---
```

---

## STAGE 4: Replicated Pages + Sign-Up

_This prompt is output by Stage 3 when complete._

```
---BEGIN STAGE 4 PROMPT---
STOP. Read these files before writing any code:
- CLAUDE.md
- SPEC-PAGES.md > Replicated Distributor Page, Sign-Up Page
- SPEC-WORKFLOWS.md > WF-1 (Sign-Up), WF-2 (Username Check), WF-3 (Contact Form)
- SPEC-DATA-MODEL.md > matrix_positions (placement algorithm)
- SPEC-DEPENDENCY-MAP.md > FEATURE 2 (Replicated Page), FEATURE 3 (Sign-Up Flow)

This is the most complex stage. Stages 1-3 complete. This stage builds the replicated distributor pages, sign-up flow with matrix placement, contact form, and username availability check.

=== WHAT TO BUILD ===

1. Replicated page (src/app/(public)/[username]/page.tsx):
   - Dynamic route, lookup distributor by username (case-insensitive)
   - If not found or suspended → notFound()
   - Server component, fetch distributor data
   - Header: Apex logo + distributor name + circular photo (or initials avatar)
   - Reuse marketing sections but personalized ("Join [Name]'s Team")
   - Contact form component (client component)
   - "Join My Team" CTA → /join/{username}
   - SEO: "[Name] — Apex Affinity Group", OG with photo
   - Track page_view in signup_analytics

2. Contact form (src/components/marketing/ContactForm.tsx):
   - Client component with 'use client'
   - Fields: name, email, phone (optional), message
   - Zod validation (use contactFormSchema from types)
   - Submit via server action
   - Rate limiting: 3/hour per IP
   - Success/error toasts
   - Server action: validate → rate limit → save to contact_submissions → email via Resend → create notification → log activity
   - See SPEC-DEPENDENCY-MAP Feature 2 > UI: Contact Form for ALL atoms

3. Username check API (src/app/api/check-username/route.ts):
   - GET with query params: username, firstName, lastName
   - Validate format (usernameSchema)
   - Check availability in DB
   - Generate suggestions if taken
   - Rate limit: 20/min per IP
   - Return { available, suggestions? }

4. Sign-up page (src/app/(public)/join/[username]/page.tsx):
   - Lookup enroller by username → show their name/photo
   - Form: first name, last name, email, phone, password, confirm password, username, terms
   - Username auto-generates from name, real-time availability check (debounced 500ms)
   - Green check / red X with clickable suggestions

5. Sign-up server action (src/lib/actions/signup.ts):
   - Validate all fields (signUpSchema)
   - Check username + email availability (final server check)
   - Create auth user via Supabase Auth
   - Create distributor record
   - Run matrix placement algorithm
   - Create drip enrollment
   - Send welcome email + enroller notification
   - Log everything
   - ALL IN ONE TRANSACTION — rollback if anything fails
   - See WF-1 for exact step-by-step
   - See SPEC-DEPENDENCY-MAP Feature 3 for ALL atoms

6. Matrix placement algorithm (src/lib/matrix/placement.ts):
   - findNextOpenPosition(enrollerId): MatrixPosition
   - BFS from enroller's position
   - Find shallowest node with < 5 children
   - Create matrix_position record
   - Update path + nested set values
   - Set is_spillover based on whether parent's distributor = enroller
   - Use DB transaction + row lock (SELECT ... FOR UPDATE)
   - UNIT TEST THIS FUNCTION: test direct placement, spillover, full level, concurrent placement

7. Generic sign-up (/join/page.tsx):
   - Same as /join/[username] but enroller = company root
   - Header says "Join Apex Affinity Group"

8. Email templates (src/lib/email/):
   - welcomeEmail(distributor) → sent to new distributor
   - newTeamMemberEmail(enroller, newMember) → sent to enroller
   - contactNotificationEmail(distributor, submission) → sent on contact form
   - spilloverNotificationEmail(parentDistributor, newMember) → sent when spillover
   - All use Resend, all wrapped in try/catch (never block main flow)

=== VERIFY ===
- /j.smith loads (after seeding a test distributor)
- /nonexistent shows 404
- Contact form submits, saves to DB, sends email
- /join/j.smith shows sign-up form with enroller info
- Username auto-generates and checks in real-time
- Sign-up creates distributor + matrix position
- Direct enrollment: is_spillover = false
- Spillover: fill 5 slots, 6th person goes to subtree, is_spillover = true
- Matrix placement unit tests pass
- Concurrent sign-up test: two simultaneous sign-ups don't get same position
- `npm run build` passes

=== WHEN COMPLETE ===
1. `npm run build` — must pass
2. Git commit: "stage-4: replicated pages, sign-up, matrix placement"
3. Git tag: stage-4-complete
4. Update BUILD-STATE.md
5. Output the Stage 5 prompt (below)
---END STAGE 4 PROMPT---
```

---

## STAGE 5: Distributor Back Office

_This prompt is output by Stage 4 when complete._

```
---BEGIN STAGE 5 PROMPT---
STOP. Read these files before writing any code:
- CLAUDE.md
- SPEC-PAGES.md > Dashboard pages (6-10)
- SPEC-WORKFLOWS.md > WF-4 (Profile), WF-5 (Photo), WF-6 (Genealogy)
- SPEC-DEPENDENCY-MAP.md > FEATURE 4 (Back Office)

Stages 1-4 complete. This stage builds the entire distributor back office.

=== WHAT TO BUILD ===

1. Dashboard layout (src/app/(dashboard)/dashboard/layout.tsx):
   - Sidebar: Profile, My Team, Contacts, Stats, Logout
   - Mobile: collapse to bottom tab bar or hamburger
   - Top bar: distributor name, notification bell with badge, logout
   - Notification dropdown: recent notifications, mark as read

2. Dashboard home (src/app/(dashboard)/dashboard/page.tsx):
   - Welcome message
   - Stats cards (total org, direct enrollees, new this month, unread contacts)
   - Replicated URL card with copy button + preview link
   - Recent activity feed
   - Quick links

3. Profile page (src/app/(dashboard)/dashboard/profile/page.tsx):
   - Profile form (first name, last name, phone, bio)
   - Photo section with upload + crop modal
   - Crop modal: react-easy-crop, circular 1:1, zoom slider
   - Upload to Supabase Storage (convert to WebP client-side)
   - Password change form
   - All per WF-4 and WF-5

4. Team page (src/app/(dashboard)/dashboard/team/page.tsx):
   - Tab: Tree View | List View
   - Tree View: react-d3-tree with custom ForeignObject nodes
     - Node shows: circular photo (40px), name, direct/spillover badge
     - Green border = direct enrollee (enroller_id = current user)
     - Orange border = spillover
     - Gray dashed = empty slot
     - Zoom +/-, pan, center button
     - Click node → detail panel
     - Lazy load: 3 levels initially, fetch more on expand
   - List View: table with sort, search, filter, pagination
   - Detail panel: slides from right, full member info
   - Empty state per spec

5. Contacts page (src/app/(dashboard)/dashboard/contacts/page.tsx):
   - Table with status badges (New blue, Read gray, Replied green, Archived muted)
   - Unread rows bold with accent border
   - Click → message detail (full message, sender info, reply mailto, archive)
   - Mark as read on open
   - Bulk actions: mark read, archive
   - Pagination, filter by status

6. Stats page (src/app/(dashboard)/dashboard/stats/page.tsx):
   - Stats cards
   - Sign-ups over time line chart (Recharts)
   - Org breakdown by level

7. Server actions for all dashboard operations:
   - getOrgTree(distributorId, depth)
   - getOrgList(distributorId, filters, pagination)
   - getContactSubmissions(distributorId, filters, pagination)
   - markContactAsRead(submissionId)
   - archiveContact(submissionId)
   - updateProfile(data)
   - uploadPhoto(file) → Supabase Storage
   - changePassword(current, new)
   - getDashboardStats(distributorId)
   - getNotifications(distributorId)
   - markNotificationRead(notificationId)

=== VERIFY ===
- Login as distributor → dashboard loads with correct stats
- Profile edit saves, photo upload + crop works, new photo shows on replicated page
- Team tree renders with correct colors (green/orange)
- Tree zoom, pan, expand work
- Click tree node → detail panel
- List view sorts, filters, paginates
- Contacts list shows submissions, click opens detail, mark as read works
- Stats page shows correct numbers and chart
- Notification bell shows unread count
- All empty states render correctly for new distributor
- Mobile: dashboard is usable on 375px
- `npm run build` passes

=== WHEN COMPLETE ===
1. `npm run build` — must pass
2. Git commit: "stage-5: distributor back office"
3. Git tag: stage-5-complete
4. Update BUILD-STATE.md
5. Output the Stage 6 prompt (below)
---END STAGE 5 PROMPT---
```

---

## STAGE 6: Admin Panel

_This prompt is output by Stage 5 when complete._

```
---BEGIN STAGE 6 PROMPT---
STOP. Read these files before writing any code:
- CLAUDE.md
- SPEC-PAGES.md > Admin pages (11-14)
- SPEC-WORKFLOWS.md > WF-7 (Suspend/Reactivate)
- SPEC-AUTH.md > Admin role permissions
- SPEC-DEPENDENCY-MAP.md > FEATURE 5 (Admin Panel)

Stages 1-5 complete. This stage builds the admin panel.

=== WHAT TO BUILD ===

1. Admin layout (src/app/(admin)/admin/layout.tsx):
   - Sidebar: Dashboard, Distributors, Org Tree, Settings
   - Admin-only styling (different accent color or admin badge)
   - Require admin role via middleware (already set in Stage 2)

2. Admin dashboard (src/app/(admin)/admin/page.tsx):
   - Total distributors, active/inactive/suspended counts
   - New this week/month
   - Sign-up funnel chart (from signup_analytics: page_view → started → completed)
   - Recent activity feed (all system activity)

3. Distributors list (src/app/(admin)/admin/distributors/page.tsx):
   - Table: Name, Username, Email, Enroller, Status badge, Joined Date
   - Search, filter by status, sort any column
   - Click row → distributor detail sheet/page
   - Suspend button (super_admin only): confirm dialog → update status + replicated_site_active → audit_log
   - Reactivate button: same flow, reverse
   - Export CSV
   - Pagination 50/page

4. Org tree (src/app/(admin)/admin/org-tree/page.tsx):
   - Full tree from root (same react-d3-tree component)
   - Colors: active (green), inactive (gray), suspended (red)
   - Search distributor → center tree on them
   - Lazy load subtrees

5. Settings (src/app/(admin)/admin/settings/page.tsx):
   - Load from system_settings table
   - Maintenance mode toggle
   - All changes → audit_log with before/after state

6. Server actions:
   - getAllDistributors(filters, pagination)
   - getDistributorDetail(id)
   - suspendDistributor(id) — super_admin only, audit log
   - reactivateDistributor(id) — super_admin only, audit log
   - getFullOrgTree(depth)
   - getAdminStats()
   - getSignupFunnel(dateRange)
   - updateSystemSetting(key, value) — super_admin only, audit log
   - exportDistributorsCSV()

=== VERIFY ===
- Login as admin → admin dashboard loads
- Distributors list shows all distributors, search works
- Suspend distributor → their replicated page returns 404, audit_log has entry
- Reactivate → page works again
- Org tree shows full organization from root
- Search in org tree centers on distributor
- Settings changes save and log to audit
- Distributor (non-admin) cannot access /admin
- Viewer role can see but cannot suspend
- `npm run build` passes

=== WHEN COMPLETE ===
1. `npm run build` — must pass
2. Git commit: "stage-6: admin panel"
3. Git tag: stage-6-complete
4. Update BUILD-STATE.md
5. Output the Stage 7 prompt (below)
---END STAGE 6 PROMPT---
```

---

## STAGE 7: Polish + Dependency Verification

_This prompt is output by Stage 6 when complete._

```
---BEGIN STAGE 7 PROMPT---
STOP. Read SPEC-DEPENDENCY-MAP.md completely. Then read every other spec file.

Stages 1-6 complete. This is the final stage. You will polish the app and verify every atom in the dependency map was implemented.

=== WHAT TO DO ===

1. DEPENDENCY MAP VERIFICATION:
   Open SPEC-DEPENDENCY-MAP.md. Go through EVERY ATOM, EVERY DEP, EVERY EDGE listed for all 6 features + cross-cutting. For each one:
   - Find the code that implements it
   - If it exists → mark as ✅
   - If it's missing → implement it now
   - If it's partially done → complete it
   Output a verification report at the end.

2. EMPTY STATES AUDIT:
   Visit every page that has a list/table. Verify there is an empty state with helpful CTA. Pages to check:
   - /dashboard (new distributor, no team)
   - /dashboard/team (no team members)
   - /dashboard/contacts (no messages)
   - /dashboard/stats (no data)
   - /admin/distributors (should never be empty, but check)

3. LOADING STATES AUDIT:
   Every page needs skeleton loading. Every form button needs spinner. Every async list needs skeleton rows. Check ALL pages.

4. ERROR STATES AUDIT:
   - 404 page exists and is helpful
   - 500 page exists
   - All server actions return user-friendly errors
   - All forms show inline validation errors
   - Network errors show toast

5. MOBILE AUDIT:
   Check every page at 375px width. All must be usable:
   - Corporate page: single column, readable
   - Replicated page: single column, form fills width
   - Sign-up: single column, sticky submit
   - Dashboard: sidebar collapses, tables scroll horizontally
   - Genealogy tree: simplified, scrollable

6. SECURITY AUDIT:
   - Rate limiting on: sign-up, contact form, username check
   - RLS on all tables (test by trying to access another distributor's data)
   - XSS: test pasting HTML into form fields
   - CSRF: test submitting forms from external origin
   - File upload: test uploading non-image file

7. ACCESSIBILITY:
   - All form fields have labels
   - All images have alt text
   - Color contrast > 4.5:1
   - Keyboard navigation works
   - Focus indicators visible

8. PERFORMANCE:
   - Run Lighthouse on / and /[username]
   - Target > 85 on both
   - Fix any issues

=== OUTPUT ===
When complete, output:

VERIFICATION REPORT:
- Total ATOMs in dependency map: [N]
- ATOMs verified: [N]
- ATOMs that were missing and fixed: [N] (list each)
- ATOMs not applicable: [N] (explain each)
- Empty states: [all present / X missing]
- Loading states: [all present / X missing]
- Error handling: [all present / X missing]
- Mobile: [all pages pass / X issues]
- Security: [all checks pass / X issues]
- Accessibility: [all checks pass / X issues]
- Lighthouse score: / = [score], /[username] = [score]

Then:
1. `npm run build` — must pass
2. Git commit: "stage-7: polish, verification, complete"
3. Git tag: stage-7-complete
4. Git tag: v1.0.0
5. Update BUILD-STATE.md: ALL stages complete, verification report
---END STAGE 7 PROMPT---
```

---

## POST-BUILD REVIEW

_Run this after Stage 7 is complete to generate a final review report._

```
You have just completed building the Apex Affinity Group Platform. Read ALL spec files:
- PROJECT-SPEC.md
- SPEC-DATA-MODEL.md
- SPEC-AUTH.md
- SPEC-PAGES.md
- SPEC-WORKFLOWS.md
- SPEC-DEPENDENCY-MAP.md
- CLAUDE.md

Now read every source file in the project. Compare what was built against what was specified.

For every feature in the spec:
1. Is it fully implemented? (yes/partially/no)
2. Does it match the spec exactly? (yes/deviates — explain how)
3. Are there edge cases the spec mentioned that aren't handled?

For every item in SPEC-DEPENDENCY-MAP.md:
1. Is the ATOM implemented?
2. Is the DEP present?
3. Is the EDGE handled?

Output a structured report:

=== POST-BUILD REVIEW ===

SPEC COMPLIANCE:
| Feature | Status | Deviations | Missing Edge Cases |
|---------|--------|-----------|-------------------|
| ... | ... | ... | ... |

DEPENDENCY MAP COMPLIANCE:
| Feature | Total Atoms | Implemented | Missing |
|---------|-------------|-------------|---------|
| ... | ... | ... | ... |

ISSUES FOUND:
1. [Issue description + which file + fix instruction]
2. ...

FIX PROMPTS:
For each issue, output a ready-to-paste fix prompt that addresses ONLY that issue.
```
