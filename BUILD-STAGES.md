# BUILD-STAGES.md — Apex Affinity Group Platform v1

## Stage Overview

| Stage | Name | Reads | Builds | Verifies |
|-------|------|-------|--------|----------|
| 1 | Schema & Types | SPEC-DATA-MODEL, CLAUDE.md, .env.example | Drizzle schema, types, Zod schemas, env validation, DB migrations | All tables exist, types compile, env validated |
| 2 | Auth & Middleware | SPEC-AUTH | Supabase Auth setup, middleware, RLS policies, role detection | Protected routes redirect, RLS blocks unauthorized |
| 3 | Corporate Marketing Pages | SPEC-PAGES (public pages), SPEC-DEPENDENCY-MAP (Feature 1) | Optive template → Next.js components, header, footer, hero, sections, mobile responsive | / loads, all sections render, mobile works, Lighthouse > 85 |
| 4 | Replicated Pages + Sign-Up | SPEC-PAGES, SPEC-WORKFLOWS (WF-1, WF-2, WF-3), SPEC-DEPENDENCY-MAP (Features 2, 3) | Dynamic /[username] route, sign-up form, username check API, matrix placement algorithm, contact form, email notifications | /j.smith loads, sign-up creates distributor + matrix position, contact form saves + emails, username check works real-time |
| 5 | Distributor Back Office | SPEC-PAGES (dashboard pages), SPEC-WORKFLOWS (WF-4, WF-5, WF-6), SPEC-DEPENDENCY-MAP (Feature 4) | Dashboard, profile + photo crop, genealogy tree + list, contacts, stats | Login → dashboard, profile edits save, photo crops + uploads, tree renders with colors, contacts list + detail work |
| 6 | Admin Panel | SPEC-PAGES (admin pages), SPEC-WORKFLOWS (WF-7), SPEC-DEPENDENCY-MAP (Feature 5) | Admin dashboard, distributors list, org tree, settings, suspend/reactivate | Admin login → admin panel, full distributor list, full org tree, suspend works with audit log |
| 7 | Polish + Dependency Verification | SPEC-DEPENDENCY-MAP (all), SPEC-PAGES (error pages, empty states) | Error pages, empty states audit, loading states audit, mobile audit, accessibility pass, dependency map verification | Every ATOM in dependency map verified, all empty states exist, all loading states exist, mobile works on all pages, build passes |

## Stage Rules

1. Complete each stage fully before moving to the next.
2. Run `npm run build` after every stage. Fix all errors before proceeding.
3. Git commit + tag at the end of each stage: `git tag stage-N-complete`
4. Check SPEC-DEPENDENCY-MAP.md for the relevant feature's atoms before marking complete.
5. Update BUILD-STATE.md after each stage.
6. Each stage prompt outputs the next stage's prompt — staff only pastes Stage 1 manually.
