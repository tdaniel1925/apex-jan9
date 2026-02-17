// Cron job: Send drip campaign emails
// Runs daily to check for distributors who need their next drip email
// Emails are sent every 3 days

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { distributors, dripEnrollments } from "@/lib/db/schema";
import { and, eq, lte, or } from "drizzle-orm";
import { sendDripEmail, getNextDripSendDate } from "@/lib/email";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let sentCount = 0;
    let errorCount = 0;

    // Find all distributors who are enrolled in drip campaign
    // and whose next_send_at is in the past (or null for first email)
    const enrollments = await db
      .select({
        enrollment: dripEnrollments,
        distributor: distributors,
      })
      .from(dripEnrollments)
      .innerJoin(distributors, eq(dripEnrollments.distributorId, distributors.id))
      .where(
        and(
          eq(dripEnrollments.status, "enrolled"),
          eq(distributors.status, "active"),
          or(
            lte(dripEnrollments.nextSendAt, now),
            eq(dripEnrollments.nextSendAt, null)
          )
        )
      );

    console.log(`Found ${enrollments.length} distributors ready for drip emails`);

    // Send emails
    for (const { enrollment, distributor } of enrollments) {
      try {
        const nextStep = enrollment.currentStep + 1;

        // Check if we've completed the campaign (20 emails)
        if (nextStep > 20) {
          // Mark as completed
          await db
            .update(dripEnrollments)
            .set({
              status: "completed",
              updatedAt: now,
            })
            .where(eq(dripEnrollments.id, enrollment.id));

          console.log(`Completed drip campaign for ${distributor.email}`);
          continue;
        }

        // Send the email
        const result = await sendDripEmail({
          to: distributor.email,
          firstName: distributor.firstName,
          licenseStatus: distributor.licenseStatus || "not_licensed",
          step: nextStep,
          distributorId: distributor.id,
        });

        if (result.success) {
          // Update enrollment: increment step, set next send date
          const nextSendDate = getNextDripSendDate();

          await db
            .update(dripEnrollments)
            .set({
              currentStep: nextStep,
              lastSentAt: now,
              nextSendAt: nextSendDate,
              updatedAt: now,
            })
            .where(eq(dripEnrollments.id, enrollment.id));

          sentCount++;
          console.log(`Sent drip email ${nextStep}/20 to ${distributor.email}`);
        } else {
          errorCount++;
          console.error(`Failed to send drip email to ${distributor.email}:`, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing drip email for ${distributor.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      errorCount,
      totalProcessed: enrollments.length,
    });
  } catch (error) {
    console.error("Drip email cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
