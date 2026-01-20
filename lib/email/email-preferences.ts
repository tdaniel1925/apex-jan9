/**
 * Email Preferences Service
 * Phase 2 - Issue #26: CAN-SPAM compliant email preference management
 */

import { createAdminClient } from '@/lib/db/supabase-server';

export type EmailType =
  // Transactional (always sent)
  | 'password_reset'
  | 'security_alert'
  | 'legal_notice'
  | 'transaction_confirmation'
  | 'withdrawal_confirmation'
  | 'tax_document'
  | 'compliance_required'
  | 'enrollment_welcome'
  // Marketing (can unsubscribe)
  | 'marketing'
  | 'training'
  | 'commission_alert'
  | 'payout_alert'
  | 'team_update';

export interface EmailPreferences {
  marketing_emails: boolean;
  training_notifications: boolean;
  commission_alerts: boolean;
  payout_notifications: boolean;
  team_updates: boolean;
  unsubscribed_all: boolean;
}

/**
 * Check if agent can receive specific email type
 */
export async function canSendEmail(
  agentId: string,
  emailType: EmailType
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.rpc('can_send_email', {
      p_agent_id: agentId,
      p_email_type: emailType,
    } as never);

    if (error) {
      console.error('Error checking email permission:', error);
      // Default to NOT sending if error (fail safe)
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error in canSendEmail:', error);
    return false;
  }
}

/**
 * Get agent email preferences
 */
export async function getEmailPreferences(
  agentId: string
): Promise<EmailPreferences | null> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.rpc('get_email_preferences', {
      p_agent_id: agentId,
    } as never);

    if (error) {
      console.error('Error fetching email preferences:', error);
      return null;
    }

    return data?.[0] as EmailPreferences;
  } catch (error) {
    console.error('Error in getEmailPreferences:', error);
    return null;
  }
}

/**
 * Update email preferences
 */
export async function updateEmailPreferences(
  agentId: string,
  preferences: Partial<EmailPreferences>
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        agent_id: agentId,
        ...preferences,
      } as never);

    if (error) {
      console.error('Error updating email preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateEmailPreferences:', error);
    return false;
  }
}

/**
 * Unsubscribe from all marketing emails
 */
export async function unsubscribeAll(
  agentId: string,
  reason?: string
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.rpc('unsubscribe_all', {
      p_agent_id: agentId,
      p_reason: reason || null,
    } as never);

    if (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unsubscribeAll:', error);
    return false;
  }
}

/**
 * Helper to get unsubscribe URL for emails
 */
export function getUnsubscribeUrl(agentId: string, emailType: EmailType): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';
  return `${baseUrl}/unsubscribe?agent=${agentId}&type=${emailType}`;
}
