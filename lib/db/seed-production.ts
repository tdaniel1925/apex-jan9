// DEPLOYMENT: Production seed script
// Creates company root distributor and initial admin account
// Run with: tsx lib/db/seed-production.ts

import dotenv from "dotenv";
import path from "path";

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "./client";
import { distributors, matrixPositions, adminUsers } from "./schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log("🌱 Starting production seed...\n");

  try {
    // ============================================
    // 1. CREATE COMPANY ROOT DISTRIBUTOR
    // ============================================
    console.log("📍 Step 1: Creating company root distributor...");

    // Check if root distributor already exists
    const existingRoot = await db
      .select()
      .from(distributors)
      .where(eq(distributors.username, "apex.corporate"))
      .limit(1);

    let rootDistributor;

    if (existingRoot.length > 0) {
      console.log("   ⚠️  Root distributor already exists, skipping creation");
      rootDistributor = existingRoot[0];
    } else {
      // Create Supabase auth user for root distributor (no login, just for FK)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: "corporate@apexaffinitygroup.com",
        email_confirm: true,
        user_metadata: {
          first_name: "Apex",
          last_name: "Corporate",
        },
      });

      if (authError) {
        console.error("   ❌ Failed to create auth user for root:", authError.message);
        throw authError;
      }

      console.log("   ✅ Created Supabase auth user:", authData.user.id);

      // Create distributor record
      const [newRoot] = await db
        .insert(distributors)
        .values({
          authUserId: authData.user.id,
          username: "apex.corporate",
          firstName: "Apex",
          lastName: "Corporate",
          email: "corporate@apexaffinitygroup.com",
          phone: null,
          enrollerId: null, // Root has no enroller
          status: "active",
          dripStatus: "enrolled",
          replicatedSiteActive: true,
        })
        .returning();

      rootDistributor = newRoot;
      console.log("   ✅ Created root distributor:", rootDistributor.id);
    }

    // ============================================
    // 2. CREATE ROOT MATRIX POSITION
    // ============================================
    console.log("\n📍 Step 2: Creating root matrix position...");

    const existingRootPosition = await db
      .select()
      .from(matrixPositions)
      .where(eq(matrixPositions.distributorId, rootDistributor.id))
      .limit(1);

    if (existingRootPosition.length > 0) {
      console.log("   ⚠️  Root matrix position already exists, skipping creation");
    } else {
      const [rootPosition] = await db
        .insert(matrixPositions)
        .values({
          distributorId: rootDistributor.id,
          parentId: null,
          positionIndex: 0,
          depth: 0,
          path: "root",
          leftBoundary: 1,
          rightBoundary: 2,
          isSpillover: false,
        })
        .returning();

      console.log("   ✅ Created root matrix position:", rootPosition.id);
    }

    // ============================================
    // 3. CREATE ADMIN USER
    // ============================================
    console.log("\n📍 Step 3: Creating admin user...");

    const adminEmail = "tdaniel@botmakers.ai";
    const adminPassword = "4Xkilla1@";

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("   ⚠️  Admin user already exists, skipping creation");
    } else {
      // Create Supabase auth user for admin
      const { data: adminAuthData, error: adminAuthError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            first_name: "Trent",
            last_name: "Daniel",
            role: "admin",
          },
        });

      if (adminAuthError) {
        console.error("   ❌ Failed to create admin auth user:", adminAuthError.message);
        throw adminAuthError;
      }

      console.log("   ✅ Created admin Supabase auth user:", adminAuthData.user.id);

      // Create admin_users record
      const [newAdmin] = await db
        .insert(adminUsers)
        .values({
          authUserId: adminAuthData.user.id,
          email: adminEmail,
          firstName: "Trent",
          lastName: "Daniel",
          role: "super_admin",
        })
        .returning();

      console.log("   ✅ Created admin user record:", newAdmin.id);
    }

    // ============================================
    // 4. SUMMARY
    // ============================================
    console.log("\n✅ Production seed complete!\n");
    console.log("═══════════════════════════════════════");
    console.log("📋 SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log("Company Root Distributor:");
    console.log("  • Username: apex.corporate");
    console.log("  • Email: corporate@apexaffinitygroup.com");
    console.log("  • ID:", rootDistributor.id);
    console.log("\nAdmin Account:");
    console.log("  • Name: Trent Daniel");
    console.log("  • Email: tdaniel@botmakers.ai");
    console.log("  • Role: super_admin");
    console.log("  • Password: (as provided)");
    console.log("\nNext Steps:");
    console.log("  1. Test local login at http://localhost:3000/login");
    console.log("  2. Test sign-up flow at http://localhost:3000/join");
    console.log("  3. Deploy to Vercel");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
