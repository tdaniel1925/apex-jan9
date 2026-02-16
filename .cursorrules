# CLAUDE.md — Apex Affinity Group Platform v1

## Project Overview
Apex Affinity Group marketing platform with replicated distributor pages, sign-up flow with 5×7 forced matrix auto-placement, distributor back office with genealogy visualization, and admin panel. Built on Next.js 15 + Supabase.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript strict mode (no `any`)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth (email/password)
- **UI:** shadcn/ui + Radix + Tailwind CSS
- **Genealogy Tree:** react-d3-tree (custom nodes via foreignObject)
- **Image Crop:** react-easy-crop
- **Charts:** Recharts
- **Email:** Resend
- **Deployment:** Vercel
- **Testing:** Vitest + Playwright

## File Structure
```
src/
  app/
    (public)/           # Corporate site, replicated pages
      page.tsx           # Corporate marketing page (/)
      [username]/        # Replicated distributor page
      join/              # Sign-up pages
        page.tsx         # Generic sign-up (no sponsor)
        [username]/      # Sponsor-specific sign-up
    (auth)/              # Login, forgot password
      login/
    (dashboard)/         # Distributor back office
      dashboard/
        page.tsx         # Dashboard home
        profile/
        team/
        contacts/
        stats/
    (admin)/             # Admin panel
      admin/
        page.tsx
        distributors/
        org-tree/
        settings/
    api/
      check-username/    # Public username availability check
      cron/              # Cron job endpoints
  components/
    ui/                  # shadcn/ui components
    marketing/           # Corporate + replicated page components
    dashboard/           # Back office components
    admin/               # Admin panel components
    genealogy/           # Tree + list components
  lib/
    db/                  # Drizzle schema, queries, client
    auth/                # Auth helpers, middleware
    matrix/              # Placement algorithm, tree queries
    email/               # Resend client, templates
    utils/               # Validators, formatters
    types/               # Shared types + Zod schemas
  hooks/                 # Custom React hooks
```

## Coding Rules

### General
- Every file under 300 lines. Split if larger.
- Every function under 50 lines. Extract helpers.
- No `any` type. Use `unknown` and narrow, or proper types.
- All data types in src/lib/types/ with Zod schemas.
- All DB queries in src/lib/db/ — components never import Drizzle directly.
- All matrix operations in src/lib/matrix/ — isolated, testable.
- Use Server Actions for mutations. API routes only for public endpoints (username check) and cron.
- Use Server Components by default. Add 'use client' only for interactivity.

### Database
- All tables: id (uuid), created_at, updated_at where applicable.
- Never hard delete. Set status or use archive pattern.
- All mutations in DB transactions where multiple tables are affected.
- RLS enforced on all tables. Never trust client-side IDs.
- Matrix placement MUST use row-level locks to prevent race conditions.

### UI
- Corporate pages: adapted from Optive HTML template, converted to React components.
- Dashboard/admin: shadcn/ui components with Tailwind.
- Every page: skeleton loading state.
- Every list: empty state with CTA.
- Every form: Zod validation, inline errors, loading button.
- Every mutation: success/error toast (sonner).
- Mobile responsive: all pages 375px+.

### Matrix Algorithm
- Placement function in src/lib/matrix/placement.ts — MUST be unit tested.
- BFS for auto-fill placement. Left-to-right, top-to-bottom.
- Track enroller_id (who recruited) separate from parent_id (matrix position).
- is_spillover = true when parent's distributor != enroller.
- Update materialized path + nested set values on every placement.
- Max depth = 7, max width = 5 per position.

### Security
- Rate limit public endpoints (sign-up, contact form, username check).
- Sanitize all user input for display (XSS prevention).
- Audit log for all admin destructive actions.
- File uploads: server-side MIME validation, max 5MB.

### Spec Traceability
Every component references its spec:
```typescript
// SPEC: SPEC-PAGES > Replicated Distributor Page
// SPEC: SPEC-WORKFLOWS > WF-1: Distributor Sign-Up
// DEP-MAP: FEATURE 3 > Sign-Up Flow > SERVER > Matrix placement
```

## Environment Variables
See .env.example for complete list. App refuses to start if required vars missing.
