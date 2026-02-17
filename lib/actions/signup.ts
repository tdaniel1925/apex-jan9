// SPEC: WF-1 > Distributor Sign-Up
// DEP-MAP: FEATURE 3 > Sign-Up Flow > SERVER

"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/db/client";
import { db } from "@/lib/db/client";
import {
  distributors,
  matrixPositions,
  type NewDistributor,
} from "@/lib/db/schema";
import { signUpSchema, type SignUpFormData } from "@/lib/types/schemas";
import {
  isUsernameAvailable,
  isEmailAvailable,
  createDripEnrollment,
  logActivity,
  createNotification,
  getDistributorMatrixPosition,
} from "@/lib/db/queries";
import { placeDistributorInMatrix } from "@/lib/matrix";
import {
  sendWelcomeEmail,
  sendNewTeamMemberEmail,
  sendSpilloverNotificationEmail,
} from "@/lib/email";
import { rateLimit, RateLimits, getClientIp } from "@/lib/rate-limit";
import { trackSignupEvent } from "@/lib/db/queries";
import { eq } from "drizzle-orm";

/**
 * Server action result
 */
interface SignUpResult {
  success: boolean;
  error?: string;
  field?: string; // Field name for inline errors
  redirectTo?: string;
}

/**
 * Create a new distributor account with matrix placement
 *
 * This is the complete sign-up workflow from WF-1
 */
export async function createDistributor(
  enrollerId: string,
  data: SignUpFormData
): Promise<SignUpResult> {
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const userAgent = headersList.get("user-agent") || undefined;

  try {
    // Step 1: Rate limiting
    const rateLimitResult = await rateLimit({
      ...RateLimits.SIGNUP,
      identifier: clientIp,
    });

    if (!rateLimitResult.allowed) {
      console.log("Signup blocked: Rate limit");
      return {
        success: false,
        error: "Too many sign-up attempts. Please wait a moment.",
      };
    }

    // Step 2: Validate input
    const validation = signUpSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      console.log("Signup blocked: Validation failed", firstError);
      return {
        success: false,
        error: firstError?.message || "Invalid form data",
        field: firstError?.path[0]?.toString(),
      };
    }

    const validData = validation.data;

    // Step 3: Check username availability (final server-side check)
    const usernameAvailable = await isUsernameAvailable(validData.username);

    if (!usernameAvailable) {
      console.log("Signup blocked: Username taken", validData.username);
      return {
        success: false,
        error: "This username is already taken. Please choose another.",
        field: "username",
      };
    }

    // Step 4: Check email uniqueness
    const emailAvailable = await isEmailAvailable(validData.email);

    if (!emailAvailable) {
      console.log("Signup blocked: Email already registered", validData.email);
      return {
        success: false,
        error: "This email is already registered. Try logging in instead.",
        field: "email",
      };
    }

    // Step 5: Get enroller info for notifications
    const [enroller] = await db
      .select()
      .from(distributors)
      .where(eq(distributors.id, enrollerId))
      .limit(1);

    if (!enroller) {
      console.log("Signup blocked: Invalid enrollerId", enrollerId);
      return {
        success: false,
        error: "Invalid sponsor. Please contact support.",
      };
    }

    console.log("Signup validations passed, starting transaction...");

    // Step 6-15: Main transaction
    // This ensures everything succeeds or nothing happens (rollback)
    let newDistributor: typeof distributors.$inferSelect;
    let matrixPosition: typeof matrixPositions.$inferSelect;
    let parentDistributor: typeof distributors.$inferSelect | null = null;

    try {
      const result = await db.transaction(async (tx) => {
        // Step 7: Create auth user via Supabase Auth
        const supabase = await createClient();

        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: validData.email,
            password: validData.password,
            options: {
              data: {
                first_name: validData.firstName,
                last_name: validData.lastName,
              },
              emailRedirectTo: undefined, // Disable email confirmation for development
            },
          });

        if (authError || !authData.user) {
          throw new Error(
            authError?.message || "Failed to create authentication account"
          );
        }

        // Step 8: Create distributor record
        const [distributor] = await tx
          .insert(distributors)
          .values({
            authUserId: authData.user.id,
            username: validData.username,
            firstName: validData.firstName,
            lastName: validData.lastName,
            email: validData.email,
            phone: validData.phone || null,
            enrollerId,
            status: "active",
            dripStatus: "enrolled",
            replicatedSiteActive: true,
            ...(validData.licenseStatus && { licenseStatus: validData.licenseStatus }),
          })
          .returning();

        // Step 9: Run matrix placement algorithm
        const position = await placeDistributorInMatrix(
          distributor.id,
          enrollerId
        );

        // Get parent distributor if spillover
        let parent: typeof distributors.$inferSelect | null = null;
        if (position.isSpillover && position.parentId) {
          const [parentPos] = await tx
            .select()
            .from(matrixPositions)
            .where(eq(matrixPositions.id, position.parentId))
            .limit(1);

          if (parentPos) {
            const [foundParent] = await tx
              .select()
              .from(distributors)
              .where(eq(distributors.id, parentPos.distributorId))
              .limit(1);

            if (foundParent) {
              parent = foundParent;
            }
          }
        }

        return { distributor, position, parent };
      });

      newDistributor = result.distributor;
      matrixPosition = result.position;
      parentDistributor = result.parent;
    } catch (txError: any) {
      // Transaction error will be handled below
      console.error("Transaction error:", txError);
      console.error("Transaction error message:", txError.message);
      console.error("Transaction error stack:", txError.stack);

      // Check for specific error messages
      if (
        txError.message?.includes("concurrent") ||
        txError.message?.includes("retry")
      ) {
        return {
          success: false,
          error:
            "Another sign-up is in progress. Please try again in a moment.",
        };
      }

      return {
        success: false,
        error: txError.message || "Failed to create account. Please try again.",
      };
    }

    // Step 10: Create drip enrollment (outside main transaction for safety)
    try {
      await createDripEnrollment(newDistributor.id);
    } catch (error) {
      // Non-critical error - drip campaign can be retried
      // Continue - this is not critical
    }

    // Step 11: Send welcome email (non-blocking)
    sendWelcomeEmail(newDistributor).catch(() => {
      // Silent fail - email errors shouldn't block sign-up
    });

    // Step 12: Send notification to enroller
    if (enroller) {
      sendNewTeamMemberEmail(enroller, newDistributor).catch(() => {
        // Silent fail - email errors shouldn't block sign-up
      });

      // Create in-app notification for enroller
      createNotification({
        distributorId: enrollerId,
        type: "new_team_member",
        title: "New Team Member",
        body: `${newDistributor.firstName} ${newDistributor.lastName} just joined your team!`,
        actionUrl: "/dashboard/team",
      }).catch(() => {
        // Silent fail - notification errors shouldn't block sign-up
      });
    }

    // Step 13: If spillover, notify parent distributor
    if (matrixPosition.isSpillover && parentDistributor) {
      sendSpilloverNotificationEmail(
        parentDistributor,
        newDistributor,
        enroller
      ).catch(() => {
        // Silent fail - email errors shouldn't block sign-up
      });

      createNotification({
        distributorId: parentDistributor.id,
        type: "new_team_member",
        title: "Spillover Placement",
        body: `${newDistributor.firstName} ${newDistributor.lastName} was placed in your organization`,
        actionUrl: "/dashboard/team",
      }).catch(() => {
        // Silent fail - notification errors shouldn't block sign-up
      });
    }

    // Step 14: Log activity
    await logActivity({
      actorId: newDistributor.id,
      actorType: "distributor",
      action: "distributor.signed_up",
      targetId: newDistributor.id,
      targetType: "distributor",
      metadata: {
        enrollerId,
        isSpillover: matrixPosition.isSpillover,
        depth: matrixPosition.depth,
      },
      ipAddress: clientIp,
    });

    // Step 15: Track analytics
    await trackSignupEvent({
      distributorSlug: enroller.username,
      event: "signup_completed",
      visitorIp: clientIp,
      userAgent,
      referrer: headersList.get("referer") || undefined,
      metadata: {
        username: newDistributor.username,
      },
    });

    // Step 16: Success - redirect to login
    return {
      success: true,
      redirectTo: "/login",
    };
  } catch (error) {
    // Log the actual error for debugging
    console.error("Signup error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");

    // Track failed sign-up
    await trackSignupEvent({
      distributorSlug: "unknown",
      event: "signup_failed",
      visitorIp: clientIp,
      userAgent,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
}
