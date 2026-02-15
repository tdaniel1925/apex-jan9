// SPEC: SPEC-DATA-MODEL > All tables
// Database query helpers for common operations

import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import {
  distributors,
  matrixPositions,
  contactSubmissions,
  signupAnalytics,
  activityLog,
  notifications,
  dripEnrollments,
  type Distributor,
  type NewContactSubmission,
  type NewSignupAnalytics,
  type NewActivityLog,
  type NewNotification,
  type MatrixPosition,
} from "./schema";

// ============================================
// DISTRIBUTOR QUERIES
// ============================================

/**
 * Find distributor by username (case-insensitive)
 * Returns null if not found, suspended, or inactive
 */
export async function findDistributorByUsername(
  username: string
): Promise<Distributor | null> {
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(sql`LOWER(${distributors.username}) = LOWER(${username})`)
    .limit(1);

  if (!distributor) return null;

  // Don't return suspended or inactive distributors
  if (
    distributor.status === "suspended" ||
    distributor.status === "inactive"
  ) {
    return null;
  }

  return distributor;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(
  username: string
): Promise<boolean> {
  const [existing] = await db
    .select({ id: distributors.id })
    .from(distributors)
    .where(sql`LOWER(${distributors.username}) = LOWER(${username})`)
    .limit(1);

  return !existing;
}

/**
 * Check if email is already registered
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: distributors.id })
    .from(distributors)
    .where(sql`LOWER(${distributors.email}) = LOWER(${email})`)
    .limit(1);

  return !existing;
}

/**
 * Get the company root distributor (for generic sign-ups)
 */
export async function getCompanyRootDistributor(): Promise<Distributor> {
  // Find the distributor at root of matrix (depth = 0)
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.depth, 0))
    .limit(1);

  if (!position) {
    throw new Error("Company root distributor not found");
  }

  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, position.distributorId))
    .limit(1);

  if (!distributor) {
    throw new Error("Company root distributor record not found");
  }

  return distributor;
}

/**
 * Get distributor's matrix position
 */
export async function getDistributorMatrixPosition(
  distributorId: string
): Promise<MatrixPosition | null> {
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, distributorId))
    .limit(1);

  return position || null;
}

// ============================================
// CONTACT SUBMISSION
// ============================================

/**
 * Create a new contact submission
 */
export async function createContactSubmission(
  data: NewContactSubmission
): Promise<string> {
  const [submission] = await db
    .insert(contactSubmissions)
    .values(data)
    .returning({ id: contactSubmissions.id });

  return submission.id;
}

/**
 * Count contact submissions from an IP in the last N hours
 */
export async function countRecentContactSubmissions(
  ipAddress: string,
  hours: number = 1
): Promise<number> {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(contactSubmissions)
    .where(
      sql`${contactSubmissions.ipAddress} = ${ipAddress} AND ${contactSubmissions.createdAt} > ${cutoffTime}`
    );

  return Number(result[0]?.count || 0);
}

// ============================================
// SIGNUP ANALYTICS
// ============================================

/**
 * Track a signup analytics event
 */
export async function trackSignupEvent(
  data: NewSignupAnalytics
): Promise<void> {
  await db.insert(signupAnalytics).values(data);
}

// ============================================
// ACTIVITY LOG
// ============================================

/**
 * Log an activity
 */
export async function logActivity(data: NewActivityLog): Promise<void> {
  await db.insert(activityLog).values(data);
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Create an in-app notification for a distributor
 */
export async function createNotification(
  data: NewNotification
): Promise<string> {
  const [notification] = await db
    .insert(notifications)
    .values(data)
    .returning({ id: notifications.id });

  return notification.id;
}

/**
 * Get unread notification count for a distributor
 */
export async function getUnreadNotificationCount(
  distributorId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(
      sql`${notifications.distributorId} = ${distributorId} AND ${notifications.isRead} = false`
    );

  return Number(result[0]?.count || 0);
}

// ============================================
// DRIP ENROLLMENTS
// ============================================

/**
 * Create a drip enrollment for a new distributor
 */
export async function createDripEnrollment(distributorId: string) {
  await db.insert(dripEnrollments).values({
    distributorId,
    campaignId: "welcome_series",
    status: "enrolled",
    currentStep: 0,
  });
}
