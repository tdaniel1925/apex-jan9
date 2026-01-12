/**
 * Email Service Tests
 * Following CodeBakers patterns from 08-testing.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendCommissionUpdate,
  sendBonusApproval,
  sendPayoutNotification,
  sendBulkEmails,
} from '@/lib/email/email-service';

// Mock Resend
vi.mock('@/lib/email/resend-client', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
  EMAIL_CONFIG: {
    from: 'Test <test@test.com>',
    replyTo: 'support@test.com',
  },
}));

// Mock React Email render and components
vi.mock('@react-email/components', () => ({
  render: vi.fn(() => '<html>Mocked Email</html>'),
  Body: vi.fn(({ children }: any) => children),
  Button: vi.fn(({ children }: any) => children),
  Container: vi.fn(({ children }: any) => children),
  Head: vi.fn(() => null),
  Heading: vi.fn(({ children }: any) => children),
  Hr: vi.fn(() => null),
  Html: vi.fn(({ children }: any) => children),
  Preview: vi.fn(({ children }: any) => children),
  Section: vi.fn(({ children }: any) => children),
  Text: vi.fn(({ children }: any) => children),
}));

import { resend } from '@/lib/email/resend-client';

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendCommissionUpdate', () => {
    it('should send commission update email successfully', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: { id: 'msg_123' },
        error: null,
      } as any);

      const result = await sendCommissionUpdate({
        to: 'agent@test.com',
        agentName: 'John Doe',
        amount: 1500.5,
        period: 'January 2026',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123');
      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'Test <test@test.com>',
        to: 'agent@test.com',
        subject: 'Commission Update: $1500.50 - January 2026',
        html: '<html>Mocked Email</html>',
      });
    });

    it('should handle send errors', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' },
      } as any);

      const result = await sendCommissionUpdate({
        to: 'invalid-email',
        agentName: 'John Doe',
        amount: 1500.5,
        period: 'January 2026',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should handle exceptions', async () => {
      vi.mocked(resend.emails.send).mockRejectedValue(new Error('Network error'));

      const result = await sendCommissionUpdate({
        to: 'agent@test.com',
        agentName: 'John Doe',
        amount: 1500.5,
        period: 'January 2026',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendBonusApproval', () => {
    it('should send bonus approval email successfully', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: { id: 'msg_456' },
        error: null,
      } as any);

      const result = await sendBonusApproval({
        to: 'agent@test.com',
        agentName: 'Jane Smith',
        bonusType: 'Fast Start Bonus',
        amount: 500,
        reason: 'Exceeded target by 120%',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_456');
      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'Test <test@test.com>',
        to: 'agent@test.com',
        subject: 'Bonus Approved: Fast Start Bonus - $500.00',
        html: '<html>Mocked Email</html>',
      });
    });

    it('should send bonus approval without reason', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: { id: 'msg_789' },
        error: null,
      } as any);

      const result = await sendBonusApproval({
        to: 'agent@test.com',
        agentName: 'Jane Smith',
        bonusType: 'Monthly Bonus',
        amount: 250,
      });

      expect(result.success).toBe(true);
    });

    it('should handle send errors', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      } as any);

      const result = await sendBonusApproval({
        to: 'agent@test.com',
        agentName: 'Jane Smith',
        bonusType: 'Fast Start Bonus',
        amount: 500,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('sendPayoutNotification', () => {
    it('should send processing payout notification', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: { id: 'msg_101' },
        error: null,
      } as any);

      const result = await sendPayoutNotification({
        to: 'agent@test.com',
        agentName: 'Bob Johnson',
        amount: 2500,
        status: 'processing',
        paymentMethod: 'Bank Transfer',
        expectedDate: '2026-01-15',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_101');
      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'Test <test@test.com>',
        to: 'agent@test.com',
        subject: 'Payout Processing: $2500.00',
        html: '<html>Mocked Email</html>',
      });
    });

    it('should send completed payout notification', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: { id: 'msg_202' },
        error: null,
      } as any);

      const result = await sendPayoutNotification({
        to: 'agent@test.com',
        agentName: 'Bob Johnson',
        amount: 2500,
        status: 'completed',
        paymentMethod: 'PayPal',
      });

      expect(result.success).toBe(true);
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Payout Sent: $2500.00',
        })
      );
    });

    it('should handle send errors', async () => {
      vi.mocked(resend.emails.send).mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
      } as any);

      const result = await sendPayoutNotification({
        to: 'agent@test.com',
        agentName: 'Bob Johnson',
        amount: 2500,
        status: 'completed',
        paymentMethod: 'Bank Transfer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });
  });

  describe('sendBulkEmails', () => {
    it('should send multiple emails successfully', async () => {
      vi.mocked(resend.emails.send)
        .mockResolvedValueOnce({
          data: { id: 'msg_1' },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: { id: 'msg_2' },
          error: null,
        } as any);

      const results = await sendBulkEmails([
        {
          to: 'agent1@test.com',
          subject: 'Test 1',
          html: '<html>Email 1</html>',
        },
        {
          to: 'agent2@test.com',
          subject: 'Test 2',
          html: '<html>Email 2</html>',
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe('msg_1');
      expect(results[1].success).toBe(true);
      expect(results[1].messageId).toBe('msg_2');
    });

    it('should handle partial failures in bulk send', async () => {
      vi.mocked(resend.emails.send)
        .mockResolvedValueOnce({
          data: { id: 'msg_1' },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Invalid email' },
        } as any);

      const results = await sendBulkEmails([
        {
          to: 'agent1@test.com',
          subject: 'Test 1',
          html: '<html>Email 1</html>',
        },
        {
          to: 'invalid',
          subject: 'Test 2',
          html: '<html>Email 2</html>',
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Invalid email');
    });
  });
});
