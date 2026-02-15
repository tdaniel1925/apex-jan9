# SPEC-DATA-MODEL.md — Apex Affinity Group Platform v1

## Gate 2: Data Model

---

### distributors
The core entity. Every person who signs up becomes a distributor.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| auth_user_id | uuid | FK → auth.users, unique, nullable (set after email verification) |
| username | text | unique, lowercase, URL slug (e.g., 'j.smith') |
| first_name | text | |
| last_name | text | |
| email | text | unique |
| phone | text | nullable |
| bio | text | nullable, shown on replicated page |
| photo_url | text | nullable, Supabase Storage path |
| photo_crop_data | jsonb | nullable, crop coordinates for display |
| enroller_id | uuid | nullable, FK → distributors (who recruited them — the URL slug owner) |
| status | enum | 'active', 'inactive', 'suspended' |
| drip_status | enum | 'enrolled', 'paused', 'completed', 'opted_out' |
| last_login_at | timestamptz | nullable |
| replicated_site_active | boolean | default true |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

INDEX on username (unique). INDEX on email (unique). INDEX on enroller_id. INDEX on status.

---

### matrix_positions
Tracks WHERE each distributor sits in the 5×7 forced matrix tree. Separated from distributors so the matrix structure can be modified without changing distributor data.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| distributor_id | uuid | FK → distributors, unique (one position per distributor) |
| parent_id | uuid | nullable, FK → matrix_positions (who they sit UNDER in the matrix — may differ from enroller) |
| position_index | integer | 0-4, which of the 5 slots under parent this position occupies |
| depth | integer | 0 = root, 1-7 for levels. Max 7. |
| path | text | materialized path for fast subtree queries, e.g., 'root.pos1.pos3.pos2' |
| left_boundary | integer | nested set left value for fast descendant queries |
| right_boundary | integer | nested set right value |
| is_spillover | boolean | true if enroller_id != parent's distributor_id (placed by auto-fill, not direct enroll) |
| placed_at | timestamptz | when this position was filled |
| created_at | timestamptz | |

INDEX on distributor_id (unique). INDEX on parent_id. INDEX on path (text_pattern_ops for LIKE queries). INDEX on (left_boundary, right_boundary). INDEX on depth.

**Placement algorithm (auto-fill, left-to-right, top-to-bottom):**
1. Start at the enroller's matrix_position
2. Check if enroller has < 5 children → if yes, place in next open position_index (0-4)
3. If enroller's 5 slots are full, BFS (breadth-first search) through enroller's subtree
4. Find first position at shallowest depth with < 5 children
5. Place new distributor there, set is_spillover = true (since parent != enroller)
6. Update path, left_boundary, right_boundary
7. If entire 7-level matrix is full, reject placement (edge case for v1)

---

### contact_submissions
Messages from visitors on replicated pages.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| distributor_id | uuid | FK → distributors (whose replicated page the form was on) |
| visitor_name | text | |
| visitor_email | text | |
| visitor_phone | text | nullable |
| message | text | |
| status | enum | 'new', 'read', 'replied', 'archived' |
| ip_address | text | nullable, for rate limiting |
| created_at | timestamptz | |
| read_at | timestamptz | nullable |

INDEX on (distributor_id, status, created_at DESC).

---

### drip_enrollments
Tracks drip campaign status per distributor. Placeholder for future drip system.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| distributor_id | uuid | FK → distributors |
| campaign_id | text | default 'welcome_series' (future: multiple campaigns) |
| status | enum | 'enrolled', 'paused', 'completed', 'opted_out' |
| current_step | integer | default 0 (which email in the sequence) |
| last_sent_at | timestamptz | nullable |
| next_send_at | timestamptz | nullable |
| enrolled_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

INDEX on (distributor_id, campaign_id). INDEX on (status, next_send_at) for cron pickup.

---

### admin_users
Separate from distributors. Admin accounts for Apex corporate staff.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| auth_user_id | uuid | FK → auth.users, unique |
| email | text | unique |
| first_name | text | |
| last_name | text | |
| role | enum | 'super_admin', 'admin', 'viewer' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

INDEX on auth_user_id (unique). INDEX on email (unique).

---

### activity_log
Append-only log of all significant actions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| actor_id | uuid | nullable, FK → distributors or admin_users |
| actor_type | enum | 'distributor', 'admin', 'system', 'visitor' |
| action | text | e.g., 'distributor.signed_up', 'contact.submitted', 'profile.updated', 'matrix.placed' |
| target_id | uuid | nullable, FK to relevant entity |
| target_type | text | nullable, e.g., 'distributor', 'contact_submission' |
| metadata | jsonb | nullable, additional context |
| ip_address | text | nullable |
| created_at | timestamptz | |

INDEX on (actor_id, created_at DESC). INDEX on (target_id, created_at DESC). INDEX on (action, created_at DESC). Append-only — no updates or deletes.

---

### notifications
In-app notifications for distributors.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| distributor_id | uuid | FK → distributors |
| type | enum | 'new_contact', 'new_signup', 'new_team_member', 'system' |
| title | text | |
| body | text | |
| action_url | text | nullable, deep link |
| is_read | boolean | default false |
| created_at | timestamptz | |
| read_at | timestamptz | nullable |

INDEX on (distributor_id, is_read, created_at DESC).

---

### site_content
CMS-lite for corporate marketing page sections. Admin-editable.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| section_key | text | unique, e.g., 'hero_title', 'hero_subtitle', 'about_text', 'opportunity_text' |
| content_type | enum | 'text', 'html', 'image_url', 'json' |
| content | text | the actual content |
| updated_by | uuid | nullable, FK → admin_users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

INDEX on section_key (unique).

---

### signup_analytics
Tracks sign-up funnel for analytics.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| distributor_slug | text | which replicated page they came from |
| event | enum | 'page_view', 'signup_started', 'username_checked', 'signup_completed', 'signup_failed' |
| visitor_ip | text | nullable |
| user_agent | text | nullable |
| referrer | text | nullable |
| metadata | jsonb | nullable |
| created_at | timestamptz | |

INDEX on (distributor_slug, event, created_at DESC). INDEX on (event, created_at DESC).

---

### system_settings
Key-value store for system configuration.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| key | text | unique, e.g., 'max_matrix_depth', 'drip_enabled', 'maintenance_mode' |
| value | text | |
| updated_by | uuid | nullable, FK → admin_users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

INDEX on key (unique).

---

### audit_log
Security audit trail for admin actions. Separate from activity_log for compliance.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| admin_id | uuid | FK → admin_users |
| action | text | e.g., 'distributor.suspended', 'distributor.reactivated', 'settings.changed' |
| target_id | uuid | nullable |
| target_type | text | nullable |
| before_state | jsonb | nullable, state before change |
| after_state | jsonb | nullable, state after change |
| ip_address | text | |
| created_at | timestamptz | |

INDEX on (admin_id, created_at DESC). INDEX on (action, created_at DESC). Append-only.

---

## Enums

```
distributor_status: 'active', 'inactive', 'suspended'
drip_status: 'enrolled', 'paused', 'completed', 'opted_out'
contact_status: 'new', 'read', 'replied', 'archived'
admin_role: 'super_admin', 'admin', 'viewer'
actor_type: 'distributor', 'admin', 'system', 'visitor'
notification_type: 'new_contact', 'new_signup', 'new_team_member', 'system'
content_type: 'text', 'html', 'image_url', 'json'
signup_event: 'page_view', 'signup_started', 'username_checked', 'signup_completed', 'signup_failed'
```

## Key Relationships
- distributor.enroller_id → distributors.id (who recruited them)
- matrix_positions.parent_id → matrix_positions.id (where they sit in tree)
- matrix_positions.distributor_id → distributors.id (one-to-one)
- contact_submissions.distributor_id → distributors.id (whose page)
- notifications.distributor_id → distributors.id
- Enroller ≠ Parent when spillover occurs

## Matrix Query Patterns
- **Get direct children of a position:** `WHERE parent_id = ?`
- **Get all descendants (subtree):** `WHERE left_boundary > ? AND right_boundary < ?` (nested set) OR `WHERE path LIKE ?%` (materialized path)
- **Get depth of a position:** `depth` column
- **Count open slots under a position at level N:** BFS query counting children per position
- **Find next open slot (placement):** BFS from enroller's position, find first node at shallowest depth with < 5 children
