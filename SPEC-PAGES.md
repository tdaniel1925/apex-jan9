# SPEC-PAGES.md — Apex Affinity Group Platform v1

## Gate 3: Pages & UI

---

## Public Pages

### 1. Corporate Marketing Page (/)
- **Purpose:** Apex company landing page for general visitors
- **Source:** Adapted from Optive HTML template (index.html variant)
- **Sections:** Header with nav, Hero, About/Company Overview, Opportunity/How It Works, Benefits, Testimonials, CTA, Footer
- **CTA:** "Join Now" → /join (no sponsor, enrolls under company root)
- **Data:** Loads marketing content from site_content table (with hardcoded fallbacks)
- **Loading:** Static/ISR — content rarely changes
- **Mobile:** Fully responsive, Optive template is already responsive

### 2. Replicated Distributor Page (/[username])
- **Purpose:** Distributor's personal landing page
- **Dynamic route:** Resolves username to distributor record
- **Header:** Apex logo + distributor name + circular photo (or initials avatar if no photo)
- **Sections:** Personalized hero ("Join [Name]'s Team"), Opportunity overview, How It Works (3 steps), Contact Me form, Sign Up CTA
- **Contact form:** Name, email, phone (optional), message → server action → saves to contact_submissions → email notification to distributor
- **CTA:** "Join My Team" → /join/{username}
- **404 handling:** Username not found → custom 404 with "Distributor not found" message
- **Loading:** Server-rendered, cached per username with revalidation
- **Mobile:** Mobile-first, single column, large tap targets on CTAs

### 3. Sign-Up Page (/join/[username])
- **Purpose:** Enroll a new distributor under the URL slug owner
- **Header:** Simplified — Apex logo + "Join [Enroller Name]'s Team" + enroller photo
- **Form fields:** First name, last name, email, phone, password, confirm password, username (auto-generated + real-time check), terms checkbox
- **Username field:** Auto-fills `{first_initial}.{last_name}`, debounced availability check, suggestions if taken
- **Submit:** Creates account → places in matrix → sends emails → redirects to /login
- **Validation:** Inline errors per field, Zod schema
- **Loading:** Submit button shows spinner, form disabled during processing
- **Mobile:** Single column, full-width inputs, sticky submit button at bottom

### 4. Sign-Up Page — No Sponsor (/join)
- **Purpose:** Generic sign-up when visitor comes from corporate page (no sponsor slug)
- **Same as /join/[username]** but enroller_id = company root distributor
- **Header:** "Join Apex Affinity Group" (no specific enroller shown)

### 5. Login Page (/login)
- **Purpose:** Distributor and admin login
- **Fields:** Email, password
- **Auto-detect role:** After login, check if admin_users has matching auth_user_id → redirect to /admin. Otherwise → redirect to /dashboard.
- **"Forgot password" link:** Triggers Supabase password reset email
- **Loading:** Submit button spinner
- **Error:** "Invalid email or password" (generic, don't reveal which is wrong)
- **Already logged in:** Redirect to appropriate dashboard

---

## Distributor Back Office Pages

### 6. Dashboard Home (/dashboard)
- **Purpose:** Distributor's main landing page after login
- **Stats cards:** Total in organization, Direct enrollees, New this month, Unread contact messages
- **Replicated URL card:** Shows full URL with copy button and preview link
- **Recent activity:** Last 10 events in their organization (sign-ups, contacts)
- **Quick links:** Edit Profile, View Team, Check Messages
- **Empty state (new distributor):** "Welcome! Your replicated site is live at [URL]. Share it to start building your team."
- **Loading:** Skeleton cards and skeleton activity list

### 7. Profile Page (/dashboard/profile)
- **Purpose:** Edit distributor profile info and photo
- **Top section:** Photo with edit overlay → opens crop modal
- **Form:** First name, last name, phone, bio (textarea 500 chars)
- **Email:** Displayed but not editable (shows "Contact support to change email")
- **Password section:** Change password form (current, new, confirm)
- **Photo crop modal:** Upload → crop (circular, 1:1) → save to Supabase Storage
- **Loading:** Form skeleton
- **Empty photo state:** Large initials avatar with "Add Photo" overlay

### 8. Team Page (/dashboard/team)
- **Purpose:** Genealogy tree and organization list
- **Tabs:** Tree View (default) | List View
- **Tree View:**
  - react-d3-tree component, vertical orientation
  - Custom nodes: photo circle (40px), name, direct/spillover badge, joined date
  - Green nodes = direct enrollees, orange = spillover, gray dashed = empty slots
  - Zoom controls, pan, center button, collapse/expand
  - Click node → detail panel slides in from right
  - Default: show 3 levels, lazy load deeper on expand
- **List View:**
  - Table: Name, Email, Phone, Type (Direct/Spillover), Enrolled By, Date, Status
  - Sortable, searchable, filterable (Direct Only / All)
  - Pagination 25/page
- **Detail Panel:** Photo, name, email, phone, joined date, enroller, matrix level, org stats
- **Empty state:** "No team members yet. Share your link: [URL]. Here's how to get started..."
- **Loading:** Tree skeleton (pulsing circles and lines), table skeleton

### 9. Contacts Page (/dashboard/contacts)
- **Purpose:** View and manage messages from replicated page visitors
- **Table:** Sender name, email, message preview (50 chars), date, status badge
- **Unread styling:** Bold text, left accent border
- **Click row → message detail:** Full message, sender info, reply via mailto, mark read, archive
- **Filters:** All, New, Read, Archived
- **Bulk actions:** Mark as read, archive (with checkboxes)
- **Pagination:** 25/page
- **Empty state:** "No messages yet. When visitors contact you through your page, their messages appear here."
- **Loading:** Table skeleton

### 10. Stats Page (/dashboard/stats)
- **Purpose:** Organization statistics and growth metrics
- **Cards:** Total org size, direct enrollees, levels filled (X of 7), this month's sign-ups
- **Chart:** Sign-ups over time (last 30 days, line chart via Recharts)
- **Org breakdown:** Table showing count per level (Level 1: X, Level 2: X, etc.)
- **Loading:** Chart skeleton, card skeletons

---

## Admin Pages

### 11. Admin Dashboard (/admin)
- **Purpose:** System overview for Apex administrators
- **Stats:** Total distributors, active, inactive, suspended, new this week/month
- **Sign-up funnel chart:** Page views → started → completed (from signup_analytics)
- **Recent activity feed:** Last 20 system events
- **Loading:** Card skeletons, chart skeleton

### 12. Distributors List (/admin/distributors)
- **Purpose:** Manage all distributors
- **Table:** Name, Username, Email, Enroller Name, Status badge, Joined Date
- **Search:** By name, email, or username
- **Filters:** Status (all, active, inactive, suspended)
- **Sort:** Any column
- **Click row → detail:** Full distributor info, org stats, suspend/reactivate button
- **Actions:** Suspend (with confirm dialog), reactivate, export CSV
- **Pagination:** 50/page
- **Loading:** Table skeleton

### 13. Org Tree (/admin/org-tree)
- **Purpose:** View entire organization from root
- **Same react-d3-tree as distributor view but starts from root**
- **Search:** Find distributor → center tree on them
- **Colors:** Active (green), inactive (gray), suspended (red)
- **Loading:** Tree skeleton

### 14. Admin Settings (/admin/settings)
- **Purpose:** System configuration
- **Settings:** Maintenance mode toggle, default settings from system_settings table
- **All changes → audit_log**
- **Loading:** Form skeleton

---

## Error Pages

### 15. 404 Page
- **Design:** Friendly, on-brand
- **Content:** "Page not found" + search for distributor by name/username + link to home
- **When /{username} is invalid:** "This distributor page doesn't exist. Looking for someone? Try searching below."

### 16. 500 Page
- **Content:** "Something went wrong. We've been notified." + retry button + link to home
