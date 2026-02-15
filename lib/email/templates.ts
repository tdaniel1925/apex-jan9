// SPEC: FEATURE 6 > Email Notifications > All Templates
// Email templates for Resend

import { resend, EMAIL_FROM, APP_NAME, APP_URL } from "./client";
import type { Distributor } from "@/lib/db/schema";

/**
 * Send welcome email to new distributor
 */
export async function sendWelcomeEmail(distributor: Distributor): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: distributor.email,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${APP_NAME}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${distributor.firstName},</p>

              <p style="margin-bottom: 20px;">Congratulations on joining ${APP_NAME}! We're excited to have you on the team.</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
                <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Your Replicated Site is Live!</h2>
                <p style="margin-bottom: 15px;">Share this URL to start building your team:</p>
                <a href="${APP_URL}/${distributor.username}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  ${APP_URL}/${distributor.username}
                </a>
              </div>

              <h3 style="color: #667eea; margin-top: 30px;">Getting Started</h3>
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 10px;"><a href="${APP_URL}/login" style="color: #667eea;">Log in to your dashboard</a></li>
                <li style="margin-bottom: 10px;">Complete your profile and upload a photo</li>
                <li style="margin-bottom: 10px;">Share your replicated site link with prospects</li>
                <li style="margin-bottom: 10px;">Watch your team grow!</li>
              </ol>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>Need help? Reply to this email or contact support.</p>
                <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to ${APP_NAME}!

Hi ${distributor.firstName},

Congratulations on joining ${APP_NAME}! We're excited to have you on the team.

Your Replicated Site is Live!
Share this URL to start building your team: ${APP_URL}/${distributor.username}

Getting Started:
1. Log in to your dashboard: ${APP_URL}/login
2. Complete your profile and upload a photo
3. Share your replicated site link with prospects
4. Watch your team grow!

Need help? Reply to this email or contact support.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw - email failures shouldn't block sign-up
  }
}

/**
 * Send notification to enroller when someone joins their team
 */
export async function sendNewTeamMemberEmail(
  enroller: Distributor,
  newMember: Distributor
): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: enroller.email,
      subject: `${newMember.firstName} ${newMember.lastName} just joined your team!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Team Member</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Team Member!</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${enroller.firstName},</p>

              <p style="margin-bottom: 20px;">Great news! <strong>${newMember.firstName} ${newMember.lastName}</strong> just joined your team at ${APP_NAME}.</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #10b981;">New Member Details</h3>
                <p><strong>Name:</strong> ${newMember.firstName} ${newMember.lastName}</p>
                <p><strong>Email:</strong> ${newMember.email}</p>
                ${newMember.phone ? `<p><strong>Phone:</strong> ${newMember.phone}</p>` : ""}
                <p><strong>Username:</strong> ${newMember.username}</p>
              </div>

              <p style="margin-bottom: 20px;">Consider reaching out to welcome them and help them get started!</p>

              <a href="${APP_URL}/dashboard/team" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">
                View Your Team
              </a>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
🎉 New Team Member!

Hi ${enroller.firstName},

Great news! ${newMember.firstName} ${newMember.lastName} just joined your team at ${APP_NAME}.

New Member Details:
- Name: ${newMember.firstName} ${newMember.lastName}
- Email: ${newMember.email}
${newMember.phone ? `- Phone: ${newMember.phone}` : ""}
- Username: ${newMember.username}

Consider reaching out to welcome them and help them get started!

View Your Team: ${APP_URL}/dashboard/team

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send new team member email:", error);
    // Don't throw - email failures shouldn't block sign-up
  }
}

/**
 * Send notification when someone submits contact form
 */
export async function sendContactNotificationEmail(
  distributor: Distributor,
  submission: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone?: string | null;
    message: string;
  }
): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: distributor.email,
      replyTo: submission.visitorEmail,
      subject: `New message from ${submission.visitorName} via your Apex page`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Message</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📬 New Contact Message</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${distributor.firstName},</p>

              <p style="margin-bottom: 20px;">You received a new message through your replicated page!</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin-top: 0; color: #3b82f6;">Contact Details</h3>
                <p><strong>Name:</strong> ${submission.visitorName}</p>
                <p><strong>Email:</strong> <a href="mailto:${submission.visitorEmail}" style="color: #3b82f6;">${submission.visitorEmail}</a></p>
                ${submission.visitorPhone ? `<p><strong>Phone:</strong> ${submission.visitorPhone}</p>` : ""}
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #3b82f6;">Message</h3>
                <p style="white-space: pre-wrap;">${submission.message}</p>
              </div>

              <p style="margin-bottom: 20px;">Reply to this email to respond directly to ${submission.visitorName}.</p>

              <a href="${APP_URL}/dashboard/contacts" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">
                View All Messages
              </a>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
📬 New Contact Message

Hi ${distributor.firstName},

You received a new message through your replicated page!

Contact Details:
- Name: ${submission.visitorName}
- Email: ${submission.visitorEmail}
${submission.visitorPhone ? `- Phone: ${submission.visitorPhone}` : ""}

Message:
${submission.message}

Reply to this email to respond directly to ${submission.visitorName}.

View All Messages: ${APP_URL}/dashboard/contacts

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send contact notification email:", error);
    // Don't throw - email failures shouldn't block contact submission
  }
}

/**
 * Send notification when someone is placed via spillover
 */
export async function sendSpilloverNotificationEmail(
  parentDistributor: Distributor,
  newMember: Distributor,
  enroller: Distributor
): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: parentDistributor.email,
      subject: `${newMember.firstName} ${newMember.lastName} was placed in your organization!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Spillover Placement</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Spillover Placement!</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${parentDistributor.firstName},</p>

              <p style="margin-bottom: 20px;">Great news! <strong>${newMember.firstName} ${newMember.lastName}</strong> was placed in your organization through spillover.</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #f59e0b;">What is Spillover?</h3>
                <p style="margin-bottom: 15px;">When ${enroller.firstName} ${enroller.lastName} enrolled ${newMember.firstName}, all their direct positions were full. The system automatically placed ${newMember.firstName} in the next available position in ${enroller.firstName}'s organization — which was under you!</p>
                <p style="margin-bottom: 0;">This means you benefit from ${enroller.firstName}'s recruiting efforts.</p>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #f59e0b;">New Member Details</h3>
                <p><strong>Name:</strong> ${newMember.firstName} ${newMember.lastName}</p>
                <p><strong>Email:</strong> ${newMember.email}</p>
                <p><strong>Enrolled by:</strong> ${enroller.firstName} ${enroller.lastName}</p>
              </div>

              <p style="margin-bottom: 20px;">Consider welcoming ${newMember.firstName} to help them succeed in your downline!</p>

              <a href="${APP_URL}/dashboard/team" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">
                View Your Team
              </a>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
🌟 Spillover Placement!

Hi ${parentDistributor.firstName},

Great news! ${newMember.firstName} ${newMember.lastName} was placed in your organization through spillover.

What is Spillover?
When ${enroller.firstName} ${enroller.lastName} enrolled ${newMember.firstName}, all their direct positions were full. The system automatically placed ${newMember.firstName} in the next available position in ${enroller.firstName}'s organization — which was under you!

This means you benefit from ${enroller.firstName}'s recruiting efforts.

New Member Details:
- Name: ${newMember.firstName} ${newMember.lastName}
- Email: ${newMember.email}
- Enrolled by: ${enroller.firstName} ${enroller.lastName}

Consider welcoming ${newMember.firstName} to help them succeed in your downline!

View Your Team: ${APP_URL}/dashboard/team

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      `.trim(),
    });
  } catch (error) {
    console.error("Failed to send spillover notification email:", error);
    // Don't throw - email failures shouldn't block sign-up
  }
}
