# SPEC-WORKFLOWS.md — Apex Affinity Group Platform v1

## Gate 4+5: Workflows

---

## WF-1: Distributor Sign-Up

**Trigger:** Visitor clicks "Join My Team" on a replicated page, or "Join Now" on corporate page.

1. **Page loads** → System resolves enroller from URL slug. If `/join` (no slug), enroller = company root distributor. If slug not found → 404.
2. **Show enroller info** → Display enroller's name and photo at top of form so visitor knows who's sponsoring them.
3. **Visitor fills form** → First name, last name, email, phone, password, confirm password, terms checkbox.
4. **Username auto-generates** → System creates `{first_initial}.{last_name}` (lowercase, stripped of special chars). Field is editable.
5. **Real-time username check** → On every change (debounced 500ms), hit `/api/check-username`. Display green check or red X with suggestions.
6. **Visitor submits** → Client validates with Zod. If invalid → inline errors, stop.
7. **Server validates** → Re-validate all fields. Check username final availability. Check email uniqueness.
8. **Create auth user** → Supabase Auth `signUp(email, password)`. If email already exists → return "Email already registered".
9. **Create distributor** → Insert into distributors table with all fields, enroller_id, status='active', drip_status='enrolled'.
10. **Matrix placement** → Run placement algorithm (src/lib/matrix/placement.ts):
    - Find enroller's matrix_position
    - If enroller has < 5 children → place as next child (position_index = count of existing children). Set is_spillover = false.
    - If full → BFS through enroller's subtree. Find shallowest node with < 5 children. Place there. Set is_spillover = true.
    - Calculate path, update nested set boundaries.
    - All in a transaction with row-level locking to prevent race conditions.
11. **Create drip enrollment** → Insert drip_enrollments (campaign: 'welcome_series', status: 'enrolled', step: 0).
12. **Send welcome email** → Via Resend to new distributor. Include replicated URL and login link.
13. **Send notification to enroller** → Email + in-app notification: "[Name] just joined your team!"
14. **If spillover** → Also send notification to the parent position's distributor: "[Name] was placed in your organization."
15. **Log activity** → activity_log: 'distributor.signed_up'. signup_analytics: 'signup_completed'.
16. **Redirect** → /login with toast "Account created! You can now log in."

**Failure handling:**
- Auth creation fails → return specific error, no distributor record created
- Matrix placement fails → rollback entire transaction (delete auth user, distributor record)
- Email send fails → log warning, continue (don't block sign-up)
- Concurrent sign-ups → DB transaction + row lock on parent position prevents double placement

---

## WF-2: Username Availability Check

**Trigger:** User types in username field on sign-up form.

1. **Client debounces** → 500ms after last keystroke.
2. **Client calls** → GET `/api/check-username?username={value}&firstName={}&lastName={}`
3. **Server validates format** → 3-30 chars, lowercase, letters/numbers/dots, no consecutive dots, no start/end dot.
4. **Server checks DB** → `SELECT 1 FROM distributors WHERE username = ? LIMIT 1`
5. **If available** → Return `{ available: true }`
6. **If taken** → Generate suggestions from name: `{firstname}.{lastname}`, `{fi}.{lastname}1`, `{fi}.{lastname}2`, `{first}.{last}`. Check each. Return `{ available: false, suggestions: [...available ones] }`
7. **Client displays** → Green check or red X with clickable suggestions.

**Rate limit:** 20 requests per minute per IP. Over limit → return `{ available: false, error: 'rate_limited' }`.

---

## WF-3: Contact Form Submission

**Trigger:** Visitor fills out contact form on a replicated page.

1. **Visitor fills form** → Name, email, phone (optional), message.
2. **Client validates** → Zod schema (name 2-100 chars, valid email, message 10-1000 chars).
3. **Client submits** → Server action.
4. **Server validates** → Re-validate with Zod.
5. **Rate limit check** → 3 submissions per hour per IP. If over → return error "Please wait before sending another message."
6. **Save to DB** → Insert contact_submissions (status: 'new', distributor_id from URL slug lookup).
7. **Send email** → Via Resend to distributor: "New message from [Visitor Name] via your Apex page." Include message preview, link to dashboard.
8. **Create notification** → In-app notification for distributor (type: 'new_contact').
9. **Log activity** → activity_log: 'contact.submitted'.
10. **Return success** → Client shows toast "Message sent to [Distributor Name]!"

**Failure:** Email fails → still save submission (distributor will see it in dashboard). Rate limited → friendly error, submission not saved.

---

## WF-4: Profile Update

**Trigger:** Distributor edits their profile in /dashboard/profile.

1. **Distributor edits fields** → First name, last name, phone, bio.
2. **Client validates** → Zod schema.
3. **Submit** → Server action.
4. **Server validates** → Zod + check auth (must be the same distributor).
5. **Update DB** → Update distributors record (only allowed columns).
6. **Log activity** → activity_log: 'profile.updated'.
7. **Toast** → "Profile updated!"

---

## WF-5: Photo Upload & Crop

**Trigger:** Distributor clicks "Upload Photo" or edit overlay on profile page.

1. **File picker opens** → Accept JPG, PNG, WebP. Max 5MB.
2. **Client validates** → File type (MIME check), file size.
3. **Crop modal opens** → Show image with circular crop area (1:1 ratio). Zoom slider. Drag to reposition.
4. **Distributor adjusts crop** → Zoom, drag.
5. **Click "Save"** → Client crops image on canvas, converts to WebP (quality 80%), creates blob.
6. **Upload to Supabase Storage** → Path: `profile-photos/{distributor_id}/{timestamp}.webp`.
7. **Delete old photo** → Remove previous file from storage (if exists).
8. **Update DB** → Set distributor.photo_url and photo_crop_data.
9. **Log activity** → activity_log: 'profile.photo_updated'.
10. **Close modal** → Show new photo in profile and header.

**Failure:** Upload fails → toast error, keep old photo. File too large → error before upload. Invalid type → error before crop modal.

---

## WF-6: View Genealogy Tree

**Trigger:** Distributor navigates to /dashboard/team.

1. **Page loads** → Fetch distributor's matrix_position.
2. **Fetch tree data** → Server action: get all matrix_positions in distributor's subtree (3 levels deep initially), joined with distributor data (name, photo, status).
3. **Calculate node types** → For each node, determine if direct enrollee (enroller_id = current user) or spillover.
4. **Render tree** → react-d3-tree with custom nodes (photo, name, badge, date).
5. **Expand deeper** → When user clicks expand on a node, fetch that node's children (lazy load).
6. **Click node** → Detail panel slides in with full info.
7. **Switch to list** → Click "List View" tab → fetch paginated table data.

**Empty state:** "No team members yet. Share your replicated site link to start building!"
**Large org:** Lazy load subtrees. Max 3 levels rendered at once. Node shows child count badge.

---

## WF-7: Admin Suspend/Reactivate Distributor

**Trigger:** Super admin clicks Suspend or Reactivate on a distributor.

1. **Confirm dialog** → "Are you sure you want to suspend [Name]? Their replicated site will be deactivated."
2. **Admin confirms** → Server action.
3. **Update DB** → Set distributor.status = 'suspended', replicated_site_active = false. (Or reverse for reactivate.)
4. **Log audit** → audit_log with before/after state, admin_id, IP.
5. **Log activity** → activity_log: 'distributor.suspended' or 'distributor.reactivated'.
6. **Toast** → "Distributor suspended" or "Distributor reactivated".

**Edge cases:** Cannot suspend root/company distributor. Cannot suspend self. Viewer role cannot perform this action.

---

## WF-8: Distributor Login

**Trigger:** User navigates to /login and submits credentials.

1. **Submit email + password** → Supabase Auth `signInWithPassword`.
2. **Check role** → Query admin_users for matching auth_user_id.
3. **If admin** → Redirect to /admin.
4. **If distributor** → Update distributor.last_login_at. Redirect to /dashboard.
5. **If neither** → Show error "Account not found."
6. **Set session** → httpOnly cookie via Supabase SSR.

**Failure:** Invalid credentials → "Invalid email or password" (generic). Account suspended → "Your account has been suspended. Contact support."
