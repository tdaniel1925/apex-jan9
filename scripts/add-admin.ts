// UTILITY: Add new admin user
// Run with: tsx scripts/add-admin.ts

import dotenv from "dotenv";
import path from "path";
import readline from "readline";

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function addAdmin() {
  console.log("═══════════════════════════════════════");
  console.log("  ADD NEW ADMIN USER");
  console.log("═══════════════════════════════════════\n");

  try {
    const firstName = await question("First Name: ");
    const lastName = await question("Last Name: ");
    const email = await question("Email: ");
    const password = await question("Password (min 8 chars, 1 uppercase, 1 number): ");
    const roleInput = await question("Role (super_admin/admin/viewer) [admin]: ");
    const role = (roleInput.trim() || "admin") as "super_admin" | "admin" | "viewer";

    // Validate
    if (!firstName || !lastName || !email || !password) {
      console.error("\n❌ All fields are required");
      process.exit(1);
    }

    if (password.length < 8) {
      console.error("\n❌ Password must be at least 8 characters");
      process.exit(1);
    }

    if (!["super_admin", "admin", "viewer"].includes(role)) {
      console.error("\n❌ Invalid role. Must be: super_admin, admin, or viewer");
      process.exit(1);
    }

    console.log("\n📍 Creating admin user...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.error("   ❌ Admin with this email already exists");
      process.exit(1);
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

    console.log("\n✅ Admin user created successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("  ADMIN DETAILS");
    console.log("═══════════════════════════════════════");
    console.log("Name:", firstName, lastName);
    console.log("Email:", email);
    console.log("Role:", role);
    console.log("Login URL: http://localhost:3000/login");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to create admin:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

addAdmin();
