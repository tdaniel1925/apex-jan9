# PROJECT-SPEC.md — Apex Affinity Group Platform v1

## Gate 0: Project Overview

### Identity
- **App Name:** Apex Affinity Group Platform
- **Domain:** theapexway.net
- **Owner:** Apex Affinity Group
- **Built by:** BotMakers Inc.

### Problem
Apex Affinity Group is an MLM/network marketing company that needs a web platform for distributors to market the opportunity and grow their organizations. Currently there is no centralized system for distributor replicated websites, sign-up tracking, genealogy visualization, or back office management. Distributors have no professional online presence tied to the company, and there's no automated way to enroll new members, track organizational structure, or manage a 5×7 forced matrix.

### Solution
A two-part web application:
1. **Corporate marketing site** at the root domain — professional company landing page adapted from the Optive HTML template with opportunity info, leadership, and company overview.
2. **Replicated distributor sites** at `/{username}` — one-page landing pages personalized with the distributor's name, photo, and contact form. Includes a "Join My Team" sign-up flow that auto-enrolls new distributors into the 5×7 forced matrix.
3. **Distributor back office** — dashboard with profile management (including photo upload + crop), genealogy tree visualization (interactive, color-coded, zoomable), contact form submissions, and organization stats.
4. **Admin panel** — full visibility into all distributors, entire org tree, account management.
5. **Atomic dependency map** — AI-generated decomposition of every feature into buildable atoms, dependencies, and edge cases. Used during spec generation to catch gaps and after build as a verification pass.

### Roles
- **Super Admin:** Full access to everything. Manage all distributors, view entire org, manage corporate site content, system settings.
- **Distributor:** Manage their profile, view their replicated site, see their genealogy tree, view contact form submissions, see organization stats. Can only see data within their own downline.
- **Visitor (unauthenticated):** View corporate marketing page, view any distributor's replicated page, submit contact form, sign up as new distributor.

### Entities (13 tables)
distributors, matrix_positions, contact_submissions, drip_enrollments, activity_log, admin_users, site_content, distributor_sessions, username_suggestions, signup_analytics, notifications, system_settings, audit_log

### Integrations
- **Supabase Auth:** Email/password for distributors and admins
- **Supabase Storage:** Profile photo uploads
- **Twilio (future):** SMS notifications for contact form submissions
- **Resend:** Email notifications (contact form alerts, welcome emails, drip campaign future)
- **react-d3-tree:** Genealogy tree visualization
- **react-image-crop:** Profile photo crop before upload

### Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth (email/password)
- **UI:** shadcn/ui + Radix + Tailwind CSS
- **Template Base:** Optive Business Consulting HTML (adapted to Next.js components)
- **Genealogy:** react-d3-tree (custom nodes with foreignObject)
- **Image Crop:** react-image-crop or react-easy-crop
- **Email:** Resend
- **Deployment:** Vercel
- **Testing:** Vitest + Playwright

### Branding
- **Colors:** Placeholder until client provides — using neutral professional palette
- **Logo:** Placeholder until client provides Apex logo assets
- **Font:** Mona Sans + Public Sans (from Optive template)
- **Template:** Optive HTML template adapted to Next.js, rebranded for Apex

### URL Structure
- `/` — Corporate marketing page (not replicated)
- `/{username}` — Distributor replicated page (e.g., `/j.smith`)
- `/join/{username}` — Sign-up form for that distributor's team
- `/login` — Distributor + admin login
- `/dashboard` — Distributor back office
- `/dashboard/profile` — Edit profile, photo upload + crop
- `/dashboard/team` — Genealogy tree + list view
- `/dashboard/contacts` — Contact form submissions
- `/dashboard/stats` — Organization statistics
- `/admin` — Admin panel
- `/admin/distributors` — All distributors list
- `/admin/org-tree` — Full organization tree
- `/admin/settings` — System settings

### Build Stage Mapping
- Stage 1: Schema, types, env validation, Drizzle setup → reads SPEC-DATA-MODEL.md
- Stage 2: Auth, middleware, RLS policies → reads SPEC-AUTH.md
- Stage 3: Corporate marketing pages (Optive adaptation) → reads SPEC-PAGES.md
- Stage 4: Replicated distributor pages + sign-up flow → reads SPEC-PAGES.md + SPEC-WORKFLOWS.md
- Stage 5: Distributor back office (profile, genealogy, contacts) → reads SPEC-PAGES.md + SPEC-WORKFLOWS.md
- Stage 6: Admin panel → reads SPEC-PAGES.md + SPEC-WORKFLOWS.md
- Stage 7: Polish, dependency map verification, testing → reads SPEC-AI.md + SPEC-DEPENDENCY-MAP.md

### Matrix Structure
- **Type:** 5×7 forced matrix
- **Width:** 5 (each position can have up to 5 directly under them)
- **Depth:** 7 levels
- **Placement:** Auto-fill, left-to-right, top-to-bottom
- **Tracking:** Enroller (who recruited, always URL slug owner) tracked separately from Parent (matrix position, may differ due to spillover)
- **Node colors:** Green = direct enrollee of viewing distributor, Orange = spillover placement
- **Max positions per full matrix:** 5 + 25 + 125 + 625 + 3,125 + 15,625 + 78,125 = 97,655
