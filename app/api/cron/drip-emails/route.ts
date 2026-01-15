/**
 * Drip Email Processing Cron Job
 *
 * This endpoint processes pending drip campaign emails.
 * Should be called by a cron job every 15-60 minutes.
 *
 * Security: Protected by CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingDripEmails, recordDripEmailSent } from '@/lib/services/drip-campaign-service';
import { resend, EMAIL_CONFIG } from '@/lib/email/resend-client';

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured - allowing request in development');
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get pending emails
    const { enrollments, error: fetchError } = await getPendingDripEmails(50);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch pending emails: ${fetchError}` },
        { status: 500 }
      );
    }

    if (enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails to send',
        sent: 0,
      });
    }

    // Process each email
    const results = await Promise.all(
      enrollments.map(async ({ enrollment, email, agentEmail, agentName }) => {
        try {
          // Replace template variables
          const htmlContent = email.html_content
            .replace(/\{\{agentName\}\}/g, agentName)
            .replace(
              /\{\{unsubscribeUrl\}\}/g,
              `${process.env.NEXT_PUBLIC_APP_URL}/api/drip/unsubscribe/${enrollment.id}`
            );

          // Send email via Resend
          const { data, error: sendError } = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: agentEmail,
            subject: email.subject.replace(/\{\{agentName\}\}/g, agentName),
            html: htmlContent,
          });

          if (sendError) {
            console.error(`Failed to send drip email to ${agentEmail}:`, sendError);
            return {
              enrollmentId: enrollment.id,
              success: false,
              error: sendError.message,
            };
          }

          // Record the send
          const recordResult = await recordDripEmailSent(
            enrollment.id,
            email.id,
            enrollment.agent_id,
            data?.id
          );

          return {
            enrollmentId: enrollment.id,
            success: recordResult.success,
            messageId: data?.id,
          };
        } catch (err) {
          console.error(`Error processing drip email for enrollment ${enrollment.id}:`, err);
          return {
            enrollmentId: enrollment.id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${enrollments.length} emails`,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Drip email cron error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
