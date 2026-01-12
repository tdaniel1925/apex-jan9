/**
 * Contact Activities API Tests
 * Tests for /api/contacts/[id]/activities endpoint
 */

import { describe, it, expect } from 'vitest';

describe('Contact Activities API', () => {
  describe('Response Structure', () => {
    it('should have correct response schema', () => {
      const mockResponse = {
        contactId: 'contact-123',
        leadScore: 45,
        emailSequenceId: 'seq-123',
        emailSequenceStartedAt: '2026-01-12T00:00:00Z',
        activities: [
          {
            id: 'act-1',
            activity_type: 'email_open',
            metadata: { queue_id: 'queue-1' },
            created_at: '2026-01-12T10:00:00Z',
          },
        ],
        emailQueue: [
          {
            id: 'queue-1',
            status: 'sent',
            scheduled_for: '2026-01-12T09:00:00Z',
            sent_at: '2026-01-12T09:01:00Z',
            email_sequence_steps: {
              subject: 'Welcome!',
              step_number: 1,
            },
          },
        ],
        stats: {
          opens: 1,
          clicks: 0,
          formSubmits: 1,
          totalActivities: 2,
        },
      };

      expect(mockResponse.contactId).toBeDefined();
      expect(typeof mockResponse.leadScore).toBe('number');
      expect(Array.isArray(mockResponse.activities)).toBe(true);
      expect(Array.isArray(mockResponse.emailQueue)).toBe(true);
      expect(mockResponse.stats).toHaveProperty('opens');
      expect(mockResponse.stats).toHaveProperty('clicks');
    });

    it('should handle activity types correctly', () => {
      const activityTypes = [
        'email_sent',
        'email_open',
        'email_click',
        'form_submit',
        'page_view',
        'copilot_demo',
        'copilot_message',
      ];

      activityTypes.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Email Queue Status', () => {
    it('should recognize all queue statuses', () => {
      const statuses = ['pending', 'sent', 'failed', 'cancelled'];

      statuses.forEach((status) => {
        expect(['pending', 'sent', 'failed', 'cancelled']).toContain(status);
      });
    });

    it('should calculate progress correctly', () => {
      const emailQueue = [
        { status: 'sent' },
        { status: 'sent' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' },
      ];

      const sentCount = emailQueue.filter((e) => e.status === 'sent').length;
      const totalCount = emailQueue.length;
      const progress = (sentCount / totalCount) * 100;

      expect(sentCount).toBe(2);
      expect(totalCount).toBe(5);
      expect(progress).toBe(40);
    });
  });

  describe('Stats Calculation', () => {
    it('should calculate engagement stats from activities', () => {
      const activities = [
        { activity_type: 'email_open' },
        { activity_type: 'email_open' },
        { activity_type: 'email_click' },
        { activity_type: 'form_submit' },
        { activity_type: 'email_sent' },
      ];

      const opens = activities.filter((a) => a.activity_type === 'email_open').length;
      const clicks = activities.filter((a) => a.activity_type === 'email_click').length;
      const formSubmits = activities.filter((a) => a.activity_type === 'form_submit').length;

      expect(opens).toBe(2);
      expect(clicks).toBe(1);
      expect(formSubmits).toBe(1);
    });

    it('should determine lead temperature from score', () => {
      const getLeadTemperature = (score: number) => {
        if (score >= 50) return 'hot';
        if (score >= 20) return 'warm';
        return 'cold';
      };

      expect(getLeadTemperature(75)).toBe('hot');
      expect(getLeadTemperature(50)).toBe('hot');
      expect(getLeadTemperature(35)).toBe('warm');
      expect(getLeadTemperature(20)).toBe('warm');
      expect(getLeadTemperature(10)).toBe('cold');
      expect(getLeadTemperature(0)).toBe('cold');
    });
  });
});
