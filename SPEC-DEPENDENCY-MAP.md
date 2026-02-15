# SPEC-DEPENDENCY-MAP.md — Apex Affinity Group Platform v1

## What This File Is

This is the atomic dependency map. Every feature in the spec is decomposed into its smallest buildable units (atoms), their dependencies, and edge cases. During the build, Claude Code checks this map before marking any stage complete. After the build, the review pass verifies every atom was implemented.

**Legend:**
- `ATOM` — A single buildable unit (component, function, column, validation rule, UI state)
- `DEP` — Something that must exist before this atom works
- `EDGE` — A scenario that needs explicit handling
- `VERIFY` — How to confirm this atom is implemented correctly

---

## FEATURE 1: Corporate Marketing Site

```
FEATURE: Corporate Marketing Page (theapexway.net/)
├── UI: Header
│   ├── ATOM: Apex logo (placeholder until client provides)
│   ├── ATOM: Navigation links (Home, About, Opportunity, Contact)
│   ├── ATOM: "Join Now" CTA button → links to /join (generic sign-up, no sponsor)
│   ├── ATOM: Mobile hamburger menu
│   ├── ATOM: Sticky header on scroll
│   └── EDGE: No sponsor for root sign-up → assign to company default root position
├── UI: Hero Section
│   ├── ATOM: Hero title (from site_content 'hero_title')
│   ├── ATOM: Hero subtitle (from site_content 'hero_subtitle')
│   ├── ATOM: Hero CTA button
│   ├── ATOM: Hero background image
│   ├── DEP: site_content table seeded with defaults
│   └── EDGE: site_content missing → show hardcoded fallback
├── UI: About Section
│   ├── ATOM: Company overview text
│   ├── ATOM: Stats counters (animated on scroll)
│   └── ATOM: Company images
├── UI: Opportunity Section
│   ├── ATOM: How it works steps (from Optive "process" section)
│   ├── ATOM: Benefits cards
│   └── ATOM: Income/growth messaging
├── UI: Testimonials Section
│   ├── ATOM: Testimonial cards carousel (Swiper)
│   └── ATOM: Placeholder testimonials until real ones added
├── UI: Footer
│   ├── ATOM: Company info, address, phone
│   ├── ATOM: Quick links
│   ├── ATOM: Social media icons
│   ├── ATOM: Legal links (Terms, Privacy, Income Disclosure)
│   └── ATOM: Copyright year (dynamic)
├── SEO:
│   ├── ATOM: Meta title "Apex Affinity Group — [tagline]"
│   ├── ATOM: Meta description
│   ├── ATOM: Open Graph tags (title, description, image)
│   └── ATOM: Canonical URL
├── PERFORMANCE:
│   ├── ATOM: Images lazy loaded
│   ├── ATOM: Fonts preloaded (Mona Sans, Public Sans)
│   ├── ATOM: CSS/JS minimized
│   └── VERIFY: Lighthouse > 85
└── RESPONSIVE:
    ├── ATOM: Mobile layout (375px+)
    ├── ATOM: Tablet layout (768px+)
    └── ATOM: Desktop layout (1024px+)
```

---

## FEATURE 2: Replicated Distributor Page

```
FEATURE: Replicated Page (theapexway.net/{username})
├── ROUTING:
│   ├── ATOM: Dynamic route /[username]/page.tsx
│   ├── ATOM: Lookup distributor by username (case-insensitive)
│   ├── EDGE: Username not found → 404 page with "Find a distributor" search
│   ├── EDGE: Distributor suspended → 404 (don't reveal suspension)
│   ├── EDGE: Distributor inactive → 404 with "This page is no longer available"
│   └── DEP: distributors table with username index
├── UI: Header
│   ├── ATOM: Apex logo (left)
│   ├── ATOM: Distributor name (right of logo or below)
│   ├── ATOM: Distributor photo (circular, cropped per photo_crop_data)
│   ├── ATOM: "Contact Me" button → scrolls to contact form
│   ├── ATOM: "Join My Team" button → links to /join/{username}
│   ├── EDGE: No photo uploaded → show default avatar with initials
│   ├── DEP: distributor.photo_url from Supabase Storage
│   └── DEP: distributor.photo_crop_data for display crop
├── UI: Opportunity Section
│   ├── ATOM: Same Apex opportunity content as corporate page
│   ├── ATOM: "Why join [Distributor Name]'s team" personalization
│   └── ATOM: Benefits cards
├── UI: How It Works Section
│   ├── ATOM: Step 1: Learn about the opportunity
│   ├── ATOM: Step 2: Sign up with [Distributor Name]
│   └── ATOM: Step 3: Start building your business
├── UI: Contact Form
│   ├── ATOM: Name input (text, required, min 2 chars, max 100)
│   ├── ATOM: Email input (email format, required)
│   ├── ATOM: Phone input (optional, phone format validation)
│   ├── ATOM: Message textarea (required, min 10 chars, max 1000)
│   ├── ATOM: Submit button with loading spinner
│   ├── ATOM: Success toast "Message sent to [Distributor Name]!"
│   ├── ATOM: Error toast "Something went wrong. Please try again."
│   ├── ATOM: Rate limit toast "Please wait a moment before sending again."
│   ├── DEP: Zod validation schema for contact form
│   ├── DEP: submitContactForm server action
│   ├── DEP: contact_submissions table
│   ├── DEP: Rate limiting (3 submissions per hour per IP)
│   ├── EDGE: Distributor has no email → log warning, still save submission
│   └── EDGE: Rate limit hit → show friendly message, don't save
├── UI: Sign Up CTA
│   ├── ATOM: "Ready to Join?" section with large CTA button
│   └── ATOM: Button links to /join/{username}
├── SERVER: Contact form submission
│   ├── ATOM: Validate input with Zod
│   ├── ATOM: Check rate limit (IP-based)
│   ├── ATOM: Save to contact_submissions (status: 'new')
│   ├── ATOM: Send email notification to distributor via Resend
│   │   ├── DEP: RESEND_API_KEY env var
│   │   ├── DEP: Email template "New contact from your Apex page"
│   │   ├── EDGE: Resend fails → save submission anyway, mark email_failed in metadata
│   │   └── EDGE: Distributor email invalid → log warning, skip notification
│   ├── ATOM: Create notification record (type: 'new_contact')
│   ├── ATOM: Log to activity_log (action: 'contact.submitted')
│   └── ATOM: Track signup_analytics event 'page_view' on page load
├── SEO:
│   ├── ATOM: Meta title "[Distributor Name] — Apex Affinity Group"
│   ├── ATOM: Meta description "Join [name]'s team at Apex Affinity Group..."
│   ├── ATOM: Open Graph with distributor photo
│   └── ATOM: noindex if distributor is inactive
└── RESPONSIVE:
    ├── ATOM: Mobile-first layout
    ├── ATOM: Contact form full-width on mobile
    └── ATOM: Photo responsive sizing
```

---

## FEATURE 3: Distributor Sign-Up Flow

```
FEATURE: Sign-Up Flow (/join/{username})
├── ROUTING:
│   ├── ATOM: /join/[username]/page.tsx
│   ├── ATOM: Lookup enroller by username
│   ├── EDGE: Username not found → 404 "This distributor doesn't exist"
│   ├── EDGE: Distributor suspended/inactive → 404
│   └── ATOM: /join (no username) → sign up under company root
├── UI: Sign-Up Form
│   ├── ATOM: Header: "Join [Enroller Name]'s Team at Apex Affinity Group"
│   ├── ATOM: Enroller photo + name shown (so they know who's sponsoring them)
│   ├── ATOM: First name input (required, min 2, max 50, letters only)
│   ├── ATOM: Last name input (required, min 2, max 50, letters only)
│   ├── ATOM: Email input (required, valid email, unique check)
│   ├── ATOM: Phone input (optional, valid phone format)
│   ├── ATOM: Password input (required, min 8, one uppercase, one number)
│   ├── ATOM: Confirm password input (must match)
│   ├── ATOM: Username field (auto-generated, editable)
│   │   ├── ATOM: Auto-generate: first_initial + '.' + last_name (lowercase, no spaces)
│   │   ├── ATOM: Real-time availability check (debounced 500ms)
│   │   ├── ATOM: Green checkmark when available
│   │   ├── ATOM: Red X when taken + suggestions list
│   │   ├── ATOM: Suggestions: [firstname.lastname, firstinitial.lastname1, firstinitial.lastname2, first.last]
│   │   ├── ATOM: Click suggestion → fills field + re-checks
│   │   ├── ATOM: Username rules: 3-30 chars, lowercase, letters/numbers/dots only, no consecutive dots, no start/end dot
│   │   ├── DEP: /api/check-username API route (public, rate limited)
│   │   ├── EDGE: All suggestions taken → show "Enter a custom username"
│   │   └── EDGE: Username contains profanity → reject (basic word filter)
│   ├── ATOM: Terms & conditions checkbox (required)
│   ├── ATOM: Submit button with loading state
│   ├── ATOM: Success → redirect to /login with "Account created! Check your email." toast
│   └── ATOM: Error → inline error messages per field
├── SERVER: createDistributor server action
│   ├── ATOM: Validate all fields with Zod
│   ├── ATOM: Check username availability (final server-side check)
│   ├── ATOM: Check email uniqueness
│   ├── ATOM: Create auth.users record via Supabase Auth
│   ├── ATOM: Create distributors record
│   │   ├── SET: username, first_name, last_name, email, phone
│   │   ├── SET: enroller_id = enroller's distributor.id
│   │   ├── SET: status = 'active'
│   │   ├── SET: drip_status = 'enrolled'
│   │   └── SET: replicated_site_active = true
│   ├── ATOM: Run matrix placement algorithm
│   │   ├── STEP: Find enroller's matrix_position
│   │   ├── STEP: Check if enroller has < 5 children (position_index 0-4)
│   │   ├── STEP: If yes → place as next child, is_spillover = false
│   │   ├── STEP: If no → BFS through enroller's subtree
│   │   ├── STEP: Find shallowest position with < 5 children
│   │   ├── STEP: Place there, is_spillover = true
│   │   ├── STEP: Calculate path, left_boundary, right_boundary
│   │   ├── STEP: Update nested set values for all affected positions
│   │   ├── DEP: matrix_positions table
│   │   ├── DEP: BFS placement function (src/lib/matrix/placement.ts)
│   │   ├── EDGE: Enroller has no matrix position → create root position first
│   │   ├── EDGE: Entire 7-level matrix full → reject with "Organization is full" message
│   │   └── EDGE: Concurrent sign-ups under same enroller → use DB transaction + row lock
│   ├── ATOM: Create drip_enrollment record (status: 'enrolled', step: 0)
│   ├── ATOM: Create notification for enroller (type: 'new_signup')
│   ├── ATOM: Send welcome email to new distributor
│   │   ├── DEP: Resend welcome email template
│   │   ├── CONTENT: "Welcome to Apex!", replicated site URL, login link
│   │   └── EDGE: Email send fails → log warning, don't block sign-up
│   ├── ATOM: Send notification email to enroller
│   │   ├── CONTENT: "[Name] just joined your team!"
│   │   └── EDGE: Enroller email invalid → skip
│   ├── ATOM: Log to activity_log (action: 'distributor.signed_up')
│   ├── ATOM: Log to signup_analytics (event: 'signup_completed')
│   └── ATOM: All operations in a database transaction — rollback ALL if any step fails
├── USERNAME CHECK API:
│   ├── ATOM: GET /api/check-username?username=j.smith
│   ├── ATOM: Rate limited (20 checks per minute per IP)
│   ├── ATOM: Returns { available: boolean, suggestions?: string[] }
│   ├── ATOM: Suggestions generated from name permutations
│   └── EDGE: API error → return { available: false } (safe default)
└── ANALYTICS:
    ├── ATOM: Track 'signup_started' when form loads
    ├── ATOM: Track 'username_checked' on each check
    ├── ATOM: Track 'signup_completed' on success
    └── ATOM: Track 'signup_failed' on failure with error reason
```

---

## FEATURE 4: Distributor Back Office

```
FEATURE: Back Office Dashboard (/dashboard)
├── AUTH:
│   ├── DEP: Middleware protects /dashboard/* routes
│   ├── DEP: Must be authenticated distributor
│   └── EDGE: Session expired → redirect to /login with "Session expired" message
├── UI: Dashboard Layout
│   ├── ATOM: Sidebar navigation (Profile, My Team, Contacts, Stats)
│   ├── ATOM: Mobile: sidebar collapses to bottom tab bar or hamburger
│   ├── ATOM: Top bar: distributor name, notification bell, logout
│   ├── ATOM: Notification bell with unread count badge
│   └── ATOM: Notification dropdown: list recent, mark as read, "View all" link
├── UI: Dashboard Home (/dashboard)
│   ├── ATOM: Welcome message "Welcome back, [First Name]"
│   ├── ATOM: Quick stats cards: Total in org, Direct enrollees, New this month, Pending contacts
│   ├── ATOM: Replicated site URL card with copy button
│   │   ├── ATOM: Shows theapexway.net/{username}
│   │   ├── ATOM: Copy button → copies to clipboard → toast "Copied!"
│   │   └── ATOM: "Preview" button → opens replicated page in new tab
│   ├── ATOM: Recent activity feed (last 10 actions in their org)
│   └── ATOM: Quick links: Edit Profile, View Team, Check Messages
```

```
FEATURE: Profile Management (/dashboard/profile)
├── UI: Profile Form
│   ├── ATOM: First name (editable)
│   ├── ATOM: Last name (editable)
│   ├── ATOM: Email (display only — not editable without email verification flow)
│   ├── ATOM: Phone (editable)
│   ├── ATOM: Bio textarea (max 500 chars, shown on replicated page)
│   ├── ATOM: Save button with loading state
│   ├── ATOM: Success toast "Profile updated!"
│   └── ATOM: Validation: same rules as sign-up form
├── UI: Photo Upload + Crop
│   ├── ATOM: Current photo preview (circular, 150px)
│   ├── ATOM: "Upload Photo" button → file picker
│   ├── ATOM: Accepted formats: JPG, PNG, WebP
│   ├── ATOM: Max file size: 5MB
│   ├── ATOM: After selecting: crop modal opens
│   │   ├── ATOM: Circular crop area (1:1 aspect ratio)
│   │   ├── ATOM: Zoom slider
│   │   ├── ATOM: Drag to reposition
│   │   ├── ATOM: "Save" and "Cancel" buttons
│   │   ├── DEP: react-image-crop or react-easy-crop
│   │   └── EDGE: Image too small (< 200x200) → show warning "Image may appear blurry"
│   ├── ATOM: On save: upload cropped image to Supabase Storage
│   │   ├── DEP: Supabase Storage bucket 'profile-photos'
│   │   ├── ATOM: Path: profile-photos/{distributor_id}/{timestamp}.webp
│   │   ├── ATOM: Convert to WebP on client before upload (quality 80%)
│   │   ├── ATOM: Delete old photo from storage
│   │   └── ATOM: Update distributor.photo_url and photo_crop_data
│   ├── ATOM: "Remove Photo" button → revert to default avatar
│   └── EDGE: Upload fails → toast error, keep old photo
├── UI: Password Change
│   ├── ATOM: Current password input
│   ├── ATOM: New password input (same rules as sign-up)
│   ├── ATOM: Confirm new password
│   ├── ATOM: Change button with loading state
│   └── EDGE: Current password wrong → inline error
└── SERVER: updateProfile server action
    ├── ATOM: Validate with Zod
    ├── ATOM: Update distributors record
    ├── ATOM: Log to activity_log
    └── ATOM: All in transaction
```

```
FEATURE: Genealogy Tree (/dashboard/team)
├── UI: Tree View (default)
│   ├── ATOM: react-d3-tree component filling page
│   ├── ATOM: Vertical orientation (root at top)
│   ├── ATOM: Custom node rendering via foreignObject:
│   │   ├── ATOM: Circular photo (40px) or initials avatar
│   │   ├── ATOM: Name text below photo
│   │   ├── ATOM: "Direct" badge (green) or "Spillover" badge (orange)
│   │   ├── ATOM: Date joined (small, muted)
│   │   └── ATOM: Click → expand panel with full details
│   ├── ATOM: Green node border/bg for direct enrollees (is_spillover = false AND enroller = current user)
│   ├── ATOM: Orange node border/bg for spillover placements
│   ├── ATOM: Gray node for empty slots (show "Open" with dashed border)
│   ├── ATOM: Zoom controls (+ / - buttons, or scroll wheel)
│   ├── ATOM: Pan by dragging
│   ├── ATOM: "Center on me" button → resets view to current user's position
│   ├── ATOM: Collapse/expand subtrees by clicking
│   ├── DEP: react-d3-tree library
│   ├── DEP: API endpoint to fetch tree data for current user's org
│   │   ├── ATOM: Fetch with depth limit (default 3 levels, load more on expand)
│   │   ├── ATOM: Include child count per node (even if not expanded)
│   │   └── EDGE: Large org (1000+ nodes) → lazy load subtrees on expand
│   ├── EDGE: User has no one in their org → show encouraging empty state
│   └── EDGE: Mobile → show simplified tree (2 levels visible, swipe to explore)
├── UI: List View (tab)
│   ├── ATOM: Toggle between Tree / List views (tabs)
│   ├── ATOM: Table: Name, Email, Phone, Enrolled By, Type (Direct/Spillover), Date Joined, Status
│   ├── ATOM: Sortable columns
│   ├── ATOM: Search/filter by name or email
│   ├── ATOM: Pagination (25 per page)
│   ├── ATOM: "Direct Only" / "All Downline" filter toggle
│   └── ATOM: Empty state: "No team members yet. Share your link to start building!"
├── UI: Member Detail Panel
│   ├── ATOM: Slides in from right when clicking a tree node or list row
│   ├── ATOM: Photo, name, email, phone
│   ├── ATOM: Joined date
│   ├── ATOM: Enrolled by (enroller name)
│   ├── ATOM: Position in matrix (level, position index)
│   ├── ATOM: Direct/spillover indicator
│   ├── ATOM: Their org stats (total under them)
│   └── ATOM: Close button
└── SERVER: getOrgTree server action / API route
    ├── ATOM: Fetch matrix_positions for current user's subtree
    ├── ATOM: Join with distributors for name, photo, status
    ├── ATOM: Calculate is_direct_enrollee per node relative to viewing user
    ├── ATOM: Return hierarchical JSON for react-d3-tree
    ├── DEP: Nested set or materialized path query for subtree
    ├── EDGE: RLS ensures distributor only sees their own subtree
    └── EDGE: Admin sees entire tree from root
```

```
FEATURE: Contact Submissions (/dashboard/contacts)
├── UI: Contact List
│   ├── ATOM: Table: Sender Name, Email, Preview (first 50 chars), Date, Status badge
│   ├── ATOM: Unread rows have bold text + left border accent
│   ├── ATOM: Status badges: New (blue), Read (gray), Replied (green), Archived (muted)
│   ├── ATOM: Click row → opens full message
│   ├── ATOM: Bulk actions: mark as read, archive
│   ├── ATOM: Filter by status
│   ├── ATOM: Sort by date (newest first default)
│   ├── ATOM: Pagination (25 per page)
│   └── ATOM: Empty state: "No messages yet. Share your page to start receiving inquiries!"
├── UI: Message Detail
│   ├── ATOM: Full message display
│   ├── ATOM: Sender name, email, phone (if provided)
│   ├── ATOM: Date received
│   ├── ATOM: "Reply via Email" button → opens mailto: link
│   ├── ATOM: Mark as read (automatic on open)
│   ├── ATOM: Archive button
│   └── ATOM: Back to list button
└── SERVER:
    ├── ATOM: getContactSubmissions server action (paginated, filtered)
    ├── ATOM: markAsRead server action (updates status + read_at)
    ├── ATOM: archiveSubmission server action
    ├── DEP: RLS: distributor only sees their own submissions
    └── ATOM: Log all status changes to activity_log
```

---

## FEATURE 5: Admin Panel

```
FEATURE: Admin Panel (/admin)
├── AUTH:
│   ├── DEP: Middleware protects /admin/* routes
│   ├── DEP: Must be authenticated admin_user
│   ├── EDGE: Distributor trying to access /admin → redirect to /dashboard
│   └── EDGE: Viewer role → read only, no edit/suspend actions
├── UI: Admin Dashboard (/admin)
│   ├── ATOM: Total distributors count
│   ├── ATOM: New this week / month
│   ├── ATOM: Active vs inactive counts
│   ├── ATOM: Sign-up funnel chart (from signup_analytics)
│   └── ATOM: Recent activity feed (all system activity)
├── UI: Distributors List (/admin/distributors)
│   ├── ATOM: Table: Name, Username, Email, Enroller, Status, Joined Date
│   ├── ATOM: Search by name, email, or username
│   ├── ATOM: Filter by status
│   ├── ATOM: Sort by any column
│   ├── ATOM: Pagination
│   ├── ATOM: Click row → distributor detail page
│   ├── ATOM: Suspend/reactivate button (with confirmation dialog)
│   │   ├── ATOM: Confirm dialog: "Are you sure? This will deactivate their replicated site."
│   │   ├── ATOM: Sets distributor.status = 'suspended', replicated_site_active = false
│   │   ├── ATOM: Log to audit_log with before/after state
│   │   └── EDGE: Cannot suspend the root/company distributor
│   └── ATOM: Export CSV button
├── UI: Org Tree (/admin/org-tree)
│   ├── ATOM: Full organization tree from root
│   ├── ATOM: Same react-d3-tree component as distributor view
│   ├── ATOM: But shows ALL positions, not just a subtree
│   ├── ATOM: Search for a distributor → center tree on them
│   └── ATOM: Color coding: active (green), inactive (gray), suspended (red)
└── UI: Settings (/admin/settings)
    ├── ATOM: System settings from system_settings table
    ├── ATOM: Toggle maintenance mode
    ├── ATOM: Toggle drip campaign (future)
    └── ATOM: All changes logged to audit_log
```

---

## FEATURE 6: Email Notifications

```
FEATURE: Email Notifications (Resend)
├── DEP: RESEND_API_KEY env var
├── DEP: EMAIL_FROM env var (noreply@theapexway.net)
├── TEMPLATES:
│   ├── ATOM: Welcome email (to new distributor)
│   │   ├── CONTENT: Welcome, replicated site URL, login link, getting started tips
│   │   └── VERIFY: Email sends on signup, contains correct URLs
│   ├── ATOM: New team member notification (to enroller)
│   │   ├── CONTENT: "[Name] just joined your team!", view in dashboard link
│   │   └── VERIFY: Sends to enroller on every signup
│   ├── ATOM: Contact form notification (to distributor)
│   │   ├── CONTENT: "New message from [Visitor Name]", message preview, view in dashboard link
│   │   └── VERIFY: Sends on every contact form submission
│   └── ATOM: Spillover notification (to distributor who received spillover)
│       ├── CONTENT: "[Name] was placed in your organization!", view team link
│       └── VERIFY: Only sends when is_spillover = true
├── ALL TEMPLATES:
│   ├── ATOM: Apex branding (logo, colors) — placeholder until provided
│   ├── ATOM: Unsubscribe link (for drip emails, future)
│   ├── ATOM: Text fallback (non-HTML version)
│   ├── DEP: Resend domain verified for theapexway.net
│   └── EDGE: All email sends wrapped in try/catch — never block main flow
```

---

## CROSS-CUTTING ATOMS (apply to everything)

```
CROSS-CUTTING:
├── ENV VALIDATION:
│   ├── ATOM: src/lib/env.ts validates ALL env vars at startup
│   ├── ATOM: App refuses to start if required vars missing
│   └── VARS: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_APP_URL
├── ERROR HANDLING:
│   ├── ATOM: Every server action wrapped in try/catch
│   ├── ATOM: User-facing errors: friendly message, no stack traces
│   ├── ATOM: 404 page: custom, helpful
│   ├── ATOM: 500 page: custom, "We've been notified"
│   └── ATOM: Toast notifications for all success/error on mutations
├── LOADING STATES:
│   ├── ATOM: Every page has skeleton loading UI
│   ├── ATOM: Every button with async action has spinner
│   ├── ATOM: Every list has skeleton rows while loading
│   └── ATOM: Every form disables submit during processing
├── EMPTY STATES:
│   ├── ATOM: Every list/table has an empty state with helpful CTA
│   └── ATOM: No technical jargon in empty states
├── RATE LIMITING:
│   ├── ATOM: Contact form: 3/hour per IP
│   ├── ATOM: Username check: 20/minute per IP
│   ├── ATOM: Sign-up: 5/hour per IP
│   └── DEP: Rate limiting via in-memory or Redis
├── SECURITY:
│   ├── ATOM: CSRF protection on all forms
│   ├── ATOM: XSS prevention (sanitize user input for display)
│   ├── ATOM: SQL injection prevention (Drizzle parameterized queries)
│   ├── ATOM: RLS on all tables
│   ├── ATOM: File upload type validation (server-side MIME check)
│   └── ATOM: Max file size enforced server-side
├── MOBILE:
│   ├── ATOM: All pages responsive 375px+
│   ├── ATOM: Touch-friendly tap targets (min 44px)
│   └── ATOM: Genealogy tree simplified on mobile
└── ACCESSIBILITY:
    ├── ATOM: All form fields have labels
    ├── ATOM: Color contrast > 4.5:1
    ├── ATOM: Keyboard navigation on all interactive elements
    ├── ATOM: Focus indicators visible
    └── ATOM: Alt text on all images
```

---

## VERIFICATION CHECKLIST

After the build, verify every ATOM above is implemented by checking:

1. **Does the UI element exist?** Navigate to it, click it, see it.
2. **Does the server action work?** Submit the form, check the database.
3. **Does the edge case have handling?** Trigger the edge case, verify behavior.
4. **Does the dependency exist?** Check env var, table, index, import.
5. **Does the notification fire?** Trigger the event, check email/in-app.
6. **Does the activity log capture it?** Trigger the action, check the log.

Any ATOM that fails verification gets a fix prompt generated automatically.
