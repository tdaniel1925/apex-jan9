// SPEC: SPEC-AUTH.md > Auth helpers
// SPEC: SPEC-WORKFLOWS > WF-8: Login
// Authentication helper functions for server components and actions

import { createClient, createServiceClient } from "@/lib/db/client";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers, distributors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser, DistributorSession } from "@/lib/types/auth";

/**
 * Get current session from cookies
 * Returns Supabase auth session or null
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user with role information
 * Checks admin_users table first, then distributors
 * Returns SessionUser (admin) or DistributorSession (distributor) or null
 */
export async function getUser(): Promise<
  | { type: "admin"; user: SessionUser }
  | { type: "distributor"; user: DistributorSession }
  | { type: null; user: null }
> {
  const session = await getSession();
  if (!session?.user) {
    return { type: null, user: null };
  }

  const authUserId = session.user.id;

  // Check if user is an admin first
  const serviceClient = createServiceClient();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not configured");
  }

  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema: { adminUsers, distributors } });

  // Try admin_users first
  const [adminUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.authUserId, authUserId))
    .limit(1);

  if (adminUser) {
    await queryClient.end();
    return {
      type: "admin",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
      },
    };
  }

  // Try distributors
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.authUserId, authUserId))
    .limit(1);

  await queryClient.end();

  if (distributor) {
    return {
      type: "distributor",
      user: {
        id: distributor.id,
        email: distributor.email,
        username: distributor.username,
        firstName: distributor.firstName,
        lastName: distributor.lastName,
        photoUrl: distributor.photoUrl ?? undefined,
      },
    };
  }

  return { type: null, user: null };
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const userData = await getUser();
  return userData.type === "admin";
}

/**
 * Check if current user is a distributor
 */
export async function isDistributor(): Promise<boolean> {
  const userData = await getUser();
  return userData.type === "distributor";
}

/**
 * Require authentication - throws if not authenticated
 * Use in server actions or components that require any authenticated user
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Require admin role - throws if not admin
 * Use in admin-only server actions or components
 */
export async function requireAdmin(): Promise<NonNullable<SessionUser>> {
  const userData = await getUser();
  if (userData.type !== "admin" || !userData.user) {
    throw new Error("Admin access required");
  }
  return userData.user;
}

/**
 * Require distributor role - throws if not distributor
 * Use in distributor-only server actions or components
 */
export async function requireDistributor(): Promise<NonNullable<DistributorSession>> {
  const userData = await getUser();
  if (userData.type !== "distributor" || !userData.user) {
    throw new Error("Distributor access required");
  }
  return userData.user;
}
