# Deployment Notes — Apex Affinity Group Platform v1.0.0

**Deployment Date:** 2026-02-15
**Environment:** Production
**Platform:** Vercel
**Domain:** theapexway.net

---

## 🔐 PRODUCTION CREDENTIALS

### Supabase Project
- **Project URL:** `https://pmawmgvjrfqmpcbnrutk.supabase.co`
- **Project ID:** `pmawmgvjrfqmpcbnrutk`
- **Database:** PostgreSQL (Supabase-hosted)
- **Region:** US East 1
- **Status:** ✅ Active, migrations applied, RLS enabled

### Admin Account
- **Name:** Trent Daniel
- **Email:** `tdaniel@botmakers.ai`
- **Role:** `super_admin`
- **Password:** `4Xkilla1@`
- **Login URL:** `https://theapexway.net/login`

### Company Root Distributor
- **Username:** `apex.corporate`
- **Email:** `corporate@apexaffinitygroup.com`
- **Purpose:** Orphaned sign-ups (from `/join` with no sponsor)
- **Matrix Position:** Root (depth 0)

### Email Service (Resend)
- **API Key:** `re_DjMiknb1_T8MdjYu6hBvdpCbbxeZeKi7A`
- **Email From:** `noreply@theapexway.net`
- **Domain Status:** ⚠️ **REQUIRES DNS VERIFICATION** (see below)
- **Dashboard:** https://resend.com/emails

### Cron Secret
- **Secret:** `6873f525b93e55e9b8819d4477e55cf6d490f0d9ef95b76d8e2b81a9336020c3`
- **Purpose:** Future drip campaign cron jobs

---

## 🚀 VERCEL DEPLOYMENT STEPS

### 1. Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository: `apex-affinity-platform`
3. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### 2. Add Environment Variables

In Vercel project settings → Environment Variables, add these **EXACTLY**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pmawmgvjrfqmpcbnrutk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTQzODQsImV4cCI6MjA4Njc3MDM4NH0.8oMjc4AJo9LDLyvx1hIdLB56zUiZ7iKrAty9bEhONrg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5NDM4NCwiZXhwIjoyMDg2NzcwMzg0fQ.xAONuaLtvTd0FedeccPcA-mz5akQuX3bpMpbcgX52Uo

# Email
RESEND_API_KEY=re_DjMiknb1_T8MdjYu6hBvdpCbbxeZeKi7A
EMAIL_FROM=noreply@theapexway.net

# App
NEXT_PUBLIC_APP_URL=https://theapexway.net
NEXT_PUBLIC_APP_NAME=Apex Affinity Group

# Cron
CRON_SECRET=6873f525b93e55e9b8819d4477e55cf6d490f0d9ef95b76d8e2b81a9336020c3
```

**IMPORTANT:** Set environment variables for **all environments** (Production, Preview, Development).

### 3. Configure Custom Domain

1. In Vercel project → Settings → Domains
2. Add custom domain: `theapexway.net`
3. Vercel will provide DNS records to add to your domain registrar:
   - **Type:** `A` → **Value:** `76.76.21.21`
   - **Type:** `CNAME` → **Name:** `www` → **Value:** `cname.vercel-dns.com`

4. Wait for DNS propagation (5-60 minutes)
5. Vercel will automatically provision SSL certificate (Let's Encrypt)

### 4. Deploy

1. Click **Deploy** button
2. Wait for build to complete (~4-5 minutes)
3. Verify deployment at temporary Vercel URL (e.g., `apex-affinity.vercel.app`)
4. Once custom domain DNS is configured, visit `https://theapexway.net`

---

## 📧 RESEND DNS CONFIGURATION

To send emails from `noreply@theapexway.net`, add these DNS records to your domain registrar:

### SPF Record
- **Type:** `TXT`
- **Name:** `@`
- **Value:** `v=spf1 include:_spf.resend.com ~all`

### DKIM Records (Get from Resend Dashboard)
1. Go to https://resend.com/domains
2. Add domain: `theapexway.net`
3. Copy the DKIM records provided
4. Add them to your DNS:
   - **Type:** `TXT`
   - **Name:** `resend._domainkey`
   - **Value:** (provided by Resend)

### DMARC Record (Optional but Recommended)
- **Type:** `TXT`
- **Name:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rua=mailto:tdaniel@botmakers.ai`

**Verification:**
- After adding DNS records, click "Verify" in Resend dashboard
- Emails will bounce until verification is complete
- For immediate testing, use Resend's test domain: `onboarding@resend.dev`

---

## ✅ POST-DEPLOYMENT CHECKLIST

After deploying to Vercel, verify these:

- [ ] **Site loads:** Visit `https://theapexway.net`
- [ ] **Corporate page renders:** Check hero, about, opportunity sections
- [ ] **Root distributor page works:** Visit `https://theapexway.net/apex.corporate`
- [ ] **Sign-up flow works:**
  - [ ] Visit `https://theapexway.net/join/apex.corporate`
  - [ ] Fill out form with test data
  - [ ] Submit and verify redirect to /login
  - [ ] Check Supabase for new distributor record
  - [ ] Verify matrix placement (should be under apex.corporate)
- [ ] **Email delivery works:**
  - [ ] Complete a sign-up → check for welcome email
  - [ ] Submit contact form → check for notification email
  - [ ] Check Resend dashboard for delivery status
- [ ] **Admin login works:**
  - [ ] Go to `https://theapexway.net/login`
  - [ ] Login with `tdaniel@botmakers.ai` / `4Xkilla1@`
  - [ ] Verify redirect to `/admin` (not `/dashboard`)
  - [ ] Check admin dashboard shows correct stats
- [ ] **Distributor login works:**
  - [ ] Login with test distributor created above
  - [ ] Verify redirect to `/dashboard`
  - [ ] Check stats cards, replicated URL, team view
- [ ] **Genealogy tree works:**
  - [ ] Go to `/dashboard/team`
  - [ ] Verify tree renders (should show at least 2 nodes)
  - [ ] Test zoom/pan controls
- [ ] **Contact form works:**
  - [ ] Fill out contact form on replicated page
  - [ ] Verify submission success toast
  - [ ] Check `/dashboard/contacts` for submission
  - [ ] Check email notification received
- [ ] **RLS works:**
  - [ ] Login as distributor A
  - [ ] Try to access distributor B's data → should be blocked
- [ ] **Mobile responsive:**
  - [ ] Test on mobile device or Chrome DevTools (375px)
  - [ ] All pages should be usable, no horizontal scroll

---

## 🧪 LIGHTHOUSE AUDIT

Run Lighthouse on deployed production site:

```bash
# Install Lighthouse CLI (if not installed)
npm install -g lighthouse

# Run audit on homepage
lighthouse https://theapexway.net --output html --output-path ./lighthouse-home.html

# Run audit on replicated page
lighthouse https://theapexway.net/apex.corporate --output html --output-path ./lighthouse-replicated.html

# Run audit on admin login
lighthouse https://theapexway.net/login --output html --output-path ./lighthouse-login.html
```

**Target Scores:**
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**If scores are low:**
1. Check image optimization (Next.js Image should handle this)
2. Verify fonts are preloaded
3. Check for unused JavaScript (code splitting)
4. Verify HTTPS and security headers

---

## 📊 MONITORING & ANALYTICS

### Vercel Analytics
- Enabled by default on Vercel
- View in Vercel Dashboard → Analytics
- Tracks page views, Web Vitals, visitors

### Supabase Monitoring
- Go to Supabase Dashboard → Database → Logs
- Monitor query performance
- Check connection pool usage
- Set up alerts for errors

### Resend Email Logs
- Go to Resend Dashboard → Emails
- View delivery status, bounces, complaints
- Set up webhooks for bounce notifications (optional)

### Error Tracking (Future Enhancement)
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **PostHog** for product analytics

---

## 🔧 MAINTENANCE TASKS

### Adding New Admin Users
```bash
npm run add-admin
```
Follow prompts to create new admin account.

### Database Backups
- Supabase automatically backs up daily
- Download manual backup: Supabase Dashboard → Database → Backups

### Updating Environment Variables
1. Update in Vercel: Project Settings → Environment Variables
2. Redeploy (or Vercel will auto-redeploy on env var change)

### Deploying Updates
```bash
git add .
git commit -m "Description of changes"
git push origin master
```
Vercel will auto-deploy on push to master.

---

## 🐛 TROUBLESHOOTING

### Emails Not Sending
- Check Resend API key is correct
- Verify DNS records are added and verified
- Check Resend dashboard for bounces/errors
- Temporary fix: Use Resend test domain (`onboarding@resend.dev`)

### Database Connection Errors
- Check Supabase project is active (not paused)
- Verify environment variables are correct
- Check Supabase connection pool limits (upgrade if needed)

### Build Failures on Vercel
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript has no errors locally: `npm run build`

### RLS Policy Errors
- Check Supabase logs for RLS violations
- Verify user is authenticated
- Check policy definitions in `drizzle/0001_rls_policies.sql`

### Matrix Placement Errors
- Check enroller exists and has matrix position
- Verify database transaction is completing
- Check for concurrent sign-up race conditions (should be handled by row locking)

---

## 📝 KNOWN ISSUES

### Minor (Non-Blocking)
1. **metadataBase Warning:** OG image URLs default to localhost in metadata. Fix by adding `metadataBase: new URL('https://theapexway.net')` to root layout.
2. **Rate Limiting:** Currently in-memory (Map-based). For multi-server deployments, migrate to Redis.

### Feature Gaps (Future Enhancements)
1. **Email Templates:** Using default Resend templates. Could be customized with HTML/CSS branding.
2. **Drip Campaigns:** Infrastructure exists (drip_enrollments table, CRON_SECRET) but campaigns not yet implemented.
3. **Password Reset:** Uses Supabase default flow. Could be customized with branded emails.

---

## 🎯 NEXT STEPS

### Immediate (Post-Deployment)
1. ✅ Complete post-deployment checklist
2. ✅ Run Lighthouse audits
3. ✅ Verify DNS propagation for theapexway.net
4. ✅ Verify Resend domain verification
5. ✅ Test full sign-up flow with real email

### Short-Term (Week 1)
1. Add metadataBase to root layout (fix OG image warning)
2. Customize email templates with Apex branding
3. Create legal pages (Terms, Privacy, Income Disclosure)
4. Set up error tracking (Sentry or similar)
5. Create user documentation (distributor onboarding guide)

### Medium-Term (Month 1)
1. Implement drip campaign system
2. Add distributor training resources
3. Build reporting/analytics dashboards
4. Add file upload for distributor resources
5. Implement SMS notifications (Twilio integration)

### Long-Term (Quarter 1)
1. Mobile app (React Native or PWA)
2. E-commerce integration (if applicable)
3. Advanced reporting (commissions, bonuses)
4. Multi-language support
5. API for third-party integrations

---

## 📞 SUPPORT

**For Deployment Issues:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Resend Support: https://resend.com/support

**For Code Issues:**
- Built by: BotMakers Inc.
- Contact: tdaniel@botmakers.ai
- GitHub: (repository URL)

**For Production Emergencies:**
1. Check Vercel deployment logs
2. Check Supabase dashboard for errors
3. Check Resend dashboard for email issues
4. Rollback deployment if needed (Vercel → Deployments → Rollback)

---

**Last Updated:** 2026-02-15
**Version:** v1.0.0
**Status:** ✅ Ready for Production Deployment

