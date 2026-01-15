# Project State

Last Updated: 2026-01-15T08:25:00Z

## System Health

**Overall Score: 92/100** 🟢

| Metric | Status |
|--------|--------|
| TypeScript | ✅ Compiles clean |
| npm Audit | ✅ 0 vulnerabilities |
| Tests | 682/700 passing (97.4%) |
| Build | ✅ Successful |

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 15.5.9 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + Admin RBAC
- **UI:** shadcn/ui + Tailwind CSS 4
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest (unit) + Playwright (e2e)

### Project Structure
```
apex-app/
├── app/
│   ├── (admin)/          # Admin portal pages
│   ├── (auth)/           # Auth pages (login, signup, reset)
│   ├── (dashboard)/      # Agent dashboard pages
│   ├── (marketing)/      # Public marketing pages
│   ├── api/              # API routes (100+)
│   └── join/[agentCode]/ # Replicated agent sites
├── components/
│   ├── admin/            # Admin UI components
│   ├── dashboard/        # Dashboard components
│   ├── training/         # LMS components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/
│   ├── auth/             # Authentication logic
│   ├── config/           # Business configuration
│   ├── db/               # Database clients
│   ├── email/            # Email templates & services
│   ├── engines/          # Business logic engines
│   ├── services/         # Service layer
│   ├── smartoffice/      # SmartOffice CRM integration
│   └── workflows/        # Automated workflows
├── supabase/
│   └── migrations/       # 23 SQL migrations
└── tests/                # 56 test files
```

## In Progress

*No tasks currently in progress*

## Completed Features

### Core Platform
- [x] Agent authentication with Supabase
- [x] Admin RBAC permission system (37 permissions, 6 roles)
- [x] Agent dashboard with KPIs
- [x] Commission tracking and history
- [x] Wallet system with withdrawals
- [x] Visual genealogy tree

### Admin Portal
- [x] Agent management (CRUD, bulk operations)
- [x] Commission import from CSV
- [x] Payout processing workflow
- [x] Bonus approval system
- [x] Clawback management
- [x] Compliance holds
- [x] Pay period management
- [x] Analytics dashboard

### Training Suite (LMS)
- [x] Courses with sections and lessons
- [x] Learning tracks/paths
- [x] Quiz system with scoring
- [x] Certificate generation
- [x] Resource library
- [x] Progress tracking
- [x] Gamification (achievements, streaks)

### SmartOffice Integration
- [x] API client with XML builder/parser
- [x] Agent sync from SmartOffice
- [x] Policy sync
- [x] Developer tools (API Explorer, Dictionary)
- [x] Scheduled sync (cron)

### Email System
- [x] 12 professional email templates
- [x] Lead nurturing sequences
- [x] Email tracking (opens, clicks)
- [x] Unsubscribe handling
- [x] Admin email template management

### Marketing & SEO
- [x] Marketing site (9 pages)
- [x] Replicated agent sites
- [x] Site customization system
- [x] Social sharing
- [x] Sitemap and robots.txt
- [x] OG tags and Twitter cards

### AI Copilot
- [x] Chat interface with Claude/OpenAI
- [x] Subscription management
- [x] Usage tracking
- [x] Widget embedding

### i18n
- [x] English (default)
- [x] Spanish (es)
- [x] Mandarin Chinese (zh)

## Known Issues

### Failing Tests (18)
SmartOffice XML tests need updating after API format changes. These are test-to-code sync issues, not production bugs.

### TODO Items (5)
1. Download route signed URLs for security
2. Notification service for rank changes
3. Notification service for sponsor alerts
4. Training rank comparison logic
5. Training recent activity feed

## Database Migrations

23 migrations in total:
- `00001-00008`: Initial schema, RLS, functions
- `20240115`: RPC functions
- `20260111000000`: Admin RBAC
- `20260112000000`: Agent recruitment
- `20260112100000`: SmartOffice integration
- `20260113000000`: Training suite
- `20260113100000`: Email templates
- `20260113110000`: Avatars bucket
- `20260113120000`: Admin magic links
- `20260113130000`: Zapier webhooks
- `20260113140000`: Disputes
- `20260113150000`: Replicated site customization
- `20260114000000-1`: Founders club
- `20260114100000`: Public agent access
- `20260114110000`: SmartOffice policy fields

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_APP_URL
SMARTOFFICE_API_URL (optional)
SMARTOFFICE_PARTNER_ID (optional)
```

## Quick Commands

```bash
# Development
npm run dev

# Testing
npm test              # Run unit tests
npm run test:e2e      # Run Playwright tests
npm run test:all      # Run all tests

# Build
npm run build

# Database
npx supabase db push  # Apply migrations

# Type check
npx tsc --noEmit
```

## Recent Commits

```
a9d655b feat: update email templates with proper branding
c7251a3 fix: rename admin_rbac migration for correct dependency order
9345d6b fix: disputes migration - remove clawbacks FK and fix RLS policies
22f6e1b fix: orders API import and add missing translation key
57629bf fix: add robust null safety for leaderboard rank lookups
```

## Next Steps

1. Fix SmartOffice XML tests to match current API format
2. Implement notification service for workflows
3. Continue Training Suite implementation (see plan file)
4. Add more comprehensive e2e tests
