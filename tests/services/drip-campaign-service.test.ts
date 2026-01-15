/**
 * Drip Campaign Service Tests
 * Tests for enrollment, sending, and tracking of drip email campaigns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enrollAgentInDripCampaign,
  getPendingDripEmails,
  recordDripEmailSent,
  recordEmailOpened,
  recordEmailClicked,
  unsubscribeFromCampaign,
  getCampaignStats,
  CAMPAIGN_IDS,
} from '@/lib/services/drip-campaign-service';

// Create mock functions
const mockSingle = vi.fn();
const mockLimit = vi.fn();
const mockOrder = vi.fn();
const mockRpc = vi.fn();

// Mock Supabase admin client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  limit: mockLimit,
  order: mockOrder,
  single: mockSingle,
  rpc: mockRpc,
};

vi.mock('@/lib/db/supabase-server', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

describe('Drip Campaign Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.lte.mockReturnValue(mockSupabase);
    mockLimit.mockReturnValue(mockSupabase);
    mockOrder.mockReturnValue(mockSupabase);
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  describe('CAMPAIGN_IDS', () => {
    it('should have correct campaign IDs', () => {
      expect(CAMPAIGN_IDS.LICENSED_AGENT).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
      expect(CAMPAIGN_IDS.UNLICENSED_AGENT).toBe('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e');
    });
  });

  describe('enrollAgentInDripCampaign', () => {
    const mockAgentId = 'agent-123';

    it('should enroll a licensed agent in the licensed campaign', async () => {
      // Mock campaign exists and is active
      mockSingle
        .mockResolvedValueOnce({
          data: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'active' },
          error: null,
        })
        // Mock first email
        .mockResolvedValueOnce({
          data: { id: 'email-1', delay_days: 1, delay_hours: 0 },
          error: null,
        })
        // Mock enrollment insert
        .mockResolvedValueOnce({
          data: { id: 'enrollment-1', agent_id: mockAgentId },
          error: null,
        });

      const result = await enrollAgentInDripCampaign(mockAgentId, true);

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBe('enrollment-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('drip_campaigns');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', CAMPAIGN_IDS.LICENSED_AGENT);
    });

    it('should enroll an unlicensed agent in the unlicensed campaign', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { id: CAMPAIGN_IDS.UNLICENSED_AGENT, status: 'active' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'email-1', delay_days: 1, delay_hours: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'enrollment-2', agent_id: mockAgentId },
          error: null,
        });

      const result = await enrollAgentInDripCampaign(mockAgentId, false);

      expect(result.success).toBe(true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', CAMPAIGN_IDS.UNLICENSED_AGENT);
    });

    it('should return error if campaign not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await enrollAgentInDripCampaign(mockAgentId, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Campaign not found');
    });

    it('should return error if campaign is not active', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'paused' },
        error: null,
      });

      const result = await enrollAgentInDripCampaign(mockAgentId, true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign is not active');
    });

    it('should handle duplicate enrollment gracefully', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'active' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'email-1', delay_days: 1, delay_hours: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: '23505', message: 'Unique constraint violation' },
        });

      const result = await enrollAgentInDripCampaign(mockAgentId, true);

      expect(result.success).toBe(true);
      expect(result.error).toBe('Agent already enrolled in this campaign');
    });

    it('should handle enrollment errors', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'active' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'email-1', delay_days: 1, delay_hours: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: '42000', message: 'Database error' },
        });

      const result = await enrollAgentInDripCampaign(mockAgentId, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to enroll');
    });
  });

  describe('getPendingDripEmails', () => {
    it('should return empty array when no pending emails', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getPendingDripEmails();

      expect(result.enrollments).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should return enrollments with their emails', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        campaign_id: CAMPAIGN_IDS.LICENSED_AGENT,
        agent_id: 'agent-1',
        current_email_index: 0,
        status: 'active',
        enrolled_at: '2024-01-01T00:00:00Z',
        next_send_at: '2024-01-02T00:00:00Z',
        drip_campaigns: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'active' },
        agents: {
          id: 'agent-1',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const mockEmail = {
        id: 'email-1',
        campaign_id: CAMPAIGN_IDS.LICENSED_AGENT,
        sequence_order: 1,
        subject: 'Welcome',
        html_content: '<p>Welcome!</p>',
      };

      mockLimit.mockResolvedValueOnce({
        data: [mockEnrollment],
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: mockEmail,
        error: null,
      });

      const result = await getPendingDripEmails(50);

      expect(result.enrollments.length).toBe(1);
      expect(result.enrollments[0].agentEmail).toBe('test@example.com');
      expect(result.enrollments[0].agentName).toBe('John Doe');
      expect(result.enrollments[0].email).toEqual(mockEmail);
    });

    it('should filter out inactive campaigns', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        campaign_id: CAMPAIGN_IDS.LICENSED_AGENT,
        agent_id: 'agent-1',
        current_email_index: 0,
        status: 'active',
        enrolled_at: '2024-01-01T00:00:00Z',
        next_send_at: '2024-01-02T00:00:00Z',
        drip_campaigns: { id: CAMPAIGN_IDS.LICENSED_AGENT, status: 'paused' }, // Inactive!
        agents: {
          id: 'agent-1',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      mockLimit.mockResolvedValueOnce({
        data: [mockEnrollment],
        error: null,
      });

      const result = await getPendingDripEmails();

      expect(result.enrollments.length).toBe(0);
    });

    it('should handle database errors', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection error' },
      });

      const result = await getPendingDripEmails();

      expect(result.enrollments).toEqual([]);
      expect(result.error).toBe('Connection error');
    });
  });

  describe('recordDripEmailSent', () => {
    it('should record a sent email and update enrollment', async () => {
      // Mock send insert
      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'send-1' },
          error: null,
        })
        // Mock enrollment query
        .mockResolvedValueOnce({
          data: { campaign_id: CAMPAIGN_IDS.LICENSED_AGENT, current_email_index: 0, emails_sent: 0 },
          error: null,
        })
        // Mock next email check
        .mockResolvedValueOnce({
          data: { id: 'email-2', delay_days: 2, delay_hours: 0 },
          error: null,
        })
        // Mock email stats
        .mockResolvedValueOnce({
          data: { total_sent: 5 },
          error: null,
        });

      const result = await recordDripEmailSent('enrollment-1', 'email-1', 'agent-1', 'msg-123');

      expect(result.success).toBe(true);
      expect(result.sendId).toBe('send-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('drip_campaign_sends');
    });

    it('should mark enrollment as completed when no more emails', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'send-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { campaign_id: CAMPAIGN_IDS.LICENSED_AGENT, current_email_index: 4, emails_sent: 4 },
          error: null,
        })
        // No next email - campaign complete
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Mock email stats
        .mockResolvedValueOnce({
          data: { total_sent: 10 },
          error: null,
        });

      const result = await recordDripEmailSent('enrollment-1', 'email-5', 'agent-1');

      expect(result.success).toBe(true);
      // Should have called update with 'completed' status
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should handle send insert errors', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await recordDripEmailSent('enrollment-1', 'email-1', 'agent-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insert failed');
    });

    it('should handle enrollment not found', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'send-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await recordDripEmailSent('enrollment-1', 'email-1', 'agent-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Enrollment not found');
    });
  });

  describe('recordEmailOpened', () => {
    it('should record an email open event', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { enrollment_id: 'enrollment-1', email_id: 'email-1', opened_at: null },
          error: null,
        })
        // enrollment stats
        .mockResolvedValueOnce({
          data: { emails_opened: 2 },
          error: null,
        })
        // email stats
        .mockResolvedValueOnce({
          data: { total_opened: 10 },
          error: null,
        });

      const result = await recordEmailOpened('send-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should not record duplicate opens', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { enrollment_id: 'enrollment-1', email_id: 'email-1', opened_at: '2024-01-01T00:00:00Z' },
        error: null,
      });

      const result = await recordEmailOpened('send-1');

      expect(result.success).toBe(false);
    });

    it('should handle send not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await recordEmailOpened('invalid-send');

      expect(result.success).toBe(false);
    });
  });

  describe('recordEmailClicked', () => {
    it('should record a click event', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { enrollment_id: 'enrollment-1', email_id: 'email-1', clicked_at: null },
          error: null,
        })
        // enrollment stats
        .mockResolvedValueOnce({
          data: { emails_clicked: 1 },
          error: null,
        })
        // email stats
        .mockResolvedValueOnce({
          data: { total_clicked: 5 },
          error: null,
        });

      const result = await recordEmailClicked('send-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should not record duplicate clicks', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { enrollment_id: 'enrollment-1', email_id: 'email-1', clicked_at: '2024-01-01T00:00:00Z' },
        error: null,
      });

      const result = await recordEmailClicked('send-1');

      expect(result.success).toBe(false);
    });
  });

  describe('unsubscribeFromCampaign', () => {
    it('should unsubscribe an agent from a campaign', async () => {
      mockSingle
        // Find send by token
        .mockResolvedValueOnce({
          data: { enrollment_id: 'enrollment-1' },
          error: null,
        })
        // Get enrollment campaign_id
        .mockResolvedValueOnce({
          data: { campaign_id: CAMPAIGN_IDS.LICENSED_AGENT },
          error: null,
        });

      const result = await unsubscribeFromCampaign('valid-token');

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockRpc).toHaveBeenCalled();
    });

    it('should handle invalid unsubscribe token', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await unsubscribeFromCampaign('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid unsubscribe token');
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: CAMPAIGN_IDS.LICENSED_AGENT,
          name: 'Licensed Agent Campaign',
          total_enrolled: 100,
          total_completed: 50,
          total_unsubscribed: 5,
        },
        error: null,
      });

      mockOrder.mockResolvedValueOnce({
        data: [
          { id: 'email-1', total_sent: 100, total_opened: 60, total_clicked: 20 },
          { id: 'email-2', total_sent: 80, total_opened: 50, total_clicked: 15 },
        ],
        error: null,
      });

      const result = await getCampaignStats(CAMPAIGN_IDS.LICENSED_AGENT);

      expect(result.campaign).not.toBeNull();
      expect(result.emails.length).toBe(2);
      expect(result.stats.totalEnrolled).toBe(100);
      expect(result.stats.totalCompleted).toBe(50);
      expect(result.stats.totalUnsubscribed).toBe(5);
      // (60+50) / (100+80) * 100 = 61.11%
      expect(result.stats.avgOpenRate).toBeCloseTo(61.11, 1);
      // (20+15) / (100+80) * 100 = 19.44%
      expect(result.stats.avgClickRate).toBeCloseTo(19.44, 1);
    });

    it('should handle campaign not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getCampaignStats('non-existent');

      expect(result.campaign).toBeNull();
      expect(result.stats.avgOpenRate).toBe(0);
      expect(result.stats.avgClickRate).toBe(0);
    });

    it('should handle zero emails sent', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: CAMPAIGN_IDS.LICENSED_AGENT,
          total_enrolled: 0,
          total_completed: 0,
          total_unsubscribed: 0,
        },
        error: null,
      });

      mockOrder.mockResolvedValueOnce({
        data: [{ id: 'email-1', total_sent: 0, total_opened: 0, total_clicked: 0 }],
        error: null,
      });

      const result = await getCampaignStats(CAMPAIGN_IDS.LICENSED_AGENT);

      expect(result.stats.avgOpenRate).toBe(0);
      expect(result.stats.avgClickRate).toBe(0);
    });
  });
});
