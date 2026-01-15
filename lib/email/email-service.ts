/**
 * Email Service
 * Following CodeBakers patterns from 06b-email.md
 */

import { render } from '@react-email/components';
import { resend, EMAIL_CONFIG } from './resend-client';
import { CommissionUpdateEmail } from './templates/commission-update';
import { BonusApprovalEmail } from './templates/bonus-approval';
import { PayoutNotificationEmail } from './templates/payout-notification';
import { WithdrawalRequestEmail } from './templates/withdrawal-request';
import { WithdrawalRejectedEmail } from './templates/withdrawal-rejected';
import { WelcomeAgentEmail } from './templates/welcome-agent';
import { NewLeadNotificationEmail } from './templates/new-lead-notification';
import { FoundersWelcomeEmail } from './templates/founders-welcome';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send commission update notification
 */
export async function sendCommissionUpdate(params: {
  to: string;
  agentName: string;
  amount: number;
  period: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, amount, period } = params;

    const html = await render(
      CommissionUpdateEmail({
        agentName,
        amount,
        period,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agent/wallet`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Commission Update: $${amount.toFixed(2)} - ${period}`,
      html,
    });

    if (error) {
      console.error('Failed to send commission update email:', error);
      return { success: false, error: error.message };
    }

    console.log('Commission update email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending commission update email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bonus approval notification
 */
export async function sendBonusApproval(params: {
  to: string;
  agentName: string;
  bonusType: string;
  amount: number;
  reason?: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, bonusType, amount, reason } = params;

    const html = await render(
      BonusApprovalEmail({
        agentName,
        bonusType,
        amount,
        reason,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agent/wallet`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Bonus Approved: ${bonusType} - $${amount.toFixed(2)}`,
      html,
    });

    if (error) {
      console.error('Failed to send bonus approval email:', error);
      return { success: false, error: error.message };
    }

    console.log('Bonus approval email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending bonus approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payout notification
 */
export async function sendPayoutNotification(params: {
  to: string;
  agentName: string;
  amount: number;
  status: 'processing' | 'completed';
  paymentMethod: string;
  expectedDate?: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, amount, status, paymentMethod, expectedDate } = params;

    const html = await render(
      PayoutNotificationEmail({
        agentName,
        amount,
        status,
        paymentMethod,
        expectedDate,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agent/wallet`,
      })
    );

    const subject =
      status === 'completed'
        ? `Payout Sent: $${amount.toFixed(2)}`
        : `Payout Processing: $${amount.toFixed(2)}`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send payout notification email:', error);
      return { success: false, error: error.message };
    }

    console.log('Payout notification email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending payout notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal request confirmation
 */
export async function sendWithdrawalRequest(params: {
  to: string;
  agentName: string;
  amount: number;
  netAmount: number;
  fee: number;
  paymentMethod: string;
  estimatedDays: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, amount, netAmount, fee, paymentMethod, estimatedDays } = params;

    const html = await render(
      WithdrawalRequestEmail({
        agentName,
        amount,
        netAmount,
        fee,
        paymentMethod,
        estimatedDays,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Withdrawal Request Received - $${amount.toFixed(2)}`,
      html,
    });

    if (error) {
      console.error('Failed to send withdrawal request email:', error);
      return { success: false, error: error.message };
    }

    console.log('Withdrawal request email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending withdrawal request email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send withdrawal rejected notification
 */
export async function sendWithdrawalRejected(params: {
  to: string;
  agentName: string;
  amount: number;
  paymentMethod: string;
  reason?: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, amount, paymentMethod, reason } = params;

    const html = await render(
      WithdrawalRejectedEmail({
        agentName,
        amount,
        paymentMethod,
        reason,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`,
        supportEmail: 'support@theapexway.net',
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Withdrawal Update - Action Required`,
      html,
    });

    if (error) {
      console.error('Failed to send withdrawal rejected email:', error);
      return { success: false, error: error.message };
    }

    console.log('Withdrawal rejected email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending withdrawal rejected email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email to new agent
 */
export async function sendWelcomeEmail(params: {
  to: string;
  agentName: string;
  agentCode: string;
  sponsorName: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, agentCode, sponsorName } = params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

    const html = await render(
      WelcomeAgentEmail({
        agentName,
        agentCode,
        sponsorName,
        replicatedSiteUrl: `${appUrl}/join/${agentCode}`,
        dashboardUrl: `${appUrl}/dashboard`,
        trainingUrl: `${appUrl}/dashboard/training`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Welcome to the Apex Family, ${agentName}!`,
      html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send new lead notification to agent
 */
export async function sendNewLeadNotification(params: {
  to: string;
  agentName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadMessage?: string;
  source: string;
}): Promise<EmailResult> {
  try {
    const { to, agentName, leadName, leadEmail, leadPhone, leadMessage, source } = params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

    const html = await render(
      NewLeadNotificationEmail({
        agentName,
        leadName,
        leadEmail,
        leadPhone,
        leadMessage,
        source,
        viewUrl: `${appUrl}/dashboard/contacts`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `🎉 New Lead: ${leadName} just submitted their info!`,
      html,
    });

    if (error) {
      console.error('Failed to send new lead notification:', error);
      return { success: false, error: error.message };
    }

    console.log('New lead notification sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending new lead notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Founders Club welcome email
 * Sent when someone is added as a Founder Partner
 */
export async function sendFoundersWelcomeEmail(params: {
  to: string;
  founderName: string;
  slotNumber: number;
  sharePercentage?: number;
}): Promise<EmailResult> {
  try {
    const { to, founderName, slotNumber, sharePercentage = 25 } = params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

    const html = await render(
      FoundersWelcomeEmail({
        founderName,
        slotNumber,
        sharePercentage,
        dashboardUrl: `${appUrl}/dashboard`,
      })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: `Welcome to the Founders Club – You're Part of History`,
      html,
    });

    if (error) {
      console.error('Failed to send founders welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Founders welcome email sent:', { to, slotNumber, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending founders welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bulk notifications (batch send)
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
      });

      if (error) {
        results.push({ success: false, error: error.message });
      } else {
        results.push({ success: true, messageId: data?.id });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Send email verification link to new agents
 */
export async function sendVerificationEmail(params: {
  to: string;
  agentName: string;
  verificationLink: string;
}): Promise<EmailResult> {
  const { to, agentName, verificationLink } = params;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: 'Verify Your Apex Affinity Group Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net'}/images/apex-logo.png" alt="Apex Affinity Group" style="height: 60px;" />
            </div>

            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Verify Your Email Address</h1>

            <p>Hi ${agentName},</p>

            <p>Thank you for creating your Apex Affinity Group account! Please click the button below to verify your email address and activate your account.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #0ea5e9; word-break: break-all; font-size: 14px;">${verificationLink}</p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 24 hours. If you didn't create an account with Apex Affinity Group, you can safely ignore this email.</p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />

            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Apex Affinity Group. All rights reserved.<br />
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net'}/privacy" style="color: #999;">Privacy Policy</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net'}/terms" style="color: #999;">Terms of Service</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    };
  }
}
