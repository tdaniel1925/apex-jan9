# PHASE 8 TESTING GUIDE
## Manual Testing & Lighthouse Audits

**Date:** 2026-02-15
**Status:** Ready for user testing
**Prerequisites:** Dev server running, database seeded, environment configured

---

## PREREQUISITES

### 1. Environment Setup
Ensure `.env.local` is configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@theapexway.net
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Seed Dummy Distributors
```bash
npx tsx lib/db/seed-dummy-distributors.ts
```

**Expected Output:**
```
✅ john.smith (47 team members, 12 direct)
✅ sarah.johnson (12 team members, 5 direct)
✅ mike.davis (203 team members, 28 direct)
```

### 3. Start Dev Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

OR for production build testing:
```bash
npm run build
npm run start
```

---

## TASK 8.2: LIGHTHOUSE AUDITS

### How to Run Lighthouse

1. **Open Chrome** (must use Chrome, not other browsers)
2. Navigate to the URL to test
3. **Open DevTools** (F12 or Right-click → Inspect)
4. **Go to Lighthouse tab** (may be hidden under >> menu)
5. **Configuration:**
   - Mode: Desktop
   - Categories: All (Performance, Accessibility, Best Practices, SEO)
   - Device: Desktop
6. **Click "Analyze page load"**
7. Wait for audit to complete (~30 seconds)

### Corporate Page Audit

**URL:** `http://localhost:3000/`

**Target Scores:**
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**What to Check:**
- ✅ No render-blocking resources
- ✅ Images optimized (Next.js Image)
- ✅ First Contentful Paint < 1.8s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Total Blocking Time < 200ms
- ✅ Cumulative Layout Shift < 0.1
- ✅ All links have accessible names
- ✅ Color contrast passes WCAG AA
- ✅ Meta tags present
- ✅ Heading hierarchy correct (h1 → h2 → h3)

**Expected Issues (if any):**
- Video background may impact initial load (acceptable if > 85)
- Third-party scripts (none in redesign)

**Document Results:**
```
Corporate Page (/) Lighthouse Scores:
- Performance: ___ / 100
- Accessibility: ___ / 100
- Best Practices: ___ / 100
- SEO: ___ / 100
Status: ✅ PASS / ❌ FAIL
Notes: [any issues found]
```

### Replicated Page Audit

**URL:** `http://localhost:3000/john.smith`

**Target Scores:**
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**What to Check:**
- ✅ Dynamic metadata renders correctly
- ✅ Distributor photo loads (or initials fallback)
- ✅ Team stats load from backend
- ✅ Contact form accessible
- ✅ No console errors
- ✅ Page view analytics tracked

**Document Results:**
```
Replicated Page (/john.smith) Lighthouse Scores:
- Performance: ___ / 100
- Accessibility: ___ / 100
- Best Practices: ___ / 100
- SEO: ___ / 100
Status: ✅ PASS / ❌ FAIL
Notes: [any issues found]
```

### Mobile Lighthouse Audit

**Repeat above audits with:**
- Mode: Mobile
- Device: Moto G Power

**Target Scores:**
- Performance: > 75 (mobile typically scores lower)
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## TASK 8.3: EDGE CASE TESTING

### Contact Form Testing

**Test Case 1: Validation Errors**
1. Navigate to `http://localhost:3000/john.smith`
2. Scroll to contact form
3. Click Submit without filling fields
4. **Expected:** Inline validation errors appear
   - "Name is required" (red text)
   - "Email is required"
   - "Message is required"
5. Fill invalid email (e.g., "notanemail")
6. **Expected:** "Invalid email format" error

**Status:** ✅ PASS / ❌ FAIL

**Test Case 2: Successful Submission**
1. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+1 555-123-4567" (optional)
   - Message: "This is a test message from the contact form."
2. Click Submit
3. **Expected:**
   - Button shows loading spinner
   - Toast notification: "Message sent to John!"
   - Form resets to empty
4. **Verify in Database:**
   - Open Supabase dashboard
   - Go to `contact_submissions` table
   - Confirm new row with your test data
   - Check `distributor_id` matches john.smith
   - Check `status` = 'new'
5. **Verify Email Sent:**
   - Check Resend dashboard (resend.com)
   - Confirm email sent to john.smith@example.com
   - Subject: "New contact from your Apex page"
6. **Verify Notification:**
   - Check `notifications` table in Supabase
   - Confirm new row with `type` = 'new_contact'
7. **Verify Activity Log:**
   - Check `activity_log` table
   - Confirm new row with `action` = 'contact.submitted'

**Status:** ✅ PASS / ❌ FAIL

**Test Case 3: Rate Limiting**
1. Submit contact form successfully (1st time)
2. Immediately submit again (2nd time) → Success
3. Immediately submit again (3rd time) → Success
4. Immediately submit again (4th time)
5. **Expected:** Toast error: "Please wait before sending another message."
6. **Expected:** NO database record created for 4th submission
7. Wait 1 hour
8. Submit again
9. **Expected:** Success (rate limit reset)

**Status:** ✅ PASS / ❌ FAIL

### Replicated Page Routing

**Test Case 4: Case-Insensitive Username**
1. Visit `http://localhost:3000/JOHN.SMITH` (all caps)
2. **Expected:** Page loads correctly, shows John Smith
3. Visit `http://localhost:3000/John.Smith` (mixed case)
4. **Expected:** Page loads correctly
5. Visit `http://localhost:3000/jOhN.sMiTh` (random case)
6. **Expected:** Page loads correctly

**Status:** ✅ PASS / ❌ FAIL

**Test Case 5: Invalid Username → 404**
1. Visit `http://localhost:3000/fake-user-12345`
2. **Expected:** Next.js 404 page appears
3. Visit `http://localhost:3000/thisuserdoesnotexist`
4. **Expected:** 404 page

**Status:** ✅ PASS / ❌ FAIL

**Test Case 6: Inactive Distributor → 404**
1. In Supabase, set john.smith `status` to 'inactive'
2. Visit `http://localhost:3000/john.smith`
3. **Expected:** 404 page (don't reveal suspension)
4. **Reset:** Set status back to 'active'

**Status:** ✅ PASS / ❌ FAIL

### Team Stats Backend Integration

**Test Case 7: Team Stats Display**
1. Visit `http://localhost:3000/john.smith`
2. Scroll to About section
3. **Expected Stats:**
   - "47 Team Members" (animated counter)
   - "12 Direct Enrollees" (animated counter)
   - Stats animate from 0 when scrolled into view
4. Visit `http://localhost:3000/sarah.johnson`
5. **Expected Stats:**
   - "12 Team Members"
   - "5 Direct Enrollees"
6. Visit `http://localhost:3000/mike.davis`
7. **Expected Stats:**
   - "203 Team Members"
   - "28 Direct Enrollees"

**Verify Backend Calls:**
- Open DevTools Network tab
- Reload john.smith page
- **Expected:** Server-side rendering (stats in initial HTML, no AJAX calls)

**Status:** ✅ PASS / ❌ FAIL

### Distributor Photo & Fallbacks

**Test Case 8: No Photo → Initials Avatar**
1. Visit `http://localhost:3000/john.smith`
2. **Expected:**
   - Hero section shows circular avatar with "JS" initials
   - Background color based on name hash
   - No broken image icon
3. **Verify in code:**
   - `distributor.photoUrl` is null in database
   - HeroSection.tsx lines 193-203 render initials

**Status:** ✅ PASS / ❌ FAIL

**Test Case 9: Bio Fallback**
1. In Supabase, set john.smith `bio` to NULL
2. Visit `http://localhost:3000/john.smith`
3. **Expected:** Default bio text displays (AboutSection.tsx line 207)
4. **Reset:** Restore original bio

**Status:** ✅ PASS / ❌ FAIL

### Analytics Tracking

**Test Case 10: Page View Tracking**
1. Clear Supabase `signup_analytics` table (or note current count)
2. Visit `http://localhost:3000/john.smith`
3. **Expected:**
   - No errors in browser console
   - Page loads normally
4. **Verify in Database:**
   - Check `signup_analytics` table
   - Confirm new row with:
     - `distributor_slug` = 'john.smith'
     - `event` = 'page_view'
     - `visitor_ip` present
     - `user_agent` present
     - `referrer` (if came from another page)

**Status:** ✅ PASS / ❌ FAIL

---

## RESPONSIVE DESIGN TESTING

### Test Case 11: Mobile Layout (375px)

**Device:** iPhone SE

**Steps:**
1. Open DevTools (F12)
2. Click device emulation icon (top-left)
3. Select "iPhone SE" or custom 375px width
4. Visit `http://localhost:3000/`

**Verify Corporate Page:**
- ✅ Header: Logo visible, hamburger menu appears
- ✅ Hero: Text readable, CTA button full-width
- ✅ About: Stats stack vertically
- ✅ Services: Cards stack 1 column
- ✅ Process: Timeline vertical
- ✅ Testimonials: 1 slide visible
- ✅ FAQ: Accordion full-width
- ✅ CTA: Buttons stack vertically
- ✅ Footer: Columns stack vertically
- ✅ No horizontal scroll
- ✅ All text readable (not too small)

**Verify Replicated Page:**
1. Visit `http://localhost:3000/john.smith` (still 375px)
2. ✅ Distributor photo displays correctly
3. ✅ Contact form inputs full-width
4. ✅ All sections stack properly
5. ✅ CTAs accessible

**Status:** ✅ PASS / ❌ FAIL

### Test Case 12: Tablet Layout (768px)

**Device:** iPad Mini

**Steps:**
1. DevTools → Select "iPad Mini" or custom 768px width
2. Visit `http://localhost:3000/`

**Verify:**
- ✅ Services: 2 columns (md:grid-cols-2)
- ✅ Testimonials: 2 slides visible
- ✅ Navigation: Links visible (no hamburger yet)
- ✅ Process: Still vertical or starting horizontal
- ✅ Footer: 2-3 columns
- ✅ Contact form: 2-column layout for name/email

**Status:** ✅ PASS / ❌ FAIL

### Test Case 13: Desktop Layout (1024px+)

**Device:** Laptop or Desktop

**Steps:**
1. DevTools → Select "Laptop (1024px)" or larger
2. Visit `http://localhost:3000/`

**Verify:**
- ✅ Services: 3 columns (lg:grid-cols-3)
- ✅ Testimonials: 3 slides visible
- ✅ Process: Horizontal timeline
- ✅ Navigation: All links visible inline
- ✅ Footer: 3 columns
- ✅ Hero: Full background video plays
- ✅ Spacing looks balanced

**Status:** ✅ PASS / ❌ FAIL

### Test Case 14: Wide Desktop (1920px)

**Steps:**
1. DevTools → Responsive mode → 1920x1080
2. Visit `http://localhost:3000/`

**Verify:**
- ✅ Content max-width constrains (doesn't stretch too wide)
- ✅ Background patterns/gradients look good
- ✅ No awkward gaps or stretched images
- ✅ Text line length readable (not stretching across screen)

**Status:** ✅ PASS / ❌ FAIL

---

## COMPONENT-SPECIFIC TESTING

### Testimonials Carousel

**Test Case 15: Swiper Functionality**
1. Visit `http://localhost:3000/`
2. Scroll to Testimonials section
3. **Verify:**
   - ✅ 5 testimonial cards exist
   - ✅ Carousel auto-plays (advances every 5 seconds)
   - ✅ Hover to pause (carousel stops when mouse over)
   - ✅ Click left arrow → previous slide
   - ✅ Click right arrow → next slide
   - ✅ Click pagination dot → jumps to that slide
   - ✅ Swipe on mobile works (test in device mode)
   - ✅ Smooth transitions between slides

**Status:** ✅ PASS / ❌ FAIL

### FAQ Accordion

**Test Case 16: Accordion Functionality**
1. Visit `http://localhost:3000/`
2. Scroll to FAQ section
3. **Verify:**
   - ✅ 10 FAQ items display
   - ✅ All items closed by default
   - ✅ Click item 1 → expands smoothly
   - ✅ Plus icon changes to Minus icon
   - ✅ Click item 2 → expands (item 1 stays open)
   - ✅ Multiple items can be open simultaneously
   - ✅ Click item 1 again → collapses
   - ✅ Hover effect on accordion trigger (border color changes)
   - ✅ Keyboard navigation works (Tab to navigate, Enter to toggle)

**Status:** ✅ PASS / ❌ FAIL

### Navigation & Smooth Scrolling

**Test Case 17: Header Navigation**
1. Visit `http://localhost:3000/`
2. Click "About" in header
3. **Expected:** Smooth scroll to About section
4. Click "Opportunity" → Scrolls to Services section
5. Click "How It Works" → Scrolls to Process section
6. Click "Testimonials" → Scrolls to Testimonials section
7. Click "FAQ" → Scrolls to FAQ section
8. Click "Contact" → Scrolls to CTA section

**Verify on Replicated Page:**
1. Visit `http://localhost:3000/john.smith`
2. Click "Contact" → Scrolls to ContactSection
3. Click "About" → Scrolls to AboutSection
4. Click "Join John's Team" → Redirects to `/join/john.smith`

**Status:** ✅ PASS / ❌ FAIL

### Animated Stats

**Test Case 18: Counter Animation**
1. Visit `http://localhost:3000/`
2. Scroll to About section
3. **Before entering view:** Numbers show 0
4. **When section enters viewport:**
   - ✅ Numbers animate from 0 to target
   - ✅ Animation duration ~2 seconds
   - ✅ Smooth increment (not jumpy)
   - ✅ Animation triggers only once (not on every scroll)
5. Scroll away and back
6. **Expected:** Numbers stay at final value (don't re-animate)

**Status:** ✅ PASS / ❌ FAIL

---

## BUILD & DEPLOYMENT CHECKS

### Test Case 19: Production Build

**Steps:**
```bash
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization
✓ Collecting build traces

Route (app)                              Size     First Load JS
┌ ○ /                                    6.55 kB        195 kB
├ ○ /[username]                          3.17 kB        215 kB
...
○  (Static)  prerendered as static content
```

**Verify:**
- ✅ No TypeScript errors
- ✅ No build errors
- ✅ No warnings (or only minor warnings)
- ✅ Bundle sizes reasonable (< 250 kB first load)

**Status:** ✅ PASS / ❌ FAIL

### Test Case 20: Production Start

**Steps:**
```bash
npm run start
```

**Expected:**
```
▲ Next.js 15.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in Xms
```

**Verify:**
1. Visit `http://localhost:3000/`
2. **Expected:** Page loads faster than dev mode
3. **Expected:** No console errors
4. **Expected:** Optimized bundles loaded

**Status:** ✅ PASS / ❌ FAIL

---

## CONSOLE & ERROR CHECKS

### Test Case 21: Console Errors

**For Each Page:**
1. Corporate: `http://localhost:3000/`
2. Replicated: `http://localhost:3000/john.smith`
3. Sign-up: `http://localhost:3000/join/john.smith`

**Check DevTools Console:**
- ✅ No red errors
- ✅ No yellow warnings (minor warnings acceptable)
- ✅ No 404s for resources (images, fonts, etc.)
- ✅ No CORS errors
- ✅ No Hydration errors

**Common Acceptable Warnings:**
- Next.js dev mode Fast Refresh notices
- React Strict Mode double-invocation notices

**Status:** ✅ PASS / ❌ FAIL

---

## TESTING RESULTS TEMPLATE

Copy this template and fill in your results:

```markdown
# Phase 8 Testing Results

**Date Tested:** YYYY-MM-DD
**Tested By:** [Your Name]
**Environment:** Local / Production

## Lighthouse Scores

### Corporate Page (/)
- Performance: ___ / 100
- Accessibility: ___ / 100
- Best Practices: ___ / 100
- SEO: ___ / 100

### Replicated Page (/john.smith)
- Performance: ___ / 100
- Accessibility: ___ / 100
- Best Practices: ___ / 100
- SEO: ___ / 100

## Edge Case Testing

| Test Case | Status | Notes |
|-----------|--------|-------|
| Contact form validation | ✅ PASS / ❌ FAIL | |
| Contact form submission | ✅ PASS / ❌ FAIL | |
| Rate limiting (3/hour) | ✅ PASS / ❌ FAIL | |
| Case-insensitive username | ✅ PASS / ❌ FAIL | |
| Invalid username → 404 | ✅ PASS / ❌ FAIL | |
| Inactive distributor → 404 | ✅ PASS / ❌ FAIL | |
| Team stats display | ✅ PASS / ❌ FAIL | |
| No photo → initials | ✅ PASS / ❌ FAIL | |
| Bio fallback | ✅ PASS / ❌ FAIL | |
| Analytics tracking | ✅ PASS / ❌ FAIL | |

## Responsive Testing

| Breakpoint | Status | Notes |
|------------|--------|-------|
| Mobile (375px) | ✅ PASS / ❌ FAIL | |
| Tablet (768px) | ✅ PASS / ❌ FAIL | |
| Desktop (1024px) | ✅ PASS / ❌ FAIL | |
| Wide (1920px) | ✅ PASS / ❌ FAIL | |

## Component Testing

| Component | Status | Notes |
|-----------|--------|-------|
| Testimonials carousel | ✅ PASS / ❌ FAIL | |
| FAQ accordion | ✅ PASS / ❌ FAIL | |
| Navigation smooth scroll | ✅ PASS / ❌ FAIL | |
| Animated stats | ✅ PASS / ❌ FAIL | |

## Build Verification

| Check | Status | Notes |
|-------|--------|-------|
| `npm run build` passes | ✅ PASS / ❌ FAIL | |
| No TypeScript errors | ✅ PASS / ❌ FAIL | |
| Production start works | ✅ PASS / ❌ FAIL | |
| No console errors | ✅ PASS / ❌ FAIL | |

## Issues Found

[List any bugs or issues discovered during testing]

## Overall Status

✅ READY FOR DEPLOYMENT / ❌ NEEDS FIXES

**Summary:** [Brief summary of testing results]
```

---

## NEXT STEPS AFTER TESTING

Once all tests pass:

1. **Update REDESIGN-VERIFICATION-REPORT.md** with Lighthouse scores
2. **Fix any issues** found during testing
3. **Re-run tests** if fixes were made
4. **Create Git commits** (see PHASE-8-GIT-GUIDE.md)
5. **Tag release** as `redesign-complete`
6. **Deploy to Vercel** (see deployment docs)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-15
**Status:** Ready for user testing
