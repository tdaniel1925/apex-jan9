// SPEC: Dashboard > Profile Actions
// Server actions for profile updates

"use server";

import { createClient } from "@/lib/db/client";
import { db } from "@/lib/db/client";
import { distributors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Update distributor's target audience preference
 */
export async function updateTargetAudience(
  targetAudience: "agents" | "newcomers" | "both"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate input
    const validValues = ["agents", "newcomers", "both"] as const;
    if (!validValues.includes(targetAudience)) {
      return { success: false, error: "Invalid target audience value" };
    }

    // Update database
    await db
      .update(distributors)
      .set({
        targetAudience,
        updatedAt: new Date(),
      })
      .where(eq(distributors.authUserId, user.id));

    // Revalidate profile page and replicated site
    revalidatePath("/dashboard/profile");
    revalidatePath("/[username]", "page");

    return { success: true };
  } catch (error) {
    console.error("Error updating target audience:", error);
    return {
      success: false,
      error: "Failed to update preference. Please try again.",
    };
  }
}
