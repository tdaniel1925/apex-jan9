/**
 * Email Service
 * Following CodeBakers patterns from 06b-email.md
 */

import { render } from '@react-email/components';
import { resend, EMAIL_CONFIG } from './resend-client';
import { CommissionUpdateEmail } from './templates/commission-update';
import { BonusApprovalEmail } from './templates/bonus-approval';
import { PayoutNotificationEmail } from './templates/payout-notification';
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
