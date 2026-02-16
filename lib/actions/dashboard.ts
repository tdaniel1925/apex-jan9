// SPEC: SPEC-WORKFLOWS > WF-4, WF-5, WF-6
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Back Office
// Server actions for distributor dashboard

"use server";

import { requireDistributor } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  distributors,
  matrixPositions,
  contactSubmissions,
  notifications,
  activityLog,
  type Distributor,
  type ContactSubmission,
  type Notification,
} from "@/lib/db/schema";
import { eq, sql, and, or, desc, asc, ilike } from "drizzle-orm";
import { logActivity, createNotification } from "@/lib/db/queries";
import { createClient } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/types/schemas";
import { z } from "zod";

// ============================================
// DASHBOARD STATS
// ============================================

export type DashboardStats = {
  totalOrg: number;
  directEnrollees: number;
  newThisMonth: number;
  unreadContacts: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const user = await requireDistributor();

    // Get distributor's matrix position
    const [position] = await db
      .select()
      .from(matrixPositions)
      .where(eq(matrixPositions.distributorId, user.id))
      .limit(1);

    if (!position) {
      return {
        totalOrg: 0,
        directEnrollees: 0,
        newThisMonth: 0,
        unreadContacts: 0,
      };
    }

    // Total org size using nested set
    const orgCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(matrixPositions)
      .where(
        and(
          sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
          sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`
        )
      );

    // Direct enrollees
    const directCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(eq(distributors.enrollerId, user.id));

    // New this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const newThisMonthResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(matrixPositions)
      .innerJoin(distributors, eq(matrixPositions.distributorId, distributors.id))
      .where(
        and(
          sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
          sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`,
          sql`${distributors.createdAt} >= ${firstOfMonth}`
        )
      );

    // Unread contacts
    const unreadContactsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contactSubmissions)
      .where(
        and(
          eq(contactSubmissions.distributorId, user.id),
          eq(contactSubmissions.status, "new")
        )
      );

    return {
      totalOrg: Number(orgCountResult[0]?.count || 0),
      directEnrollees: Number(directCountResult[0]?.count || 0),
      newThisMonth: Number(newThisMonthResult[0]?.count || 0),
      unreadContacts: Number(unreadContactsResult[0]?.count || 0),
    };
  } catch (error) {
    return {
      totalOrg: 0,
      directEnrollees: 0,
      newThisMonth: 0,
      unreadContacts: 0,
    };
  }
}

// ============================================
// RECENT ACTIVITY
// ============================================

export type ActivityItem = {
  id: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  try {
    const user = await requireDistributor();

    const activities = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.actorId, user.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return activities.map((a) => ({
      id: a.id,
      action: a.action,
      targetId: a.targetId,
      targetType: a.targetType,
      metadata: a.metadata as Record<string, unknown> | null,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    return [];
  }
}

// ============================================
// PROFILE UPDATE
// ============================================

export type ProfileUpdateData = {
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
};

export async function updateProfile(data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input first
    const validation = profileUpdateSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input data",
      };
    }

    const user = await requireDistributor();

    await db
      .update(distributors)
      .set({
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        phone: validation.data.phone || null,
        bio: validation.data.bio || null,
        updatedAt: new Date(),
      })
      .where(eq(distributors.id, user.id));

    await logActivity({
      actorId: user.id,
      actorType: "distributor",
      action: "profile.updated",
      targetId: user.id,
      targetType: "distributor",
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    // Error already logged and returned to client
    return { success: false, error: "Failed to update profile" };
  }
}

// ============================================
// PHOTO UPLOAD
// ============================================

export type PhotoUploadResult = {
  success: boolean;
  photoUrl?: string;
  error?: string;
};

export async function updatePhoto(
  photoUrl: string,
  cropData?: Record<string, unknown>
): Promise<PhotoUploadResult> {
  try {
    // Validate photo URL
    const photoUrlValidation = z.string().url().safeParse(photoUrl);
    if (!photoUrlValidation.success) {
      return {
        success: false,
        error: "Invalid photo URL",
      };
    }

    const user = await requireDistributor();

    await db
      .update(distributors)
      .set({
        photoUrl: photoUrlValidation.data,
        photoCropData: cropData || null,
        updatedAt: new Date(),
      })
      .where(eq(distributors.id, user.id));

    await logActivity({
      actorId: user.id,
      actorType: "distributor",
      action: "profile.photo_updated",
      targetId: user.id,
      targetType: "distributor",
    });

    revalidatePath("/dashboard/profile");
    revalidatePath(`/${user.username}`);
    return { success: true, photoUrl };
  } catch (error) {
    // Error already logged and returned to client
    return { success: false, error: "Failed to update photo" };
  }
}

// ============================================
// PASSWORD CHANGE
// ============================================

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate passwords
    const passwordValidation = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    }).safeParse({ currentPassword, newPassword });

    if (!passwordValidation.success) {
      return {
        success: false,
        error: passwordValidation.error.errors[0]?.message || "Invalid password",
      };
    }

    const user = await requireDistributor();
    const supabase = await createClient();

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: "Failed to change password" };
    }

    await logActivity({
      actorId: user.id,
      actorType: "distributor",
      action: "profile.password_changed",
      targetId: user.id,
      targetType: "distributor",
    });

    return { success: true };
  } catch (error) {
    // Error already logged and returned to client
    return { success: false, error: "Failed to change password" };
  }
}

// ============================================
// ORG TREE & LIST
// ============================================

export type OrgMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  username: string;
  status: string;
  enrollerId: string | null;
  enrollerName: string | null;
  isDirect: boolean;
  isSpillover: boolean;
  depth: number;
  positionIndex: number;
  joinedAt: Date;
  childCount: number;
};

export async function getOrgList(params?: {
  directOnly?: boolean;
  searchTerm?: string;
  sortBy?: "name" | "date" | "email";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<{ members: OrgMember[]; total: number }> {
  const user = await requireDistributor();
  const {
    directOnly = false,
    searchTerm = "",
    sortBy = "date",
    sortOrder = "desc",
    page = 1,
    pageSize = 25,
  } = params || {};

  // Get user's position
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, user.id))
    .limit(1);

  if (!position) {
    return { members: [], total: 0 };
  }

  // Build query conditions
  const conditions = [
    sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
    sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`,
  ];

  if (directOnly) {
    conditions.push(eq(distributors.enrollerId, user.id));
  }

  if (searchTerm) {
    // Sanitize and validate search input
    const sanitizedSearch = searchTerm.trim().slice(0, 100);
    if (sanitizedSearch) {
      conditions.push(
        or(
          ilike(distributors.firstName, `%${sanitizedSearch}%`),
          ilike(distributors.lastName, `%${sanitizedSearch}%`),
          ilike(distributors.email, `%${sanitizedSearch}%`)
        )!
      );
    }
  }

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(matrixPositions)
    .innerJoin(distributors, eq(matrixPositions.distributorId, distributors.id))
    .where(and(...conditions));

  const total = Number(totalResult[0]?.count || 0);

  // Get paginated results
  const orderColumn =
    sortBy === "name"
      ? distributors.firstName
      : sortBy === "email"
        ? distributors.email
        : distributors.createdAt;

  const orderFn = sortOrder === "asc" ? asc : desc;

  const offset = (page - 1) * pageSize;

  const results = await db
    .select({
      id: distributors.id,
      firstName: distributors.firstName,
      lastName: distributors.lastName,
      email: distributors.email,
      phone: distributors.phone,
      photoUrl: distributors.photoUrl,
      username: distributors.username,
      status: distributors.status,
      enrollerId: distributors.enrollerId,
      isSpillover: matrixPositions.isSpillover,
      depth: matrixPositions.depth,
      positionIndex: matrixPositions.positionIndex,
      joinedAt: distributors.createdAt,
      leftBoundary: matrixPositions.leftBoundary,
      rightBoundary: matrixPositions.rightBoundary,
    })
    .from(matrixPositions)
    .innerJoin(distributors, eq(matrixPositions.distributorId, distributors.id))
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn))
    .limit(pageSize)
    .offset(offset);

  // Get enroller names and child counts
  const members: OrgMember[] = await Promise.all(
    results.map(async (member) => {
      let enrollerName = null;
      if (member.enrollerId) {
        const [enroller] = await db
          .select({ firstName: distributors.firstName, lastName: distributors.lastName })
          .from(distributors)
          .where(eq(distributors.id, member.enrollerId))
          .limit(1);
        enrollerName = enroller ? `${enroller.firstName} ${enroller.lastName}` : null;
      }

      // Count direct children
      const childCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(matrixPositions)
        .where(
          and(
            sql`${matrixPositions.leftBoundary} > ${member.leftBoundary}`,
            sql`${matrixPositions.rightBoundary} < ${member.rightBoundary}`,
            sql`${matrixPositions.depth} = ${member.depth + 1}`
          )
        );

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        photoUrl: member.photoUrl,
        username: member.username,
        status: member.status,
        enrollerId: member.enrollerId,
        enrollerName,
        isDirect: member.enrollerId === user.id,
        isSpillover: member.isSpillover,
        depth: member.depth,
        positionIndex: member.positionIndex,
        joinedAt: member.joinedAt,
        childCount: Number(childCountResult[0]?.count || 0),
      };
    })
  );

  return { members, total };
}

// Type for tree node (used by react-d3-tree)
export type TreeNode = {
  name: string;
  attributes: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string;
    username: string;
    isDirect: boolean;
    isSpillover: boolean;
    joinedAt: string;
    depth: number;
    positionIndex: number;
    childCount: number;
  };
  children?: TreeNode[];
};

export async function getOrgTree(maxDepth: number = 3): Promise<TreeNode | null> {
  try {
    const user = await requireDistributor();

    // Get user's position
    const [rootPosition] = await db
      .select()
      .from(matrixPositions)
      .where(eq(matrixPositions.distributorId, user.id))
      .limit(1);

    if (!rootPosition) {
      return null;
    }

    // Recursively build tree
    async function buildNode(positionId: string, currentDepth: number): Promise<TreeNode | null> {
      const [position] = await db
        .select()
        .from(matrixPositions)
        .where(eq(matrixPositions.id, positionId))
        .limit(1);

      if (!position) return null;

      const [distributor] = await db
        .select()
        .from(distributors)
        .where(eq(distributors.id, position.distributorId))
        .limit(1);

      if (!distributor) return null;

      // Get direct children positions
      const children = await db
        .select()
        .from(matrixPositions)
        .where(eq(matrixPositions.parentId, position.id))
        .orderBy(asc(matrixPositions.positionIndex));

      // Count total children
      const childCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(matrixPositions)
        .where(
          and(
            sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
            sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`,
            sql`${matrixPositions.depth} = ${position.depth + 1}`
          )
        );

      const node: TreeNode = {
        name: `${distributor.firstName} ${distributor.lastName}`,
        attributes: {
          id: distributor.id,
          firstName: distributor.firstName,
          lastName: distributor.lastName,
          email: distributor.email,
          photoUrl: distributor.photoUrl || "",
          username: distributor.username,
          isDirect: distributor.enrollerId === user.id,
          isSpillover: position.isSpillover,
          joinedAt: distributor.createdAt.toISOString(),
          depth: position.depth,
          positionIndex: position.positionIndex,
          childCount: Number(childCountResult[0]?.count || 0),
        },
      };

      // Load children if under max depth
      if (currentDepth < maxDepth && children.length > 0) {
        const childNodes = await Promise.all(
          children.map((child) => buildNode(child.id, currentDepth + 1))
        );
        node.children = childNodes.filter((n): n is TreeNode => n !== null);
      }

      return node;
    }

    return buildNode(rootPosition.id, 0);
  } catch (error) {
    return null;
  }
}

// ============================================
// CONTACTS
// ============================================

export type ContactSubmissionWithStatus = ContactSubmission;

export async function getContactSubmissions(params?: {
  status?: "new" | "read" | "replied" | "archived";
  page?: number;
  pageSize?: number;
}): Promise<{ submissions: ContactSubmissionWithStatus[]; total: number }> {
  try {
    const user = await requireDistributor();
    const { status, page = 1, pageSize = 25 } = params || {};

    const conditions = [eq(contactSubmissions.distributorId, user.id)];
    if (status) {
      conditions.push(eq(contactSubmissions.status, status));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contactSubmissions)
      .where(and(...conditions));

    const total = Number(totalResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;

    const submissions = await db
      .select()
      .from(contactSubmissions)
      .where(and(...conditions))
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { submissions, total };
  } catch (error) {
    return { submissions: [], total: 0 };
  }
}

export async function markContactAsRead(submissionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate submission ID
    const idValidation = z.string().uuid().safeParse(submissionId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid submission ID" };
    }

    const user = await requireDistributor();

    await db
      .update(contactSubmissions)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(contactSubmissions.id, submissionId),
          eq(contactSubmissions.distributorId, user.id)
        )
      );

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to mark contact as read" };
  }
}

export async function archiveContact(submissionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate submission ID
    const idValidation = z.string().uuid().safeParse(submissionId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid submission ID" };
    }

    const user = await requireDistributor();

    await db
      .update(contactSubmissions)
      .set({
        status: "archived",
      })
      .where(
        and(
          eq(contactSubmissions.id, submissionId),
          eq(contactSubmissions.distributorId, user.id)
        )
      );

    revalidatePath("/dashboard/contacts");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to archive contact" };
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(limit: number = 10): Promise<Notification[]> {
  const user = await requireDistributor();

  const notifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.distributorId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return notifs;
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    const user = await requireDistributor();

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.distributorId, user.id)
        )
      );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    // Error already handled
    return { success: false };
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireDistributor();

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.distributorId, user.id),
        eq(notifications.isRead, false)
      )
    );

  return Number(result[0]?.count || 0);
}

// ============================================
// STATS PAGE DATA
// ============================================

export type StatsData = {
  totalOrg: number;
  directEnrollees: number;
  levelsFilled: number;
  newThisMonth: number;
  signupsByDay: Array<{ date: string; count: number }>;
  orgByLevel: Array<{ level: number; count: number }>;
};

export async function getStatsData(): Promise<StatsData> {
  const user = await requireDistributor();

  // Get user's position
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, user.id))
    .limit(1);

  if (!position) {
    return {
      totalOrg: 0,
      directEnrollees: 0,
      levelsFilled: 0,
      newThisMonth: 0,
      signupsByDay: [],
      orgByLevel: [],
    };
  }

  // Reuse getDashboardStats for basic stats
  const basicStats = await getDashboardStats();

  // Get max depth in org
  const maxDepthResult = await db
    .select({ maxDepth: sql<number>`MAX(${matrixPositions.depth})` })
    .from(matrixPositions)
    .where(
      and(
        sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
        sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`
      )
    );

  const levelsFilled = Number(maxDepthResult[0]?.maxDepth || 0);

  // Sign-ups by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const signupsByDayResult = await db
    .select({
      date: sql<string>`DATE(${distributors.createdAt})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(matrixPositions)
    .innerJoin(distributors, eq(matrixPositions.distributorId, distributors.id))
    .where(
      and(
        sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
        sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`,
        sql`${distributors.createdAt} >= ${thirtyDaysAgo}`
      )
    )
    .groupBy(sql`DATE(${distributors.createdAt})`)
    .orderBy(sql`DATE(${distributors.createdAt})`);

  // Org by level
  const orgByLevelResult = await db
    .select({
      level: matrixPositions.depth,
      count: sql<number>`COUNT(*)`,
    })
    .from(matrixPositions)
    .where(
      and(
        sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
        sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`
      )
    )
    .groupBy(matrixPositions.depth)
    .orderBy(asc(matrixPositions.depth));

  return {
    totalOrg: basicStats.totalOrg,
    directEnrollees: basicStats.directEnrollees,
    levelsFilled,
    newThisMonth: basicStats.newThisMonth,
    signupsByDay: signupsByDayResult.map((row) => ({
      date: row.date,
      count: Number(row.count),
    })),
    orgByLevel: orgByLevelResult.map((row) => ({
      level: row.level,
      count: Number(row.count),
    })),
  };
}
