/**
 * Drip Campaign Service
 * Handles enrollment, sending, and tracking of drip email campaigns
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import type {
  DripCampaign,
  DripCampaignEmail,
  DripCampaignEnrollment,
  DripCampaignSend,
} from '@/lib/types/database';

// Campaign IDs for the default campaigns (from migration)
export const CAMPAIGN_IDS = {
  LICENSED_AGENT: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  UNLICENSED_AGENT: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
} as const;

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enroll an agent in the appropriate drip campaign based on their license status
 */
export async function enrollAgentInDripCampaign(
  agentId: string,
  isLicensedAgent: boolean
): Promise<EnrollmentResult> {
  const supabase = createAdminClient();

  try {
    // Select the appropriate campaign
    const campaignId = isLicensedAgent
      ? CAMPAIGN_IDS.LICENSED_AGENT
      : CAMPAIGN_IDS.UNLICENSED_AGENT;

    // Check if campaign exists and is active
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return {
        success: false,
        error: `Campaign not found: ${campaignId}`,
      };
    }

    if ((campaign as DripCampaign).status !== 'active') {
      return {
        success: false,
        error: 'Campaign is not active',
      };
    }

    // Get the first email in the campaign to calculate initial send time
    const { data: firstEmail } = await supabase
      .from('drip_campaign_emails')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('sequence_order', 1)
      .single();

    const typedEmail = firstEmail as DripCampaignEmail | null;

    // Calculate next send time (default: 1 day after enrollment)
    const delayDays = typedEmail?.delay_days ?? 1;
    const delayHours = typedEmail?.delay_hours ?? 0;
    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + delayDays);
    nextSendAt.setHours(nextSendAt.getHours() + delayHours);

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('drip_campaign_enrollments')
      .insert({
        campaign_id: campaignId,
        agent_id: agentId,
        current_email_index: 0,
        status: 'active',
        next_send_at: nextSendAt.toISOString(),
      } as never)
      .select()
      .single();

    if (enrollError) {
      // Check if already enrolled (unique constraint violation)
      if (enrollError.code === '23505') {
        return {
          success: true,
          error: 'Agent already enrolled in this campaign',
        };
      }
      return {
        success: false,
        error: `Failed to enroll: ${enrollError.message}`,
      };
    }

    // Update campaign stats
    await supabase.rpc('increment_campaign_enrolled' as never, { campaign_id: campaignId } as never);

    return {
      success: true,
      enrollmentId: (enrollment as DripCampaignEnrollment).id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending emails that need to be sent (for background job)
 */
export async function getPendingDripEmails(limit = 100): Promise<{
  enrollments: Array<{
    enrollment: DripCampaignEnrollment;
    email: DripCampaignEmail;
    agentEmail: string;
    agentName: string;
  }>;
  error?: string;
}> {
  const supabase = createAdminClient();

  try {
    // Get enrollments that are due to send
    const { data: enrollments, error } = await supabase
      .from('drip_campaign_enrollments')
      .select(`
        *,
        drip_campaigns!inner (
          id,
          status
        ),
        agents!inner (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('status', 'active')
      .lte('next_send_at', new Date().toISOString())
      .limit(limit);

    if (error) {
      return { enrollments: [], error: error.message };
    }

    if (!enrollments || enrollments.length === 0) {
      return { enrollments: [] };
    }

    // For each enrollment, get the next email
    const results = await Promise.all(
      enrollments.map(async (enrollment) => {
        const typedEnrollment = enrollment as unknown as {
          id: string;
          campaign_id: string;
          agent_id: string;
          current_email_index: number;
          status: string;
          enrolled_at: string;
          next_send_at: string;
          drip_campaigns: { id: string; status: string };
          agents: { id: string; email: string; first_name: string; last_name: string };
        };

        // Skip if campaign is not active
        if (typedEnrollment.drip_campaigns.status !== 'active') {
          return null;
        }

        // Get the next email in sequence
        const { data: email } = await supabase
          .from('drip_campaign_emails')
          .select('*')
          .eq('campaign_id', typedEnrollment.campaign_id)
          .eq('sequence_order', typedEnrollment.current_email_index + 1)
          .single();

        if (!email) {
          return null;
        }

        return {
          enrollment: {
            id: typedEnrollment.id,
            campaign_id: typedEnrollment.campaign_id,
            agent_id: typedEnrollment.agent_id,
            current_email_index: typedEnrollment.current_email_index,
            status: typedEnrollment.status as 'active' | 'completed' | 'unsubscribed' | 'paused',
            enrolled_at: typedEnrollment.enrolled_at,
            next_send_at: typedEnrollment.next_send_at,
            completed_at: null,
            unsubscribed_at: null,
            emails_sent: 0,
            emails_opened: 0,
            emails_clicked: 0,
          } as DripCampaignEnrollment,
          email: email as DripCampaignEmail,
          agentEmail: typedEnrollment.agents.email,
          agentName: `${typedEnrollment.agents.first_name} ${typedEnrollment.agents.last_name}`,
        };
      })
    );

    return {
      enrollments: results.filter((r): r is NonNullable<typeof r> => r !== null),
    };
  } catch (error) {
    return {
      enrollments: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record a sent email and update enrollment progress
 */
export async function recordDripEmailSent(
  enrollmentId: string,
  emailId: string,
  agentId: string,
  messageId?: string
): Promise<{ success: boolean; sendId?: string; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Create send record
    const { data: send, error: sendError } = await supabase
      .from('drip_campaign_sends')
      .insert({
        enrollment_id: enrollmentId,
        email_id: emailId,
        agent_id: agentId,
        message_id: messageId,
      } as never)
      .select()
      .single();

    if (sendError) {
      return { success: false, error: sendError.message };
    }

    // Get enrollment details
    const { data: enrollment } = await supabase
      .from('drip_campaign_enrollments')
      .select('campaign_id, current_email_index, emails_sent')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    const typedEnrollment = enrollment as {
      campaign_id: string;
      current_email_index: number;
      emails_sent: number;
    };

    // Check if there's another email in the sequence
    const { data: nextEmail } = await supabase
      .from('drip_campaign_emails')
      .select('id, delay_days, delay_hours')
      .eq('campaign_id', typedEnrollment.campaign_id)
      .eq('sequence_order', typedEnrollment.current_email_index + 2)
      .single();

    // Get current email stats
    const { data: emailStats } = await supabase
      .from('drip_campaign_emails')
      .select('total_sent')
      .eq('id', emailId)
      .single();

    const currentTotalSent = (emailStats as { total_sent: number } | null)?.total_sent ?? 0;

    if (nextEmail) {
      // Calculate next send time
      const typedNextEmail = nextEmail as { delay_days: number; delay_hours: number };
      const nextSendAt = new Date();
      nextSendAt.setDate(nextSendAt.getDate() + typedNextEmail.delay_days);
      nextSendAt.setHours(nextSendAt.getHours() + typedNextEmail.delay_hours);

      // Update enrollment with incremented values
      await supabase
        .from('drip_campaign_enrollments')
        .update({
          current_email_index: typedEnrollment.current_email_index + 1,
          emails_sent: (typedEnrollment.emails_sent || 0) + 1,
          next_send_at: nextSendAt.toISOString(),
        } as never)
        .eq('id', enrollmentId);
    } else {
      // No more emails - mark as completed
      await supabase
        .from('drip_campaign_enrollments')
        .update({
          current_email_index: typedEnrollment.current_email_index + 1,
          emails_sent: (typedEnrollment.emails_sent || 0) + 1,
          status: 'completed',
          completed_at: new Date().toISOString(),
          next_send_at: null,
        } as never)
        .eq('id', enrollmentId);

      // Increment campaign completed count
      await supabase.rpc('increment_campaign_completed' as never, {
        campaign_id: typedEnrollment.campaign_id
      } as never);
    }

    // Update email stats
    await supabase
      .from('drip_campaign_emails')
      .update({ total_sent: currentTotalSent + 1 } as never)
      .eq('id', emailId);

    return {
      success: true,
      sendId: (send as DripCampaignSend).id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record when an email is opened (for tracking)
 */
export async function recordEmailOpened(sendId: string): Promise<{ success: boolean }> {
  const supabase = createAdminClient();

  try {
    const { data: send } = await supabase
      .from('drip_campaign_sends')
      .select('enrollment_id, email_id, opened_at')
      .eq('id', sendId)
      .single();

    if (!send || (send as DripCampaignSend).opened_at) {
      return { success: false };
    }

    const typedSend = send as { enrollment_id: string; email_id: string };

    // Update send record
    await supabase
      .from('drip_campaign_sends')
      .update({ opened_at: new Date().toISOString() } as never)
      .eq('id', sendId);

    // Get current stats for enrollment and email
    const { data: enrollment } = await supabase
      .from('drip_campaign_enrollments')
      .select('emails_opened')
      .eq('id', typedSend.enrollment_id)
      .single();

    const { data: email } = await supabase
      .from('drip_campaign_emails')
      .select('total_opened')
      .eq('id', typedSend.email_id)
      .single();

    const currentOpened = (enrollment as { emails_opened: number } | null)?.emails_opened ?? 0;
    const currentTotalOpened = (email as { total_opened: number } | null)?.total_opened ?? 0;

    // Update enrollment stats
    await supabase
      .from('drip_campaign_enrollments')
      .update({ emails_opened: currentOpened + 1 } as never)
      .eq('id', typedSend.enrollment_id);

    // Update email stats
    await supabase
      .from('drip_campaign_emails')
      .update({ total_opened: currentTotalOpened + 1 } as never)
      .eq('id', typedSend.email_id);

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Record when a link in an email is clicked
 */
export async function recordEmailClicked(sendId: string): Promise<{ success: boolean }> {
  const supabase = createAdminClient();

  try {
    const { data: send } = await supabase
      .from('drip_campaign_sends')
      .select('enrollment_id, email_id, clicked_at')
      .eq('id', sendId)
      .single();

    if (!send || (send as DripCampaignSend).clicked_at) {
      return { success: false };
    }

    const typedSend = send as { enrollment_id: string; email_id: string };

    // Update send record
    await supabase
      .from('drip_campaign_sends')
      .update({ clicked_at: new Date().toISOString() } as never)
      .eq('id', sendId);

    // Get current stats for enrollment and email
    const { data: enrollment } = await supabase
      .from('drip_campaign_enrollments')
      .select('emails_clicked')
      .eq('id', typedSend.enrollment_id)
      .single();

    const { data: email } = await supabase
      .from('drip_campaign_emails')
      .select('total_clicked')
      .eq('id', typedSend.email_id)
      .single();

    const currentClicked = (enrollment as { emails_clicked: number } | null)?.emails_clicked ?? 0;
    const currentTotalClicked = (email as { total_clicked: number } | null)?.total_clicked ?? 0;

    // Update enrollment stats
    await supabase
      .from('drip_campaign_enrollments')
      .update({ emails_clicked: currentClicked + 1 } as never)
      .eq('id', typedSend.enrollment_id);

    // Update email stats
    await supabase
      .from('drip_campaign_emails')
      .update({ total_clicked: currentTotalClicked + 1 } as never)
      .eq('id', typedSend.email_id);

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Unsubscribe an agent from a drip campaign
 */
export async function unsubscribeFromCampaign(
  unsubscribeToken: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Find the send record by token
    const { data: send } = await supabase
      .from('drip_campaign_sends')
      .select('enrollment_id')
      .eq('unsubscribe_token', unsubscribeToken)
      .single();

    if (!send) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }

    const typedSend = send as { enrollment_id: string };

    // Get campaign ID before updating
    const { data: enrollment } = await supabase
      .from('drip_campaign_enrollments')
      .select('campaign_id')
      .eq('id', typedSend.enrollment_id)
      .single();

    // Update enrollment status
    await supabase
      .from('drip_campaign_enrollments')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        next_send_at: null,
      } as never)
      .eq('id', typedSend.enrollment_id);

    if (enrollment) {
      const typedEnrollment = enrollment as { campaign_id: string };
      await supabase.rpc('increment_campaign_unsubscribed' as never, {
        campaign_id: typedEnrollment.campaign_id,
      } as never);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: string): Promise<{
  campaign: DripCampaign | null;
  emails: DripCampaignEmail[];
  stats: {
    totalEnrolled: number;
    totalCompleted: number;
    totalUnsubscribed: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}> {
  const supabase = createAdminClient();

  const { data: campaign } = await supabase
    .from('drip_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  const { data: emails } = await supabase
    .from('drip_campaign_emails')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sequence_order', { ascending: true });

  const typedCampaign = campaign as DripCampaign | null;
  const typedEmails = (emails || []) as DripCampaignEmail[];

  // Calculate average rates
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;

  typedEmails.forEach((email) => {
    totalSent += email.total_sent;
    totalOpened += email.total_opened;
    totalClicked += email.total_clicked;
  });

  return {
    campaign: typedCampaign,
    emails: typedEmails,
    stats: {
      totalEnrolled: typedCampaign?.total_enrolled || 0,
      totalCompleted: typedCampaign?.total_completed || 0,
      totalUnsubscribed: typedCampaign?.total_unsubscribed || 0,
      avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    },
  };
}
