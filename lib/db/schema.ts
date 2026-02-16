// SPEC: SPEC-DATA-MODEL > All 11 tables
// Drizzle ORM schema for PostgreSQL via Supabase

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const distributorStatusEnum = pgEnum("distributor_status", [
  "active",
  "inactive",
  "suspended",
]);

export const dripStatusEnum = pgEnum("drip_status", [
  "enrolled",
  "paused",
  "completed",
  "opted_out",
]);

export const contactStatusEnum = pgEnum("contact_status", [
  "new",
  "read",
  "replied",
  "archived",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "admin",
  "viewer",
]);

export const actorTypeEnum = pgEnum("actor_type", [
  "distributor",
  "admin",
  "system",
  "visitor",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_contact",
  "new_signup",
  "new_team_member",
  "system",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "text",
  "html",
  "image_url",
  "json",
]);

export const signupEventEnum = pgEnum("signup_event", [
  "page_view",
  "signup_started",
  "username_checked",
  "signup_completed",
  "signup_failed",
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "agents",
  "newcomers",
  "both",
]);

// ============================================
// TABLES
// ============================================

export const distributors = pgTable("distributors", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  photoCropData: jsonb("photo_crop_data"),
  enrollerId: uuid("enroller_id"),
  status: distributorStatusEnum("status").notNull().default("active"),
  dripStatus: dripStatusEnum("drip_status").notNull().default("enrolled"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  replicatedSiteActive: boolean("replicated_site_active")
    .notNull()
    .default(true),
  targetAudience: targetAudienceEnum("target_audience")
    .notNull()
    .default("both"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matrixPositions = pgTable("matrix_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  distributorId: uuid("distributor_id")
    .notNull()
    .unique()
    .references(() => distributors.id),
  parentId: uuid("parent_id"),
  positionIndex: integer("position_index").notNull(),
  depth: integer("depth").notNull(),
  path: text("path").notNull(),
  leftBoundary: integer("left_boundary").notNull(),
  rightBoundary: integer("right_boundary").notNull(),
  isSpillover: boolean("is_spillover").notNull().default(false),
  placedAt: timestamp("placed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => distributors.id),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  visitorPhone: text("visitor_phone"),
  message: text("message").notNull(),
  status: contactStatusEnum("status").notNull().default("new"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const dripEnrollments = pgTable("drip_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => distributors.id),
  campaignId: text("campaign_id").notNull().default("welcome_series"),
  status: dripStatusEnum("status").notNull().default("enrolled"),
  currentStep: integer("current_step").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  nextSendAt: timestamp("next_send_at", { withTimezone: true }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: adminRoleEnum("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorType: actorTypeEnum("actor_type").notNull(),
  action: text("action").notNull(),
  targetId: uuid("target_id"),
  targetType: text("target_type"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => distributors.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionKey: text("section_key").notNull().unique(),
  contentType: contentTypeEnum("content_type").notNull(),
  content: text("content").notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const signupAnalytics = pgTable("signup_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  distributorSlug: text("distributor_slug").notNull(),
  event: signupEventEnum("event").notNull(),
  visitorIp: text("visitor_ip"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => adminUsers.id),
  action: text("action").notNull(),
  targetId: uuid("target_id"),
  targetType: text("target_type"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: text("ip_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Distributor = typeof distributors.$inferSelect;
export type NewDistributor = typeof distributors.$inferInsert;

export type MatrixPosition = typeof matrixPositions.$inferSelect;
export type NewMatrixPosition = typeof matrixPositions.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;

export type DripEnrollment = typeof dripEnrollments.$inferSelect;
export type NewDripEnrollment = typeof dripEnrollments.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;

export type SignupAnalytics = typeof signupAnalytics.$inferSelect;
export type NewSignupAnalytics = typeof signupAnalytics.$inferInsert;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
