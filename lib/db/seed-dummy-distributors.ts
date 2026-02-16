// SPEC: Phase 6 > Dummy Distributor Data Seeding
// Creates 3 example distributors with teams for testing replicated pages

// IMPORTANT: Load environment variables FIRST before any other imports
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env.local") });

import { db } from "./client";
import { distributors, matrixPositions, contactSubmissions } from "./schema";
import { createRootPosition, placeDistributorInMatrix } from "@/lib/matrix";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface DummyDistributor {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio: string;
  photoUrl?: string | null;
  teamSize: number;
  directEnrollees: number;
}

const dummyDistributors: DummyDistributor[] = [
  {
    username: "john.smith",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    bio: "I've been building my Apex business for 2 years and absolutely love helping others achieve financial freedom. My team is like family, and I'm committed to your success from day one. Let's build something amazing together!",
    photoUrl: null,
    teamSize: 47,
    directEnrollees: 12,
  },
  {
    username: "sarah.johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    bio: "Former teacher turned entrepreneur. I joined Apex 6 months ago and haven't looked back. If you're ready for a positive change and financial growth, let's talk!",
    photoUrl: null,
    teamSize: 12,
    directEnrollees: 5,
  },
  {
    username: "mike.davis",
    firstName: "Mike",
    lastName: "Davis",
    email: "mike.d@example.com",
    bio: "5-year Apex veteran and top producer. I've helped over 200 people start their journey to financial independence. My proven system works - let me show you how.",
    photoUrl: null,
    teamSize: 203,
    directEnrollees: 28,
  },
];

/**
 * Create a dummy distributor with Supabase auth user
 */
async function createDummyDistributor(data: DummyDistributor, createdAtOffset: number = 0) {
  console.log(`\n📝 Creating ${data.firstName} ${data.lastName}...`);

  // Check if distributor already exists
  const existing = await db
    .select()
    .from(distributors)
    .where(eq(distributors.username, data.username))
    .limit(1);

  if (existing.length > 0) {
    console.log(`   ⚠️  ${data.username} already exists, skipping...`);
    return existing[0];
  }

  // Create auth user in Supabase
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: "TestPassword123!", // Test password for dummy accounts
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
    },
  });

  if (authError) {
    console.error(`   ❌ Auth error for ${data.email}:`, authError.message);
    throw authError;
  }

  console.log(`   ✅ Auth user created: ${authData.user.id}`);

  // Create distributor record with backdated createdAt
  const createdAt = new Date();
  createdAt.setMonth(createdAt.getMonth() - createdAtOffset);

  const [distributor] = await db
    .insert(distributors)
    .values({
      authUserId: authData.user.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      bio: data.bio,
      photoUrl: data.photoUrl || null,
      enrollerId: null, // These are top-level distributors
      status: "active",
      replicatedSiteActive: true,
      createdAt,
      updatedAt: createdAt,
    })
    .returning();

  console.log(`   ✅ Distributor record created: ${distributor.id}`);

  return distributor;
}

/**
 * Create root matrix position for a distributor
 */
async function createMatrixPosition(distributorId: string, firstName: string) {
  // Check if position already exists
  const existing = await db
    .select()
    .from(matrixPositions)
    .where(eq(matrixPositions.distributorId, distributorId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`   ⚠️  Matrix position already exists for ${firstName}`);
    return existing[0];
  }

  const position = await createRootPosition(distributorId);
  console.log(`   ✅ Root matrix position created`);
  return position;
}

/**
 * Create dummy team members under a distributor
 */
async function createTeamMembers(
  enrollerId: string,
  enrollerName: string,
  count: number,
  directCount: number
) {
  console.log(`   📊 Creating ${count} team members (${directCount} direct)...`);

  let directCreated = 0;
  let totalCreated = 0;

  for (let i = 1; i <= count; i++) {
    const isDirect = directCreated < directCount;
    const username = `${enrollerName.toLowerCase().replace(/\s/g, "")}.team${i}`;
    const firstName = `Team${i}`;
    const lastName = isDirect ? "Direct" : "Spillover";
    const email = `${username}@example.com`;

    // Check if exists
    const existing = await db
      .select()
      .from(distributors)
      .where(eq(distributors.username, username))
      .limit(1);

    if (existing.length > 0) {
      continue; // Skip if already exists
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      console.error(`   ❌ Failed to create ${username}:`, authError.message);
      continue;
    }

    // Create distributor
    const [member] = await db
      .insert(distributors)
      .values({
        authUserId: authData.user.id,
        username,
        firstName,
        lastName,
        email,
        enrollerId,
        status: "active",
        replicatedSiteActive: false, // Team members don't need active sites
      })
      .returning();

    // Place in matrix
    await placeDistributorInMatrix(member.id, enrollerId);

    if (isDirect) directCreated++;
    totalCreated++;

    if (totalCreated % 10 === 0) {
      console.log(`      ... ${totalCreated}/${count} created`);
    }
  }

  console.log(`   ✅ Created ${totalCreated} team members (${directCreated} direct)`);
}

/**
 * Create dummy contact submissions
 */
async function createDummyContacts(distributorId: string, distributorName: string) {
  const contacts = [
    {
      visitorName: "Emily Wilson",
      visitorEmail: "emily.w@example.com",
      visitorPhone: "+1 (555) 111-2222",
      message: `Hi ${distributorName}, I'm interested in learning more about the Apex opportunity. Can we schedule a call?`,
    },
    {
      visitorName: "Robert Garcia",
      visitorEmail: "robert.g@example.com",
      message: `${distributorName}, I saw your page and I'm very interested. What's the first step to get started?`,
    },
    {
      visitorName: "Lisa Martinez",
      visitorEmail: "lisa.m@example.com",
      visitorPhone: "+1 (555) 333-4444",
      message: `Hello! I have a few questions about the compensation plan. Can you help me understand how it works?`,
    },
    {
      visitorName: "David Brown",
      visitorEmail: "david.b@example.com",
      message: `Hi ${distributorName}! A friend recommended you. I'd love to join your team. How do I sign up?`,
    },
  ];

  for (const contact of contacts) {
    await db.insert(contactSubmissions).values({
      distributorId,
      ...contact,
      status: "new",
      ipAddress: "192.168.1.1",
    });
  }

  console.log(`   ✅ Created 4 dummy contact submissions`);
}

/**
 * Main seeding function
 */
async function seedDummyDistributors() {
  console.log("🌱 Starting dummy distributor seeding...\n");

  try {
    // Create John Smith (2 years ago, 47 team members)
    const john = await createDummyDistributor(dummyDistributors[0], 24);
    await createMatrixPosition(john.id, john.firstName);
    await createTeamMembers(john.id, john.firstName, 47, 12);
    await createDummyContacts(john.id, john.firstName);

    // Create Sarah Johnson (6 months ago, 12 team members)
    const sarah = await createDummyDistributor(dummyDistributors[1], 6);
    await createMatrixPosition(sarah.id, sarah.firstName);
    await createTeamMembers(sarah.id, sarah.firstName, 12, 5);
    await createDummyContacts(sarah.id, sarah.firstName);

    // Create Mike Davis (5 years ago, 203 team members)
    const mike = await createDummyDistributor(dummyDistributors[2], 60);
    await createMatrixPosition(mike.id, mike.firstName);
    await createTeamMembers(mike.id, mike.firstName, 203, 28);
    await createDummyContacts(mike.id, mike.firstName);

    console.log("\n✅ Dummy distributor seeding complete!");
    console.log("\n📊 Summary:");
    console.log("   - john.smith (47 team members, 12 direct)");
    console.log("   - sarah.johnson (12 team members, 5 direct)");
    console.log("   - mike.davis (203 team members, 28 direct)");
    console.log("\n🔑 Test login credentials:");
    console.log("   Email: john.smith@example.com");
    console.log("   Email: sarah.j@example.com");
    console.log("   Email: mike.d@example.com");
    console.log("   Password: TestPassword123!");
    console.log("\n🌐 Replicated pages:");
    console.log("   http://localhost:3000/john.smith");
    console.log("   http://localhost:3000/sarah.johnson");
    console.log("   http://localhost:3000/mike.davis");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
seedDummyDistributors();
