// SPEC: Stage 3 > Seed Data
// Database seeding for initial system data

import { db } from "./client";
import {
  distributors,
  siteContent,
  systemSettings,
  adminUsers,
  matrixPositions,
} from "./schema";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Create super admin auth user
    console.log("Creating super admin...");
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: "admin@apexaffinitygroup.com",
      password: "Admin123!",
      email_confirm: true,
    });

    if (adminAuthError && !adminAuthError.message.includes("already")) {
      throw adminAuthError;
    }

    const adminAuthUserId = adminAuthData?.user?.id;

    if (adminAuthUserId) {
      // Insert admin user record
      await db
        .insert(adminUsers)
        .values({
          authUserId: adminAuthUserId,
          email: "admin@apexaffinitygroup.com",
          firstName: "System",
          lastName: "Administrator",
          role: "super_admin",
        })
        .onConflictDoNothing();
      console.log("✓ Super admin created");
    }

    // 2. Create company root distributor (for no-sponsor sign-ups)
    console.log("Creating company root distributor...");
    const { data: rootAuthData, error: rootAuthError } = await supabase.auth.admin.createUser({
      email: "root@apexaffinitygroup.com",
      password: "Root123!",
      email_confirm: true,
    });

    if (rootAuthError && !rootAuthError.message.includes("already")) {
      throw rootAuthError;
    }

    const rootAuthUserId = rootAuthData?.user?.id;

    if (rootAuthUserId) {
      const [rootDistributor] = await db
        .insert(distributors)
        .values({
          authUserId: rootAuthUserId,
          username: "apex-company",
          firstName: "Apex",
          lastName: "Company",
          email: "root@apexaffinitygroup.com",
          status: "active",
          replicatedSiteActive: false,
        })
        .onConflictDoNothing()
        .returning();

      // Create root matrix position (depth 0)
      if (rootDistributor) {
        await db
          .insert(matrixPositions)
          .values({
            distributorId: rootDistributor.id,
            parentId: null,
            positionIndex: 0,
            depth: 0,
            path: rootDistributor.id,
            leftBoundary: 1,
            rightBoundary: 2,
            isSpillover: false,
          })
          .onConflictDoNothing();
      }
      console.log("✓ Company root distributor created");
    }

    // 3. Seed site content
    console.log("Seeding site content...");
    const contentData = [
      {
        sectionKey: "hero_title",
        contentType: "text" as const,
        content: "Build Your Future with Apex Affinity Group",
      },
      {
        sectionKey: "hero_subtitle",
        contentType: "text" as const,
        content:
          "Join a community of entrepreneurs creating financial freedom through proven systems and support",
      },
      {
        sectionKey: "about_text",
        contentType: "html" as const,
        content:
          "<p>We're a community-driven organization dedicated to empowering individuals to achieve financial independence through proven business systems, comprehensive training, and unwavering support.</p>",
      },
      {
        sectionKey: "company_name",
        contentType: "text" as const,
        content: "Apex Affinity Group",
      },
      {
        sectionKey: "company_tagline",
        contentType: "text" as const,
        content: "Building Communities, Creating Opportunities",
      },
    ];

    for (const content of contentData) {
      await db.insert(siteContent).values(content).onConflictDoNothing();
    }
    console.log("✓ Site content seeded");

    // 4. Seed system settings
    console.log("Seeding system settings...");
    const settingsData = [
      { key: "maintenance_mode", value: "false" },
      { key: "allow_signups", value: "true" },
      { key: "drip_campaign_enabled", value: "false" },
      { key: "max_matrix_depth", value: "7" },
      { key: "max_matrix_width", value: "5" },
    ];

    for (const setting of settingsData) {
      await db.insert(systemSettings).values(setting).onConflictDoNothing();
    }
    console.log("✓ System settings seeded");

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
