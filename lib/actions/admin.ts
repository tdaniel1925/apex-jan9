// SPEC: SPEC-WORKFLOWS > WF-7: Admin Suspend/Reactivate
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Panel
// Server actions for admin panel operations

"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  distributors,
  matrixPositions,
  activityLog,
  auditLog,
  signupAnalytics,
  systemSettings,
  type Distributor,
  type MatrixPosition,
} from "@/lib/db/schema";
import { eq, sql, and, or, desc, asc, ilike, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/rate-limit";
import { uuidSchema, systemSettingSchema } from "@/lib/types/schemas";
import { z } from "zod";

// ============================================
// TYPES
// ============================================

export type AdminStats = {
  totalDistributors: number;
  activeDistributors: number;
  inactiveDistributors: number;
  suspendedDistributors: number;
  newThisWeek: number;
  newThisMonth: number;
};

export type DistributorListItem = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  enrollerName: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
};

export type DistributorDetail = Distributor & {
  enrollerName: string | null;
  matrixPosition: MatrixPosition | null;
  totalOrg: number;
  directEnrollees: number;
};

export type SignupFunnelData = {
  pageViews: number;
  signupStarted: number;
  signupCompleted: number;
  signupFailed: number;
};

export type OrgTreeNode = {
  id: string;
  name: string;
  username: string;
  photoUrl: string | null;
  status: "active" | "inactive" | "suspended";
  isSpillover: boolean;
  depth: number;
  children: OrgTreeNode[];
};

export type RecentActivity = {
  id: string;
  action: string;
  actorType: "distributor" | "admin" | "system" | "visitor";
  targetType: string | null;
  createdAt: Date;
  metadata: any;
};

// ============================================
// ADMIN STATS
// ============================================

export async function getAdminStats(): Promise<AdminStats> {
  try {
    await requireAdmin();

    // Total distributors
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors);
    const total = Number(totalResult[0]?.count || 0);

    // Active
    const activeResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(eq(distributors.status, "active"));
    const active = Number(activeResult[0]?.count || 0);

    // Inactive
    const inactiveResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(eq(distributors.status, "inactive"));
    const inactive = Number(inactiveResult[0]?.count || 0);

    // Suspended
    const suspendedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(eq(distributors.status, "suspended"));
    const suspended = Number(suspendedResult[0]?.count || 0);

    // New this week (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newWeekResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(sql`${distributors.createdAt} >= ${oneWeekAgo}`);
    const newWeek = Number(newWeekResult[0]?.count || 0);

    // New this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const newMonthResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(distributors)
      .where(sql`${distributors.createdAt} >= ${firstOfMonth}`);
    const newMonth = Number(newMonthResult[0]?.count || 0);

    return {
      totalDistributors: total,
      activeDistributors: active,
      inactiveDistributors: inactive,
      suspendedDistributors: suspended,
      newThisWeek: newWeek,
      newThisMonth: newMonth,
    };
  } catch (error) {
    return {
      totalDistributors: 0,
      activeDistributors: 0,
      inactiveDistributors: 0,
      suspendedDistributors: 0,
      newThisWeek: 0,
      newThisMonth: 0,
    };
  }
}

// ============================================
// DISTRIBUTORS LIST
// ============================================

export type GetDistributorsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "suspended" | "all";
  sortBy?: "firstName" | "lastName" | "email" | "username" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export async function getAllDistributors(params: GetDistributorsParams = {}) {
  await requireAdmin();

  const {
    page = 1,
    limit = 50,
    search = "",
    status = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  if (status !== "all") {
    conditions.push(eq(distributors.status, status));
  }

  if (search) {
    // Sanitize search input (Drizzle parameterizes queries, but validate input)
    const sanitizedSearch = search.trim().slice(0, 100); // Limit length
    if (sanitizedSearch) {
      conditions.push(
        or(
          ilike(distributors.firstName, `%${sanitizedSearch}%`),
          ilike(distributors.lastName, `%${sanitizedSearch}%`),
          ilike(distributors.email, `%${sanitizedSearch}%`),
          ilike(distributors.username, `%${sanitizedSearch}%`)
        )!
      );
    }
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(distributors)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const totalCount = Number(countResult[0]?.count || 0);

  // Build sort
  const sortColumn = distributors[sortBy];
  const orderFn = sortOrder === "asc" ? asc : desc;

  // Get paginated results with enroller name
  const results = await db
    .select({
      id: distributors.id,
      firstName: distributors.firstName,
      lastName: distributors.lastName,
      username: distributors.username,
      email: distributors.email,
      status: distributors.status,
      createdAt: distributors.createdAt,
      enrollerId: distributors.enrollerId,
    })
    .from(distributors)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  // Get enroller names for each distributor
  const items: DistributorListItem[] = await Promise.all(
    results.map(async (d) => {
      let enrollerName: string | null = null;
      if (d.enrollerId) {
        const [enroller] = await db
          .select({
            firstName: distributors.firstName,
            lastName: distributors.lastName,
          })
          .from(distributors)
          .where(eq(distributors.id, d.enrollerId))
          .limit(1);
        if (enroller) {
          enrollerName = `${enroller.firstName} ${enroller.lastName}`;
        }
      }

      return {
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        username: d.username,
        email: d.email,
        enrollerName,
        status: d.status,
        createdAt: d.createdAt,
      };
    })
  );

  return {
    items,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// ============================================
// DISTRIBUTOR DETAIL
// ============================================

export async function getDistributorDetail(
  id: string
): Promise<DistributorDetail | null> {
  await requireAdmin();

  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, id))
    .limit(1);

  if (!distributor) {
    return null;
  }

  // Get enroller name
  let enrollerName: string | null = null;
  if (distributor.enrollerId) {
    const [enroller] = await db
      .select({
        firstName: distributors.firstName,
        lastName: distributors.lastName,
      })
      .from(distributors)
      .where(eq(distributors.id, distributor.enrollerId))
      .limit(1);
    if (enroller) {
      enrollerName = `${enroller.firstName} ${enroller.lastName}`;
    }
  }

  // Get matrix position
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, id))
    .limit(1);

  // Calculate org stats if position exists
  let totalOrg = 0;
  let directEnrollees = 0;

  if (position) {
    const orgResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(matrixPositions)
      .where(
        and(
          sql`${matrixPositions.leftBoundary} > ${position.leftBoundary}`,
          sql`${matrixPositions.rightBoundary} < ${position.rightBoundary}`
        )
      );
    totalOrg = Number(orgResult[0]?.count || 0);
  }

  const directResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(distributors)
    .where(eq(distributors.enrollerId, id));
  directEnrollees = Number(directResult[0]?.count || 0);

  return {
    ...distributor,
    enrollerName,
    matrixPosition: position || null,
    totalOrg,
    directEnrollees,
  };
}

// ============================================
// SUSPEND / REACTIVATE
// ============================================

export async function suspendDistributor(
  distributorId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  // Only super_admin can suspend
  if (admin.role !== "super_admin") {
    return { success: false, error: "Super admin access required" };
  }

  // Validate distributor ID
  const idValidation = uuidSchema.safeParse(distributorId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid distributor ID" };
  }

  // Get client IP for audit trail
  const headersList = await headers();
  const clientIp = getClientIp(headersList);

  // Get current distributor state
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, distributorId))
    .limit(1);

  if (!distributor) {
    return { success: false, error: "Distributor not found" };
  }

  // Check if it's the root distributor (prevent suspending company root)
  const [position] = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, distributorId))
    .limit(1);

  if (position && position.depth === 0) {
    return { success: false, error: "Cannot suspend root distributor" };
  }

  // Update distributor status and deactivate replicated site
  await db
    .update(distributors)
    .set({
      status: "suspended",
      replicatedSiteActive: false,
      updatedAt: new Date(),
    })
    .where(eq(distributors.id, distributorId));

  // Log to audit_log
  await db.insert(auditLog).values({
    adminId: admin.id,
    action: "distributor.suspended",
    targetId: distributorId,
    targetType: "distributor",
    beforeState: {
      status: distributor.status,
      replicatedSiteActive: distributor.replicatedSiteActive,
    },
    afterState: {
      status: "suspended",
      replicatedSiteActive: false,
    },
    ipAddress: clientIp,
  });

  // Log to activity_log
  await db.insert(activityLog).values({
    actorId: admin.id,
    actorType: "admin",
    action: "distributor.suspended",
    targetId: distributorId,
    targetType: "distributor",
    metadata: { reason },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/distributors");
  revalidatePath(`/admin/distributors/${distributorId}`);
  revalidatePath(`/${distributor.username}`);

  return { success: true };
}

export async function reactivateDistributor(
  distributorId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  // Only super_admin can reactivate
  if (admin.role !== "super_admin") {
    return { success: false, error: "Super admin access required" };
  }

  // Validate distributor ID
  const idValidation = uuidSchema.safeParse(distributorId);
  if (!idValidation.success) {
    return { success: false, error: "Invalid distributor ID" };
  }

  // Get client IP for audit trail
  const headersList = await headers();
  const clientIp = getClientIp(headersList);

  // Get current distributor state
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, distributorId))
    .limit(1);

  if (!distributor) {
    return { success: false, error: "Distributor not found" };
  }

  // Update distributor status and reactivate replicated site
  await db
    .update(distributors)
    .set({
      status: "active",
      replicatedSiteActive: true,
      updatedAt: new Date(),
    })
    .where(eq(distributors.id, distributorId));

  // Log to audit_log
  await db.insert(auditLog).values({
    adminId: admin.id,
    action: "distributor.reactivated",
    targetId: distributorId,
    targetType: "distributor",
    beforeState: {
      status: distributor.status,
      replicatedSiteActive: distributor.replicatedSiteActive,
    },
    afterState: {
      status: "active",
      replicatedSiteActive: true,
    },
    ipAddress: clientIp,
  });

  // Log to activity_log
  await db.insert(activityLog).values({
    actorId: admin.id,
    actorType: "admin",
    action: "distributor.reactivated",
    targetId: distributorId,
    targetType: "distributor",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/distributors");
  revalidatePath(`/admin/distributors/${distributorId}`);
  revalidatePath(`/${distributor.username}`);

  return { success: true };
}

// ============================================
// ORG TREE
// ============================================

export async function getFullOrgTree(maxDepth: number = 7): Promise<OrgTreeNode | null> {
  try {
    await requireAdmin();

    // Find root position (depth = 0)
    const [rootPosition] = await db
      .select()
      .from(matrixPositions)
      .where(eq(matrixPositions.depth, 0))
      .limit(1);

    if (!rootPosition) {
      return null;
    }

    // Recursive function to build tree
    async function buildNode(distributorId: string, currentDepth: number): Promise<OrgTreeNode | null> {
      if (currentDepth > maxDepth) {
        return null;
      }

      const [distributor] = await db
        .select()
        .from(distributors)
        .where(eq(distributors.id, distributorId))
        .limit(1);

      if (!distributor) {
        return null;
      }

      const [position] = await db
        .select()
        .from(matrixPositions)
        .where(eq(matrixPositions.distributorId, distributorId))
        .limit(1);

      if (!position) {
        return null;
      }

      // Get children (direct downline in matrix)
      const childPositions = await db
        .select()
        .from(matrixPositions)
        .where(eq(matrixPositions.parentId, position.id))
        .orderBy(asc(matrixPositions.positionIndex));

      const children: OrgTreeNode[] = [];
      for (const childPos of childPositions) {
        const childNode = await buildNode(childPos.distributorId, currentDepth + 1);
        if (childNode) {
          children.push(childNode);
        }
      }

      return {
        id: distributor.id,
        name: `${distributor.firstName} ${distributor.lastName}`,
        username: distributor.username,
        photoUrl: distributor.photoUrl,
        status: distributor.status,
        isSpillover: position.isSpillover,
        depth: position.depth,
        children,
      };
    }

    return buildNode(rootPosition.distributorId, 0);
  } catch (error) {
    return null;
  }
}

// ============================================
// SIGNUP FUNNEL
// ============================================

export async function getSignupFunnel(
  dateRange: { start: Date; end: Date }
): Promise<SignupFunnelData> {
  try {
    await requireAdmin();

    const { start, end } = dateRange;

    const pageViewsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(signupAnalytics)
      .where(
        and(
          eq(signupAnalytics.event, "page_view"),
          sql`${signupAnalytics.createdAt} >= ${start}`,
          sql`${signupAnalytics.createdAt} <= ${end}`
        )
      );

    const startedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(signupAnalytics)
      .where(
        and(
          eq(signupAnalytics.event, "signup_started"),
          sql`${signupAnalytics.createdAt} >= ${start}`,
          sql`${signupAnalytics.createdAt} <= ${end}`
        )
      );

    const completedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(signupAnalytics)
      .where(
        and(
          eq(signupAnalytics.event, "signup_completed"),
          sql`${signupAnalytics.createdAt} >= ${start}`,
          sql`${signupAnalytics.createdAt} <= ${end}`
        )
      );

    const failedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(signupAnalytics)
      .where(
        and(
          eq(signupAnalytics.event, "signup_failed"),
          sql`${signupAnalytics.createdAt} >= ${start}`,
          sql`${signupAnalytics.createdAt} <= ${end}`
        )
      );

    return {
      pageViews: Number(pageViewsResult[0]?.count || 0),
      signupStarted: Number(startedResult[0]?.count || 0),
      signupCompleted: Number(completedResult[0]?.count || 0),
      signupFailed: Number(failedResult[0]?.count || 0),
    };
  } catch (error) {
    return {
      pageViews: 0,
      signupStarted: 0,
      signupCompleted: 0,
      signupFailed: 0,
    };
  }
}

// ============================================
// RECENT ACTIVITY
// ============================================

export async function getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
  await requireAdmin();

  const activities = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return activities.map((activity) => ({
    id: activity.id,
    action: activity.action,
    actorType: activity.actorType,
    targetType: activity.targetType,
    createdAt: activity.createdAt,
    metadata: activity.metadata,
  }));
}

// ============================================
// SYSTEM SETTINGS
// ============================================

export async function getSystemSettings() {
  await requireAdmin();

  const settings = await db.select().from(systemSettings);

  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>
  );
}

export async function updateSystemSetting(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  // Only super_admin can update settings
  if (admin.role !== "super_admin") {
    return { success: false, error: "Super admin access required" };
  }

  // Validate input
  const validation = systemSettingSchema.safeParse({ key, value });
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid setting key or value",
    };
  }

  // Get client IP for audit trail
  const headersList = await headers();
  const clientIp = getClientIp(headersList);

  // Get current setting value for audit log
  const [currentSetting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  // Upsert setting
  await db
    .insert(systemSettings)
    .values({
      key,
      value,
      updatedBy: admin.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value,
        updatedBy: admin.id,
        updatedAt: new Date(),
      },
    });

  // Log to audit_log
  await db.insert(auditLog).values({
    adminId: admin.id,
    action: "system_settings.updated",
    targetId: key,
    targetType: "system_setting",
    beforeState: currentSetting ? { value: currentSetting.value } : null,
    afterState: { value },
    ipAddress: clientIp,
  });

  revalidatePath("/admin/settings");

  return { success: true };
}

// ============================================
// EXPORT CSV
// ============================================

export async function exportDistributorsCSV(): Promise<string> {
  try {
    await requireAdmin();

    const allDistributors = await db
      .select({
        id: distributors.id,
        firstName: distributors.firstName,
        lastName: distributors.lastName,
        username: distributors.username,
        email: distributors.email,
        phone: distributors.phone,
        status: distributors.status,
        enrollerId: distributors.enrollerId,
        createdAt: distributors.createdAt,
      })
      .from(distributors)
      .orderBy(asc(distributors.createdAt));

    // Build CSV
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Username",
      "Email",
      "Phone",
      "Status",
      "Enroller ID",
      "Created At",
    ];

    const rows = allDistributors.map((d) => [
      d.id,
      d.firstName,
      d.lastName,
      d.username,
      d.email,
      d.phone || "",
      d.status,
      d.enrollerId || "",
      d.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  } catch (error) {
    // Return empty CSV with headers only
    return "ID,First Name,Last Name,Username,Email,Phone,Status,Enroller ID,Created At\n";
  }
}
