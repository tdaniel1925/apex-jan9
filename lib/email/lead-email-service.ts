/**
 * Lead Email Service
 * Handles sending nurturing emails on behalf of agents
 * Following CodeBakers patterns from 06b-email.md
 */

import { render } from '@react-email/components';
import { resend, EMAIL_CONFIG } from './resend-client';
import { LeadNurturingEmail, type LeadNurturingEmailProps } from './templates/lead-nurturing';
import type { EmailResult } from './email-service';

/**
 * Agent info used for sending emails on their behalf
 */
export interface AgentSenderInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  calendarLink?: string;
}

/**
 * Lead info for personalization
 */
export interface LeadInfo {
  id: string;
  firstName: string;
  email: string;
}

/**
 * Email step content from database
 */
export interface EmailStepContent {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

/**
 * Send a lead nurturing email on behalf of an agent
 * The email appears to come from the agent, not the system
 */
export async function sendLeadNurturingEmail(params: {
  lead: LeadInfo;
  agent: AgentSenderInfo;
  step: EmailStepContent;
  queueId: string;
}): Promise<EmailResult> {
  const { lead, agent, step, queueId } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

  try {
    // Generate tracking URLs
    const trackingPixelUrl = `${baseUrl}/api/email/track/open/${queueId}`;
    const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe/${lead.id}`;

    // Process subject line with variables
    const processedSubject = step.subject
      .replace(/\{\{lead\.first_name\}\}/g, lead.firstName)
      .replace(/\{\{agent\.first_name\}\}/g, agent.firstName)
      .replace(/\{\{agent\.last_name\}\}/g, agent.lastName);

    // Wrap all links in body with click tracking
    const bodyWithTracking = wrapLinksWithTracking(step.bodyHtml, queueId, baseUrl);

    // Render the email template
    const html = await render(
      LeadNurturingEmail({
        leadFirstName: lead.firstName,
        leadEmail: lead.email,
        agentFirstName: agent.firstName,
        agentLastName: agent.lastName,
        agentEmail: agent.email,
        agentPhone: agent.phone,
        agentCalendarLink: agent.calendarLink,
        subject: processedSubject,
        previewText: processedSubject,
        bodyHtml: bodyWithTracking,
        trackingPixelUrl,
        unsubscribeUrl,
      })
    );

    // Send email with agent as the "from" name
    const fromName = `${agent.firstName} ${agent.lastName}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@theapexway.net';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      replyTo: agent.email,
      to: lead.email,
      subject: processedSubject,
      html,
      text: step.bodyText || undefined,
      headers: {
        'X-Lead-Queue-Id': queueId,
        'X-Agent-Id': agent.id,
        'X-Lead-Id': lead.id,
      },
    });

    if (error) {
      console.error('Failed to send lead nurturing email:', error);
      return { success: false, error: error.message };
    }

    console.log('Lead nurturing email sent:', {
      to: lead.email,
      agent: agent.email,
      queueId,
      messageId: data?.id,
    });

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending lead nurturing email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wrap all links in HTML body with click tracking
 */
function wrapLinksWithTracking(html: string, queueId: string, baseUrl: string): string {
  // Match href="..." in anchor tags
  const linkRegex = /<a([^>]*)href="([^"]+)"([^>]*)>/gi;

  return html.replace(linkRegex, (match, before, url, after) => {
    // Skip mailto: and tel: links
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return match;
    }

    // Skip unsubscribe and tracking links
    if (url.includes('/api/email/')) {
      return match;
    }

    // Encode the original URL and create tracking URL
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${baseUrl}/api/email/track/click/${queueId}?url=${encodedUrl}`;

    return `<a${before}href="${trackingUrl}"${after}>`;
  });
}

/**
 * Send a batch of lead nurturing emails
 * Used by the email queue processor
 */
export async function sendBatchLeadEmails(
  emails: Array<{
    lead: LeadInfo;
    agent: AgentSenderInfo;
    step: EmailStepContent;
    queueId: string;
  }>
): Promise<Array<{ queueId: string; result: EmailResult }>> {
  const results: Array<{ queueId: string; result: EmailResult }> = [];

  // Process emails sequentially to avoid rate limits
  // Resend allows 100 emails/second but we'll be conservative
  for (const email of emails) {
    const result = await sendLeadNurturingEmail(email);
    results.push({ queueId: email.queueId, result });

    // Small delay between emails to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get email preview (for testing/debugging)
 */
export async function getLeadEmailPreview(params: {
  lead: LeadInfo;
  agent: AgentSenderInfo;
  step: EmailStepContent;
}): Promise<string> {
  const { lead, agent, step } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

  const html = await render(
    LeadNurturingEmail({
      leadFirstName: lead.firstName,
      leadEmail: lead.email,
      agentFirstName: agent.firstName,
      agentLastName: agent.lastName,
      agentEmail: agent.email,
      agentPhone: agent.phone,
      agentCalendarLink: agent.calendarLink,
      subject: step.subject,
      previewText: step.subject,
      bodyHtml: step.bodyHtml,
      unsubscribeUrl: `${baseUrl}/api/email/unsubscribe/${lead.id}`,
    })
  );

  return html;
}
