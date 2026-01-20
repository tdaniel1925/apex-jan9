/**
 * Email Queue Processor
 * Processes pending emails from the lead_email_queue table
 * Following CodeBakers patterns from 06b-email.md
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import {
  sendLeadNurturingEmail,
  type AgentSenderInfo,
  type LeadInfo,
  type EmailStepContent,
} from './lead-email-service';

// Type definitions for Supabase query results
interface QueueItemContact {
  id: string;
  first_name: string;
  email: string;
  agent_id: string;
}

interface QueueItemStep {
  id: string;
  subject: string;
  body_html: string;
  body_text: string | null;
}

interface PendingEmailItem {
  id: string;
  contact_id: string;
  sequence_step_id: string;
  scheduled_for: string;
  contacts: QueueItemContact;
  email_sequence_steps: QueueItemStep;
}

interface AgentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  calendar_link: string | null;
}

interface SequenceStep {
  id: string;
  delay_days: number;
  delay_hours: number;
}

export interface ProcessQueueResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ queueId: string; error: string }>;
}

/**
 * Process pending emails in the queue
 * This should be called by a cron job or scheduled task
 *
 * PHASE 2 FIX - Issue #13: Added retry logic with exponential backoff
 *
 * @param batchSize - Maximum number of emails to process (default: 50)
 */
export async function processEmailQueue(batchSize = 50): Promise<ProcessQueueResult> {
  const supabase = createAdminClient();
  const result: ProcessQueueResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    const now = new Date().toISOString();

    // PHASE 2 FIX: Fetch both pending AND retrying emails that are due
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('lead_email_queue' as 'agents') // Type assertion for new table
      .select(`
        id,
        contact_id,
        sequence_step_id,
        scheduled_for,
        retry_count,
        max_retries,
        contacts!inner (
          id,
          first_name,
          email,
          agent_id
        ),
        email_sequence_steps!inner (
          id,
          subject,
          body_html,
          body_text
        )
      `)
      .in('status', ['pending', 'retrying'])
      .eq('permanent_failure', false)
      .or(`scheduled_for.lte.${now},and(status.eq.retrying,next_retry_at.lte.${now})`)
      .order('scheduled_for', { ascending: true })
      .limit(batchSize) as unknown as { data: (PendingEmailItem & { retry_count: number; max_retries: number })[] | null; error: unknown };

    if (fetchError) {
      console.error('Error fetching email queue:', fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails to process');
      return result;
    }

    console.log(`Processing ${pendingEmails.length} pending emails`);

    // Get unique agent IDs from the pending emails
    const agentIds = [...new Set(pendingEmails.map((e) => e.contacts.agent_id))];

    // Fetch agent info for all agents in batch
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, phone, calendar_link')
      .in('id', agentIds) as unknown as { data: AgentRow[] | null; error: unknown };

    if (agentError) {
      console.error('Error fetching agents:', agentError);
      throw agentError;
    }

    // Create a map of agent info
    const agentMap = new Map<string, AgentSenderInfo>();
    agents?.forEach((agent: AgentRow) => {
      agentMap.set(agent.id, {
        id: agent.id,
        firstName: agent.first_name,
        lastName: agent.last_name,
        email: agent.email,
        phone: agent.phone || undefined,
        calendarLink: agent.calendar_link || undefined,
      });
    });

    // Process each email
    for (const queueItem of pendingEmails) {
      result.processed++;

      const contact = queueItem.contacts;
      const step = queueItem.email_sequence_steps;
      const agent = agentMap.get(contact.agent_id);

      if (!agent) {
        console.error(`Agent not found for contact ${contact.id}`);
        result.failed++;
        result.errors.push({
          queueId: queueItem.id,
          error: `Agent not found: ${contact.agent_id}`,
        });
        continue;
      }

      const lead: LeadInfo = {
        id: contact.id,
        firstName: contact.first_name,
        email: contact.email,
      };

      const stepContent: EmailStepContent = {
        id: step.id,
        subject: step.subject,
        bodyHtml: step.body_html,
        bodyText: step.body_text || undefined,
      };

      // Send the email
      const sendResult = await sendLeadNurturingEmail({
        lead,
        agent,
        step: stepContent,
        queueId: queueItem.id,
      });

      // PHASE 2 FIX - Issue #13: Update queue item with retry logic
      if (sendResult.success) {
        result.sent++;

        const { error: updateError } = await (supabase
          .from('lead_email_queue' as 'agents') as unknown as ReturnType<typeof supabase.from>)
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            resend_message_id: sendResult.messageId,
          })
          .eq('id', queueItem.id);

        if (updateError) {
          console.error('Error updating queue item:', updateError);
        }

        // Record the activity
        await recordEmailSentActivity(supabase, contact.id, queueItem.id);
      } else {
        result.failed++;
        result.errors.push({
          queueId: queueItem.id,
          error: sendResult.error || 'Unknown error',
        });

        // PHASE 2 FIX: Determine if we should retry or mark as permanent failure
        const currentRetryCount = queueItem.retry_count || 0;
        const maxRetries = queueItem.max_retries || 3;
        const errorMessage = sendResult.error || 'Unknown error';

        // Check if error is permanent (don't retry)
        const isPermanentError =
          errorMessage.toLowerCase().includes('invalid email') ||
          errorMessage.toLowerCase().includes('bounce') ||
          errorMessage.toLowerCase().includes('unsubscribe') ||
          errorMessage.toLowerCase().includes('blocked');

        if (isPermanentError || currentRetryCount >= maxRetries) {
          // Mark as permanent failure (dead letter queue)
          console.log(`Permanent failure for queue item ${queueItem.id}: ${errorMessage}`);

          const { error: updateError } = await (supabase
            .from('lead_email_queue' as 'agents') as unknown as ReturnType<typeof supabase.from>)
            .update({
              status: 'failed',
              error_message: errorMessage,
              last_attempt_at: new Date().toISOString(),
              retry_count: currentRetryCount + 1,
              permanent_failure: true,
            })
            .eq('id', queueItem.id);

          if (updateError) {
            console.error('Error updating failed queue item:', updateError);
          }
        } else {
          // Schedule retry with exponential backoff
          const nextRetryCount = currentRetryCount + 1;
          const nextRetryAt = await calculateRetryTime(supabase, nextRetryCount);

          console.log(
            `Scheduling retry ${nextRetryCount}/${maxRetries} for queue item ${queueItem.id} at ${nextRetryAt}`
          );

          const { error: updateError } = await (supabase
            .from('lead_email_queue' as 'agents') as unknown as ReturnType<typeof supabase.from>)
            .update({
              status: 'retrying',
              error_message: errorMessage,
              last_attempt_at: new Date().toISOString(),
              retry_count: nextRetryCount,
              next_retry_at: nextRetryAt,
            })
            .eq('id', queueItem.id);

          if (updateError) {
            console.error('Error updating retry queue item:', updateError);
          }
        }
      }

      // Small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('Queue processing complete:', result);
    return result;
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
}

/**
 * Calculate next retry time using exponential backoff
 * PHASE 2 FIX - Issue #13: Uses database function for consistent calculation
 */
async function calculateRetryTime(
  supabase: ReturnType<typeof createAdminClient>,
  attemptNumber: number
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('calculate_email_retry_time', {
      attempt_number: attemptNumber,
    } as never);

    if (error) {
      console.error('Error calculating retry time:', error);
      // Fallback: manual calculation (5 min * 3^(attempt-1))
      const baseDelayMinutes = 5;
      const delayMinutes = Math.min(baseDelayMinutes * Math.pow(3, attemptNumber - 1), 1440);
      const retryDate = new Date();
      retryDate.setMinutes(retryDate.getMinutes() + delayMinutes);
      return retryDate.toISOString();
    }

    return data as string;
  } catch (error) {
    console.error('Error in calculateRetryTime:', error);
    // Fallback
    const retryDate = new Date();
    retryDate.setMinutes(retryDate.getMinutes() + 15); // Default 15 minutes
    return retryDate.toISOString();
  }
}

/**
 * Record email sent activity for lead scoring
 */
async function recordEmailSentActivity(
  supabase: ReturnType<typeof createAdminClient>,
  contactId: string,
  queueId: string
): Promise<void> {
  try {
    await (supabase.from('lead_activities' as 'agents') as unknown as ReturnType<typeof supabase.from>).insert({
      contact_id: contactId,
      activity_type: 'email_sent',
      metadata: { queue_id: queueId },
    });
  } catch (error) {
    console.error('Error recording email sent activity:', error);
  }
}

/**
 * Enqueue sequence emails for a contact
 * Called when a lead is captured or triggers a sequence
 */
export async function enqueueSequenceEmails(
  contactId: string,
  sequenceId: string
): Promise<{ success: boolean; queued: number; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Get all active steps in the sequence
    const { data: steps, error: stepsError } = await supabase
      .from('email_sequence_steps' as 'agents') // Type assertion for new table
      .select('*')
      .eq('sequence_id', sequenceId)
      .eq('is_active', true)
      .order('step_number', { ascending: true }) as unknown as { data: SequenceStep[] | null; error: unknown };

    if (stepsError) throw stepsError;
    if (!steps || steps.length === 0) {
      return { success: true, queued: 0 };
    }

    // Calculate scheduled times for each step
    const now = new Date();
    const queueItems = steps.map((step: SequenceStep) => {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + (step.delay_days || 0));
      scheduledDate.setHours(scheduledDate.getHours() + (step.delay_hours || 0));

      return {
        contact_id: contactId,
        sequence_step_id: step.id,
        scheduled_for: scheduledDate.toISOString(),
        status: 'pending' as const,
      };
    });

    // Insert all queue items
    const { error: insertError } = await (supabase
      .from('lead_email_queue' as 'agents') as unknown as ReturnType<typeof supabase.from>)
      .insert(queueItems);

    if (insertError) throw insertError;

    // Update contact with sequence info
    await (supabase
      .from('contacts') as unknown as ReturnType<typeof supabase.from>)
      .update({
        email_sequence_id: sequenceId,
        email_sequence_started_at: now.toISOString(),
      })
      .eq('id', contactId);

    console.log(`Enqueued ${queueItems.length} emails for contact ${contactId}`);
    return { success: true, queued: queueItems.length };
  } catch (error) {
    console.error('Error enqueueing sequence emails:', error);
    return {
      success: false,
      queued: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel pending emails for a contact
 * Used when contact unsubscribes or is deleted
 */
export async function cancelPendingEmails(
  contactId: string
): Promise<{ success: boolean; cancelled: number }> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await (supabase
      .from('lead_email_queue' as 'agents') as unknown as ReturnType<typeof supabase.from>)
      .update({ status: 'cancelled' })
      .eq('contact_id', contactId)
      .eq('status', 'pending')
      .select('id') as unknown as { data: { id: string }[] | null; error: unknown };

    if (error) throw error;

    return { success: true, cancelled: data?.length || 0 };
  } catch (error) {
    console.error('Error cancelling pending emails:', error);
    return { success: false, cancelled: 0 };
  }
}
