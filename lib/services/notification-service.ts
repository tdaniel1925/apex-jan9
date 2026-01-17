/**
 * Unified Notification Service
 * Following CodeBakers patterns from 06b-email.md
 *
 * Handles:
 * - Email notifications (via Resend)
 * - In-app notifications (via database)
 * - SMS notifications (via Twilio - when configured)
 */

import { createAdminClient } from '@/lib/db/supabase-server';
import {
  sendCommissionUpdate,
  sendBonusApproval,
  sendPayoutNotification,
  sendWithdrawalRequest,
  sendWithdrawalRejected,
  sendWelcomeEmail,
  sendNewLeadNotification,
  sendFoundersWelcomeEmail,
  type EmailResult,
} from '@/lib/email/email-service';

// ============================================
// TYPES
// ============================================

export type NotificationChannel = 'email' | 'in_app' | 'sms' | 'push';

export type NotificationType =
  | 'commission_update'
  | 'bonus_approval'
  | 'payout_processing'
  | 'payout_completed'
  | 'withdrawal_request'
  | 'withdrawal_rejected'
  | 'welcome'
  | 'new_lead'
  | 'founders_welcome'
  | 'achievement_earned'
  | 'course_completed'
  | 'certificate_earned'
  | 'rank_promotion'
  | 'team_update'
  | 'system_alert'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
}

export interface NotificationOptions {
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledFor?: Date;
  expiresAt?: Date;
  groupKey?: string; // Group related notifications
}

export interface NotificationResult {
  success: boolean;
  channels: {
    email?: EmailResult;
    in_app?: { id: string } | { error: string };
    sms?: { success: boolean; error?: string };
    push?: { success: boolean; error?: string };
  };
  errors: string[];
}

export interface InAppNotification {
  id: string;
  agent_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  action_url: string | null;
  image_url: string | null;
  priority: NotificationPriority;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  group_key: string | null;
}

// ============================================
// NOTIFICATION SERVICE
// ============================================

export class NotificationService {
  private supabase = createAdminClient();

  /**
   * Send a notification through specified channels
   */
  async send(
    agentId: string,
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ): Promise<NotificationResult> {
    const {
      channels = ['in_app'],
      priority = 'normal',
      scheduledFor,
      expiresAt,
      groupKey,
    } = options;

    const result: NotificationResult = {
      success: true,
      channels: {},
      errors: [],
    };

    // If scheduled, store for later processing
    if (scheduledFor && scheduledFor > new Date()) {
      return this.scheduleNotification(agentId, payload, options);
    }

    // Get agent details for email/SMS
    const agent = await this.getAgentDetails(agentId);

    // Process each channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (agent?.email) {
              result.channels.email = await this.sendEmail(agent, payload);
              if (!result.channels.email.success) {
                result.errors.push(`Email: ${result.channels.email.error}`);
              }
            }
            break;

          case 'in_app':
            result.channels.in_app = await this.createInAppNotification(
              agentId,
              payload,
              priority,
              expiresAt,
              groupKey
            );
            if ('error' in result.channels.in_app) {
              result.errors.push(`In-app: ${result.channels.in_app.error}`);
            }
            break;

          case 'sms':
            if (agent?.phone) {
              result.channels.sms = await this.sendSMS(agent.phone, payload);
              if (!result.channels.sms.success) {
                result.errors.push(`SMS: ${result.channels.sms.error}`);
              }
            }
            break;

          case 'push':
            // Push notifications would require FCM or similar
            result.channels.push = { success: false, error: 'Push notifications not configured' };
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${channel}: ${errorMessage}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Send notification to multiple agents
   */
  async sendBulk(
    agentIds: string[],
    payload: NotificationPayload,
    options: NotificationOptions = {}
  ): Promise<Map<string, NotificationResult>> {
    const results = new Map<string, NotificationResult>();

    // Process in batches of 10 to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < agentIds.length; i += batchSize) {
      const batch = agentIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (agentId) => {
        const result = await this.send(agentId, payload, options);
        results.set(agentId, result);
      });
      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Get unread notifications for an agent
   */
  async getUnreadNotifications(agentId: string): Promise<InAppNotification[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('notifications')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_read', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }

    return (data || []) as InAppNotification[];
  }

  /**
   * Get all notifications for an agent with pagination
   */
  async getNotifications(
    agentId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: InAppNotification[]; total: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (this.supabase as any)
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0 };
    }

    return {
      notifications: (data || []) as InAppNotification[],
      total: count || 0,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, agentId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }

  /**
   * Mark all notifications as read for an agent
   */
  async markAllAsRead(agentId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('agent_id', agentId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, agentId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  }

  /**
   * Get unread count for an agent
   */
  async getUnreadCount(agentId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (this.supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('is_read', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getAgentDetails(agentId: string): Promise<{
    id: string;
    email: string;
    phone: string | null;
    full_name: string;
    agent_code: string;
  } | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('id, email, phone, full_name, agent_code')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent details:', error);
      return null;
    }

    return data;
  }

  private async createInAppNotification(
    agentId: string,
    payload: NotificationPayload,
    priority: NotificationPriority,
    expiresAt?: Date,
    groupKey?: string
  ): Promise<{ id: string } | { error: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('notifications')
      .insert({
        agent_id: agentId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || null,
        action_url: payload.actionUrl || null,
        image_url: payload.imageUrl || null,
        priority,
        is_read: false,
        expires_at: expiresAt?.toISOString() || null,
        group_key: groupKey || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating in-app notification:', error);
      return { error: error.message };
    }

    return { id: data.id };
  }

  private async sendEmail(
    agent: { email: string; full_name: string },
    payload: NotificationPayload
  ): Promise<EmailResult> {
    // Route to appropriate email function based on type
    switch (payload.type) {
      case 'commission_update':
        return sendCommissionUpdate({
          to: agent.email,
          agentName: agent.full_name,
          amount: (payload.data?.amount as number) || 0,
          period: (payload.data?.period as string) || '',
        });

      case 'bonus_approval':
        return sendBonusApproval({
          to: agent.email,
          agentName: agent.full_name,
          bonusType: (payload.data?.bonusType as string) || 'Bonus',
          amount: (payload.data?.amount as number) || 0,
          reason: payload.data?.reason as string,
        });

      case 'payout_processing':
      case 'payout_completed':
        return sendPayoutNotification({
          to: agent.email,
          agentName: agent.full_name,
          amount: (payload.data?.amount as number) || 0,
          status: payload.type === 'payout_completed' ? 'completed' : 'processing',
          paymentMethod: (payload.data?.paymentMethod as string) || 'Direct Deposit',
          expectedDate: payload.data?.expectedDate as string,
        });

      case 'withdrawal_request':
        return sendWithdrawalRequest({
          to: agent.email,
          agentName: agent.full_name,
          amount: (payload.data?.amount as number) || 0,
          netAmount: (payload.data?.netAmount as number) || 0,
          fee: (payload.data?.fee as number) || 0,
          paymentMethod: (payload.data?.paymentMethod as string) || 'Direct Deposit',
          estimatedDays: (payload.data?.estimatedDays as string) || '3-5 business days',
        });

      case 'withdrawal_rejected':
        return sendWithdrawalRejected({
          to: agent.email,
          agentName: agent.full_name,
          amount: (payload.data?.amount as number) || 0,
          paymentMethod: (payload.data?.paymentMethod as string) || 'Direct Deposit',
          reason: payload.data?.reason as string,
        });

      case 'welcome':
        return sendWelcomeEmail({
          to: agent.email,
          agentName: agent.full_name,
          agentCode: (payload.data?.agentCode as string) || '',
          sponsorName: (payload.data?.sponsorName as string) || 'Apex Affinity Group',
        });

      case 'new_lead':
        return sendNewLeadNotification({
          to: agent.email,
          agentName: agent.full_name,
          leadName: (payload.data?.leadName as string) || 'New Lead',
          leadEmail: (payload.data?.leadEmail as string) || '',
          leadPhone: payload.data?.leadPhone as string,
          leadMessage: payload.data?.leadMessage as string,
          source: (payload.data?.source as string) || 'Website',
        });

      case 'founders_welcome':
        return sendFoundersWelcomeEmail({
          to: agent.email,
          founderName: agent.full_name,
          slotNumber: (payload.data?.slotNumber as number) || 0,
          sharePercentage: payload.data?.sharePercentage as number,
        });

      default:
        // For other notification types, we'd need to create generic email templates
        // For now, return success without sending email
        return { success: true };
    }
  }

  private async sendSMS(
    phone: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { success: false, error: 'SMS not configured' };
    }

    try {
      // Twilio integration would go here
      // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await twilio.messages.create({
      //   body: payload.message,
      //   to: phone,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      // });

      // SMS integration pending - Twilio not configured
      return { success: false, error: 'SMS integration pending' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS send failed',
      };
    }
  }

  private async scheduleNotification(
    agentId: string,
    payload: NotificationPayload,
    options: NotificationOptions
  ): Promise<NotificationResult> {
    // Store scheduled notification in database for later processing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any).from('scheduled_notifications').insert({
      agent_id: agentId,
      payload: payload,
      options: options,
      scheduled_for: options.scheduledFor?.toISOString(),
      status: 'pending',
    });

    if (error) {
      return {
        success: false,
        channels: {},
        errors: [`Failed to schedule notification: ${error.message}`],
      };
    }

    return {
      success: true,
      channels: {},
      errors: [],
    };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

// Singleton instance
let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}

/**
 * Quick send notification helper
 */
export async function sendNotification(
  agentId: string,
  payload: NotificationPayload,
  options?: NotificationOptions
): Promise<NotificationResult> {
  return getNotificationService().send(agentId, payload, options);
}

/**
 * Send notification to multiple agents
 */
export async function sendBulkNotification(
  agentIds: string[],
  payload: NotificationPayload,
  options?: NotificationOptions
): Promise<Map<string, NotificationResult>> {
  return getNotificationService().sendBulk(agentIds, payload, options);
}

// ============================================
// PRE-BUILT NOTIFICATION HELPERS
// ============================================

export async function notifyCommissionUpdate(
  agentId: string,
  amount: number,
  period: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'commission_update',
      title: 'Commission Update',
      message: `You have a new commission of $${amount.toFixed(2)} for ${period}`,
      data: { amount, period },
      actionUrl: '/dashboard/wallet',
    },
    { channels: ['email', 'in_app'], priority: 'normal' }
  );
}

export async function notifyBonusApproval(
  agentId: string,
  bonusType: string,
  amount: number,
  reason?: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'bonus_approval',
      title: 'Bonus Approved!',
      message: `Your ${bonusType} bonus of $${amount.toFixed(2)} has been approved`,
      data: { bonusType, amount, reason },
      actionUrl: '/dashboard/wallet',
    },
    { channels: ['email', 'in_app'], priority: 'high' }
  );
}

export async function notifyPayoutCompleted(
  agentId: string,
  amount: number,
  paymentMethod: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'payout_completed',
      title: 'Payout Sent!',
      message: `Your payout of $${amount.toFixed(2)} has been sent via ${paymentMethod}`,
      data: { amount, paymentMethod },
      actionUrl: '/dashboard/wallet',
    },
    { channels: ['email', 'in_app'], priority: 'high' }
  );
}

export async function notifyAchievementEarned(
  agentId: string,
  achievementTitle: string,
  achievementIcon: string,
  points: number
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'achievement_earned',
      title: 'Achievement Unlocked!',
      message: `You earned "${achievementTitle}" (+${points} points)`,
      data: { achievementTitle, achievementIcon, points },
      imageUrl: achievementIcon,
      actionUrl: '/dashboard/training/achievements',
    },
    { channels: ['in_app'], priority: 'normal' }
  );
}

export async function notifyCourseCompleted(
  agentId: string,
  courseTitle: string,
  certificateId?: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'course_completed',
      title: 'Course Completed!',
      message: `Congratulations! You completed "${courseTitle}"`,
      data: { courseTitle, certificateId },
      actionUrl: certificateId
        ? `/dashboard/training/certificates/${certificateId}`
        : '/dashboard/training',
    },
    { channels: ['in_app'], priority: 'normal' }
  );
}

export async function notifyRankPromotion(
  agentId: string,
  newRank: string,
  previousRank: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'rank_promotion',
      title: 'Congratulations on Your Promotion!',
      message: `You've been promoted from ${previousRank} to ${newRank}!`,
      data: { newRank, previousRank },
      actionUrl: '/dashboard',
    },
    { channels: ['email', 'in_app'], priority: 'high' }
  );
}

export async function notifyNewTeamMember(
  agentId: string,
  newMemberName: string,
  newMemberRank: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'team_update',
      title: 'New Team Member!',
      message: `${newMemberName} (${newMemberRank}) has joined your team`,
      data: { newMemberName, newMemberRank },
      actionUrl: '/dashboard/team',
    },
    { channels: ['in_app'], priority: 'normal' }
  );
}

export async function notifySystemAlert(
  agentId: string,
  alertTitle: string,
  alertMessage: string,
  actionUrl?: string
): Promise<NotificationResult> {
  return sendNotification(
    agentId,
    {
      type: 'system_alert',
      title: alertTitle,
      message: alertMessage,
      actionUrl,
    },
    { channels: ['in_app'], priority: 'urgent' }
  );
}
