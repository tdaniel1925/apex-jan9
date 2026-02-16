// UTILITY: Add super admin user - tdaniel@botmakers.ai
// Run with: tsx scripts/add-super-admin.ts

import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db/client";
import { adminUsers } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addSuperAdmin() {
  console.log("═══════════════════════════════════════");
  console.log("  ADDING SUPER ADMIN USER");
  console.log("═══════════════════════════════════════\n");

  const firstName = "Tyler";
  const lastName = "Daniel";
  const email = "tdaniel@botmakers.ai";
  const password = "4Xkilla1@";
  const role = "super_admin";

  try {
    console.log("📍 Creating super admin user...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("   ⚠️  Admin already exists, updating role to super_admin...");

      // Update existing admin to super_admin
      await db
        .update(adminUsers)
        .set({ role: "super_admin" })
        .where(eq(adminUsers.email, email));

      console.log("   ✅ Updated to super_admin role");
      console.log("\n✅ Super admin setup complete!\n");
      process.exit(0);
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "admin",
      },
    });

    if (authError) {
      console.error("   ❌ Failed to create auth user:", authError.message);
      throw authError;
    }

    console.log("   ✅ Created Supabase auth user:", authData.user.id);

    // Create admin_users record
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        authUserId: authData.user.id,
        email,
        firstName,
        lastName,
        role,
      })
      .returning();

    console.log("   ✅ Created admin user record:", newAdmin.id);

    console.log("\n✅ Super admin user created successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("  SUPER ADMIN DETAILS");
    console.log("═══════════════════════════════════════");
    console.log("Name:", firstName, lastName);
    console.log("Email:", email);
    console.log("Role:", role);
    console.log("Login URL: https://theapexway.net/login");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to create super admin:", error);
    process.exit(1);
  }
}

addSuperAdmin();
