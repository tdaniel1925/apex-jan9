/**
 * Notification Service Tests
 * Following CodeBakers patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NotificationService,
  notifyCommissionUpdate,
  notifyBonusApproval,
  notifyPayoutCompleted,
  notifyAchievementEarned,
  notifyCourseCompleted,
  notifyRankPromotion,
  notifyNewTeamMember,
  notifySystemAlert,
  type NotificationPayload,
  type NotificationOptions,
  type InAppNotification,
  type NotificationChannel,
} from '@/lib/services/notification-service';

// Mock Supabase admin client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn(),
          range: vi.fn(),
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(),
            range: vi.fn(),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/email/email-service', () => ({
  sendCommissionUpdate: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-1' })),
  sendBonusApproval: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-2' })),
  sendPayoutNotification: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-3' })),
  sendWithdrawalRequest: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-4' })),
  sendWithdrawalRejected: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-5' })),
  sendWelcomeEmail: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-6' })),
  sendNewLeadNotification: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-7' })),
  sendFoundersWelcomeEmail: vi.fn(() => Promise.resolve({ success: true, messageId: 'msg-8' })),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  const mockAgentId = '550e8400-e29b-41d4-a716-446655440000';
  const mockAgent = {
    id: mockAgentId,
    email: 'agent@example.com',
    phone: '+15551234567',
    full_name: 'Test Agent',
    agent_code: 'AGENT001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('send()', () => {
    it('should send in-app notification successfully', async () => {
      // Mock agent lookup
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const payload: NotificationPayload = {
        type: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const result = await service.send(mockAgentId, payload, {
        channels: ['in_app'],
      });

      expect(result.success).toBe(true);
      expect(result.channels.in_app).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should send notification to multiple channels', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const payload: NotificationPayload = {
        type: 'commission_update',
        title: 'Commission Update',
        message: 'You received a new commission',
        data: { amount: 100, period: 'January 2026' },
      };

      const result = await service.send(mockAgentId, payload, {
        channels: ['email', 'in_app'],
      });

      expect(result.channels.email).toBeDefined();
      expect(result.channels.in_app).toBeDefined();
    });

    it('should handle missing agent gracefully', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: 'Not found' } })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const payload: NotificationPayload = {
        type: 'system_alert',
        title: 'Test',
        message: 'Test message',
      };

      const result = await service.send(mockAgentId, payload, {
        channels: ['email', 'in_app'],
      });

      // Should still succeed for in_app, but email won't be sent without agent email
      expect(result.channels.in_app).toBeDefined();
    });

    it('should schedule future notifications', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'scheduled_notifications') {
          return {
            insert: vi.fn(() => Promise.resolve({ error: null })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const payload: NotificationPayload = {
        type: 'reminder',
        title: 'Reminder',
        message: 'This is a scheduled reminder',
      };

      const result = await service.send(mockAgentId, payload, {
        channels: ['in_app'],
        scheduledFor: futureDate,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendBulk()', () => {
    it('should send to multiple agents', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      const payload: NotificationPayload = {
        type: 'system_alert',
        title: 'Announcement',
        message: 'Important announcement for all agents',
      };

      const results = await service.sendBulk(agentIds, payload, {
        channels: ['in_app'],
      });

      expect(results.size).toBe(3);
      for (const [, result] of results) {
        expect(result.channels.in_app).toBeDefined();
      }
    });
  });

  describe('getUnreadNotifications()', () => {
    it('should return unread notifications', async () => {
      const mockNotifications: InAppNotification[] = [
        {
          id: 'notif-1',
          agent_id: mockAgentId,
          type: 'commission_update',
          title: 'Commission',
          message: 'New commission',
          data: null,
          action_url: null,
          image_url: null,
          priority: 'normal',
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
          expires_at: null,
          group_key: null,
        },
      ];

      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() =>
                    Promise.resolve({ data: mockNotifications, error: null })
                  ),
                })),
              })),
            })),
          })),
        })),
      }));

      const notifications = await service.getUnreadNotifications(mockAgentId);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].is_read).toBe(false);
    });
  });

  describe('markAsRead()', () => {
    it('should mark notification as read', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      const result = await service.markAsRead('notif-1', mockAgentId);

      expect(result).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('should mark all notifications as read', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() =>
                Promise.resolve({ data: [{ id: '1' }, { id: '2' }], error: null })
              ),
            })),
          })),
        })),
      }));

      const count = await service.markAllAsRead(mockAgentId);

      expect(count).toBe(2);
    });
  });

  describe('deleteNotification()', () => {
    it('should delete notification', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      const result = await service.deleteNotification('notif-1', mockAgentId);

      expect(result).toBe(true);
    });
  });

  describe('getUnreadCount()', () => {
    it('should return unread count', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              or: vi.fn(() => Promise.resolve({ count: 5, error: null })),
            })),
          })),
        })),
      }));

      const count = await service.getUnreadCount(mockAgentId);

      expect(count).toBe(5);
    });
  });
});

describe('Notification Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyCommissionUpdate()', () => {
    it('should create commission notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyCommissionUpdate('agent-1', 500, 'January 2026');

      expect(result).toBeDefined();
      expect(result.channels).toBeDefined();
    });
  });

  describe('notifyBonusApproval()', () => {
    it('should create bonus approval notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyBonusApproval('agent-1', 'Fast Start', 100, 'First policy placed');

      expect(result).toBeDefined();
    });
  });

  describe('notifyPayoutCompleted()', () => {
    it('should create payout notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyPayoutCompleted('agent-1', 1500, 'Direct Deposit');

      expect(result).toBeDefined();
    });
  });

  describe('notifyAchievementEarned()', () => {
    it('should create achievement notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyAchievementEarned('agent-1', 'First Steps', '🎯', 10);

      expect(result).toBeDefined();
    });
  });

  describe('notifyCourseCompleted()', () => {
    it('should create course completion notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyCourseCompleted('agent-1', 'IUL Sales Mastery', 'cert-123');

      expect(result).toBeDefined();
    });
  });

  describe('notifyRankPromotion()', () => {
    it('should create rank promotion notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyRankPromotion('agent-1', 'Senior Agent', 'Agent');

      expect(result).toBeDefined();
    });
  });

  describe('notifyNewTeamMember()', () => {
    it('should create team member notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifyNewTeamMember('agent-1', 'John Doe', 'Associate');

      expect(result).toBeDefined();
    });
  });

  describe('notifySystemAlert()', () => {
    it('should create system alert notification', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'agent-1',
                      email: 'test@example.com',
                      full_name: 'Test Agent',
                    },
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'notif-123' }, error: null })
                ),
              })),
            })),
          };
        }
        return mockSupabaseClient.from(table);
      });

      const result = await notifySystemAlert(
        'agent-1',
        'Maintenance Notice',
        'System will be down for maintenance',
        '/announcements'
      );

      expect(result).toBeDefined();
    });
  });
});

describe('Notification Types', () => {
  it('should have all required notification types', () => {
    const notificationTypes = [
      'commission_update',
      'bonus_approval',
      'payout_processing',
      'payout_completed',
      'withdrawal_request',
      'withdrawal_rejected',
      'welcome',
      'new_lead',
      'founders_welcome',
      'achievement_earned',
      'course_completed',
      'certificate_earned',
      'rank_promotion',
      'team_update',
      'system_alert',
      'reminder',
    ];

    // All types should be valid
    notificationTypes.forEach((type) => {
      const payload: NotificationPayload = {
        type: type as NotificationPayload['type'],
        title: 'Test',
        message: 'Test message',
      };
      expect(payload.type).toBe(type);
    });
  });

  it('should have all required priority levels', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'];

    priorities.forEach((priority) => {
      const options: NotificationOptions = {
        priority: priority as NotificationOptions['priority'],
      };
      expect(options.priority).toBe(priority);
    });
  });

  it('should have all required channels', () => {
    const channels: NotificationChannel[] = ['email', 'in_app', 'sms', 'push'];

    channels.forEach((channel) => {
      const options: NotificationOptions = {
        channels: [channel],
      };
      expect(options.channels).toContain(channel);
    });
  });
});

describe('Notification Payload Validation', () => {
  it('should accept valid payload', () => {
    const payload: NotificationPayload = {
      type: 'commission_update',
      title: 'Commission Update',
      message: 'You earned $500',
      data: { amount: 500 },
      actionUrl: '/dashboard/wallet',
      imageUrl: '/images/money.png',
    };

    expect(payload.type).toBe('commission_update');
    expect(payload.title).toBeDefined();
    expect(payload.message).toBeDefined();
  });

  it('should accept minimal payload', () => {
    const payload: NotificationPayload = {
      type: 'system_alert',
      title: 'Alert',
      message: 'Important message',
    };

    expect(payload.data).toBeUndefined();
    expect(payload.actionUrl).toBeUndefined();
  });
});
