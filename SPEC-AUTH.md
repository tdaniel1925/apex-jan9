# SPEC-AUTH.md — Apex Affinity Group Platform v1

## Gate 1: Auth & Permissions

---

## Roles

| Role | Auth Method | Access |
|------|------------|--------|
| Super Admin | Email/password | /admin/*, full read/write on everything |
| Admin | Email/password | /admin/*, read all, limited write |
| Viewer (admin) | Email/password | /admin/*, read only |
| Distributor | Email/password | /dashboard/*, own data + downline data only |
| Visitor | Unauthenticated | /, /{username}, /join/{username}, /login |

---

## Permission Matrix

| Action | Visitor | Distributor | Admin | Super Admin |
|--------|---------|-------------|-------|-------------|
| View corporate page | ✅ | ✅ | ✅ | ✅ |
| View replicated page | ✅ | ✅ | ✅ | ✅ |
| Submit contact form | ✅ | ✅ | ✅ | ✅ |
| Sign up as distributor | ✅ | ❌ | ❌ | ❌ |
| View own profile | ❌ | ✅ | ❌ | ❌ |
| Edit own profile | ❌ | ✅ | ❌ | ❌ |
| Upload/crop photo | ❌ | ✅ | ❌ | ❌ |
| View own genealogy tree | ❌ | ✅ | ❌ | ❌ |
| View own contacts | ❌ | ✅ | ❌ | ❌ |
| View downline member info | ❌ | ✅ (own org only) | ✅ | ✅ |
| View all distributors | ❌ | ❌ | ✅ | ✅ |
| View full org tree | ❌ | ❌ | ✅ | ✅ |
| Suspend distributor | ❌ | ❌ | ❌ | ✅ |
| Reactivate distributor | ❌ | ❌ | ❌ | ✅ |
| Edit system settings | ❌ | ❌ | ❌ | ✅ |
| View admin dashboard | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ❌ | ✅ | ✅ |

---

## Route Protection

| Route Pattern | Required Auth | Required Role |
|--------------|--------------|---------------|
| / | None | Any |
| /[username] | None | Any |
| /join/[username] | None | Any |
| /login | None (redirect to dashboard if already logged in) | Any |
| /dashboard/* | Authenticated | Distributor |
| /admin/* | Authenticated | Admin or Super Admin |
| /api/check-username | None (rate limited) | Any |
| /api/cron/* | Cron secret header | System |

---

## Middleware (src/middleware.ts)

1. Check auth session on every request
2. `/dashboard/*` → if no session, redirect to `/login?redirect=/dashboard`
3. `/admin/*` → if no session, redirect to `/login?redirect=/admin`. If session but not admin, redirect to `/dashboard`
4. `/login` → if already authenticated distributor, redirect to `/dashboard`. If admin, redirect to `/admin`
5. All other routes → pass through (public)

---

## RLS Policies

### distributors
- SELECT: Distributors can read their own row. Distributors can read any distributor in their downline (via matrix_positions subtree query). Admins can read all.
- UPDATE: Distributors can update their own row only (specific columns: first_name, last_name, phone, bio, photo_url, photo_crop_data). Admins cannot update distributor profiles (distributors own their data).
- INSERT: Service role only (sign-up flow runs as service role).
- DELETE: No deletes (soft delete via status change).

### matrix_positions
- SELECT: Distributors can read positions in their subtree. Admins can read all.
- INSERT: Service role only (placement algorithm).
- UPDATE: Service role only (matrix restructuring, future).
- DELETE: No deletes.

### contact_submissions
- SELECT: Distributors can read submissions where distributor_id = their id. Admins can read all.
- INSERT: Anon (public contact form, validated server-side).
- UPDATE: Distributors can update status of their own submissions.
- DELETE: No deletes.

### notifications
- SELECT: Distributors can read their own notifications.
- UPDATE: Distributors can mark their own as read.
- INSERT: Service role only.
- DELETE: No deletes.

### activity_log, audit_log
- SELECT: Admins can read all. Distributors can read activity_log entries for their own org.
- INSERT: Service role only.
- UPDATE/DELETE: Never.

### admin_users
- SELECT: Admins can read all admin records.
- INSERT/UPDATE/DELETE: Super admin only via service role.

### site_content, system_settings
- SELECT: Public (site_content is displayed on marketing pages). system_settings: admin only.
- UPDATE: Super admin only.

---

## Security Hardening

- All passwords hashed via Supabase Auth (bcrypt)
- Session tokens stored in httpOnly cookies via Supabase SSR
- CSRF protection on all mutation endpoints
- XSS prevention: sanitize all user-generated content before rendering (DOMPurify)
- SQL injection: all queries via Drizzle ORM (parameterized)
- Rate limiting on public endpoints (sign-up, contact form, username check)
- File upload validation: server-side MIME type check, max 5MB
- Audit log for all admin actions (before/after state)
- No sensitive data in client-side JavaScript (service role key never exposed)
- CORS: only theapexway.net and localhost:3000
- HSTS, X-Frame-Options: DENY, CSP headers via Next.js config
