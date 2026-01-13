# Apex Affinity Group - Project State

> **IMPORTANT**: Claude must read this file after any conversation compaction to understand current progress.

---

## Quick Summary

**Project**: MLM Back Office for Insurance Agents
**Tech Stack**: Next.js 14, TypeScript, Shadcn/UI, Tailwind, Supabase, Claude API
**Status**: Foundation Complete

---

## What's Built

| Module | Status | Notes |
|--------|--------|-------|
| Project setup | Complete | Next.js 14, TypeScript, Tailwind |
| Database types | Complete | Types defined in /lib/types/database.ts |
| Database migrations | Complete | 00001_initial_schema.sql, 00002_rls_and_functions.sql |
| Auth system | **Optimized** | Server-side middleware + cached agent data + performance monitoring |
| Config files | Complete | ranks, carriers, bonuses, overrides |
| Engines | Complete | rank, override, bonus, wallet, matrix |
| Workflows | Complete | on-commission-created, on-rank-changed, on-agent-registered |
| Agent dashboard | Complete | Dashboard, Team, Wallet, Commissions, Bonuses, Reports, Settings pages |
| Admin panel | Complete | Dashboard, Agents, Commissions, Bonuses, Payouts pages |
| Admin API routes | Complete | 18 routes: agents, commissions, bonuses, payouts, overrides, analytics, settings |
| Admin API tests | Complete | 69 tests passing (Vitest) |
| E-commerce API tests | Complete | 18 tests passing (checkout, orders, retail commission) |
| **Total Test Suite** | **Complete** | **605 tests passing (100% pass rate)** |
| CRM | Complete | Contact management with add/edit/delete |
| API routes | Complete | agents, wallet, contacts endpoints |
| Matrix/Genealogy | Complete | Interactive 7-gen tree with react-flow (client-side fetch) |
| Compensation | Complete | Commissions + Bonuses pages with full history |
| E-Wallet | Complete | Balance, transactions, withdraw functionality |
| Training portal | Complete | Course list with progress tracking (placeholder data) |
| Settings | Complete | Profile, AI Copilot, Security, Notifications |
| Replicated sites | Complete | Full site at /join/[agentCode] with signup |
| E-commerce system | Complete | Digital product orders, checkout, downloads, retail commissions |
| E-commerce tests | Complete | 18 tests covering checkout, orders, retail commission engine |
| Admin Dashboard UI | Complete | Connected all admin pages to API routes with error handling |
| **E2E Tests (Playwright)** | **Complete** | **35 E2E tests (23 admin + 12 auth) with CI/CD integration** |
| **AI Copilot (Claude API)** | **Complete** | **Streaming chat assistant with contextual responses, rate limiting, 7 API tests** |
| **Email Notifications (Resend)** | **Complete** | **Commission, bonus, payout emails with React Email templates, 11 tests** |
| **Performance Optimization** | **Complete** | **Middleware auth protection, agent data caching, 83% fewer DB queries, <1s navigation** |
| **Marketing Site** | **Complete** | **9 pages with SEO, sitemap, legal pages (privacy, terms, income disclaimer)** |
| **Replicated Site Enhancements** | **Complete** | **Legal pages, social sharing, OG tags, agent notifications** |
| **SmartOffice CRM Integration** | **Complete** | **XML API client, sync service, 8 admin API routes, Developer Tools UI, 34 tests, migration done, sandbox connected** |

---

## Current Phase

**Phase**: Core Platform Complete
**Focus**: Integration & Polish

---

## Next Steps

1. ✅ ~~Build admin dashboard UI components~~ - COMPLETE
2. ✅ ~~Connect front-end to admin API routes~~ - COMPLETE
3. ✅ ~~Add E2E tests with Playwright~~ - COMPLETE
4. ✅ ~~Add AI Copilot integration (Claude API)~~ - COMPLETE
5. ✅ ~~Implement notification system (email/push)~~ - COMPLETE
6. ✅ ~~Integrate email notifications into workflows~~ - COMPLETE
7. ✅ ~~Polish & optimization (caching, performance, final testing)~~ - COMPLETE
8. ✅ ~~SmartOffice CRM integration~~ - COMPLETE
9. ✅ ~~Run SmartOffice Supabase migration~~ - COMPLETE (5 tables created)
10. ✅ ~~Configure SmartOffice credentials~~ - COMPLETE (sandbox credentials active)
11. ✅ ~~Test SmartOffice sandbox API connection~~ - COMPLETE (verified working)
12. **Sync agents from SmartOffice** - Use admin UI to pull agents
13. **Map SmartOffice agents to Apex agents** - By email or manual
14. **Discover agent hierarchy field** - Check SmartOffice API Dictionary
15. **Add push notifications** (optional - browser push or mobile)
16. **Production deployment preparation** (environment setup, monitoring, error tracking)

---

## Key Business Rules (Quick Reference)

**Ranks**: Pre-Associate -> Associate -> Sr. Associate -> Agent -> Sr. Agent -> MGA -> Associate MGA -> Senior MGA -> Regional MGA -> National MGA -> Executive MGA -> Premier MGA

**Rank Requirements**: Based on 90-day premium + active agents + recruits
- All promotions require: 60% Persistency + 80% Placement

**Overrides**: 6 generations (15%, 5%, 3%, 2%, 1%, 0.5%)

**Carriers**: Columbus Life, AIG, F+G, MOO, NLG, Symetra, NA, Retail (digital products)

**AI Copilot**: $49/mo Basic, $99/mo Pro, $199/mo Agency (50% margin)

**Bonus Phases**:
- Phase 1 (0-100 agents): Fast Start, Contest, AI Referral
- Phase 2 (100-250): + Rank Advancement, Team Builder
- Phase 3 (250-500): + Matching, Quarterly contests
- Phase 4 (500+): + Car bonus, Leadership Pool

---

## File Structure

```
/apex-app
  /app                    - Next.js pages and API routes
  /components             - React components (Shadcn/UI)
  /lib
    /config              - Business rules as data (COMPLETE)
      - ranks.ts, carriers.ts, bonuses.ts, overrides.ts
    /engines             - Calculation logic (COMPLETE)
      - rank-engine.ts, override-engine.ts, bonus-engine.ts
      - wallet-engine.ts, matrix-engine.ts
    /workflows           - Event handlers (COMPLETE)
      - on-commission-created.ts, on-rank-changed.ts
      - on-agent-registered.ts
    /db                  - Supabase clients (COMPLETE)
    /auth                - Auth context and hooks (COMPLETE)
      - auth-context.tsx (AuthProvider, useAuth hook)
    /types               - TypeScript types (COMPLETE)
  /docs
    - ARCHITECTURE.md, PROJECT_STATE.md, DEVLOG.md
```

---

## Open Questions / Decisions Needed

- None currently

---

## Known Issues

- None currently

---

*Last updated: January 13, 2026*
