/**
 * Tests for Agent Recruitment System database types
 */
import { describe, it, expect } from 'vitest';
import type {
  EmailSequence,
  EmailSequenceStep,
  LeadEmailQueue,
  LeadActivity,
  CopilotUsage,
  CopilotSubscription,
  EmailSequenceTrigger,
  EmailQueueStatus,
  LeadActivityType,
  CopilotTier,
  CopilotSubscriptionStatus,
} from '@/lib/types/database';
import { COPILOT_TIERS } from '@/lib/types/database';

describe('Agent Recruitment System Types', () => {
  describe('EmailSequence', () => {
    it('should have correct structure', () => {
      const sequence: EmailSequence = {
        id: 'test-id',
        name: 'Lead Nurturing',
        description: 'Default nurturing sequence',
        trigger_type: 'lead_capture',
        is_active: true,
        created_at: '2026-01-12T00:00:00Z',
        updated_at: '2026-01-12T00:00:00Z',
      };

      expect(sequence.id).toBeDefined();
      expect(sequence.trigger_type).toBe('lead_capture');
    });

    it('should accept all trigger types', () => {
      const triggers: EmailSequenceTrigger[] = ['lead_capture', 'signup', 'copilot_trial', 'manual'];
      expect(triggers).toHaveLength(4);
    });
  });

  describe('EmailSequenceStep', () => {
    it('should have correct structure', () => {
      const step: EmailSequenceStep = {
        id: 'step-id',
        sequence_id: 'seq-id',
        step_number: 1,
        subject: 'Welcome!',
        body_html: '<p>Hello {{lead.first_name}}</p>',
        body_text: 'Hello {{lead.first_name}}',
        delay_days: 0,
        delay_hours: 0,
        is_active: true,
        created_at: '2026-01-12T00:00:00Z',
      };

      expect(step.step_number).toBe(1);
      expect(step.delay_days).toBe(0);
    });
  });

  describe('LeadEmailQueue', () => {
    it('should have correct structure', () => {
      const email: LeadEmailQueue = {
        id: 'queue-id',
        contact_id: 'contact-id',
        sequence_step_id: 'step-id',
        scheduled_for: '2026-01-13T10:00:00Z',
        sent_at: null,
        status: 'pending',
        error_message: null,
        resend_message_id: null,
        created_at: '2026-01-12T00:00:00Z',
      };

      expect(email.status).toBe('pending');
      expect(email.sent_at).toBeNull();
    });

    it('should accept all status types', () => {
      const statuses: EmailQueueStatus[] = ['pending', 'sent', 'failed', 'cancelled'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('LeadActivity', () => {
    it('should have correct structure', () => {
      const activity: LeadActivity = {
        id: 'activity-id',
        contact_id: 'contact-id',
        activity_type: 'email_open',
        metadata: { email_id: 'queue-id' },
        created_at: '2026-01-12T00:00:00Z',
      };

      expect(activity.activity_type).toBe('email_open');
      expect(activity.metadata).toHaveProperty('email_id');
    });

    it('should accept all activity types', () => {
      const types: LeadActivityType[] = [
        'email_sent',
        'email_open',
        'email_click',
        'page_view',
        'form_submit',
        'copilot_demo',
        'copilot_message',
      ];
      expect(types).toHaveLength(7);
    });
  });

  describe('CopilotUsage', () => {
    it('should have correct structure', () => {
      const usage: CopilotUsage = {
        id: 'usage-id',
        agent_id: 'agent-id',
        date: '2026-01-12',
        messages_used: 5,
      };

      expect(usage.messages_used).toBe(5);
    });
  });

  describe('CopilotSubscription', () => {
    it('should have correct structure', () => {
      const subscription: CopilotSubscription = {
        id: 'sub-id',
        agent_id: 'agent-id',
        stripe_subscription_id: 'sub_xxx',
        stripe_customer_id: 'cus_xxx',
        tier: 'pro',
        bonus_volume: 60,
        price_cents: 7900,
        status: 'active',
        trial_ends_at: null,
        current_period_start: '2026-01-12T00:00:00Z',
        current_period_end: '2026-02-12T00:00:00Z',
        created_at: '2026-01-12T00:00:00Z',
        updated_at: '2026-01-12T00:00:00Z',
      };

      expect(subscription.tier).toBe('pro');
      expect(subscription.bonus_volume).toBe(60);
    });

    it('should accept all tier types', () => {
      const tiers: CopilotTier[] = ['basic', 'pro', 'agency'];
      expect(tiers).toHaveLength(3);
    });

    it('should accept all status types', () => {
      const statuses: CopilotSubscriptionStatus[] = ['trialing', 'active', 'past_due', 'cancelled'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('COPILOT_TIERS', () => {
    it('should have trial tier with 5 messages/day', () => {
      expect(COPILOT_TIERS.trial.messages_per_day).toBe(5);
      expect(COPILOT_TIERS.trial.bonus_volume).toBe(0);
      expect(COPILOT_TIERS.trial.price_cents).toBe(0);
    });

    it('should have basic tier with correct values', () => {
      expect(COPILOT_TIERS.basic.price_cents).toBe(2900);
      expect(COPILOT_TIERS.basic.bonus_volume).toBe(20);
      expect(COPILOT_TIERS.basic.messages_per_day).toBe(50);
    });

    it('should have pro tier with correct values', () => {
      expect(COPILOT_TIERS.pro.price_cents).toBe(7900);
      expect(COPILOT_TIERS.pro.bonus_volume).toBe(60);
      expect(COPILOT_TIERS.pro.messages_per_day).toBe(200);
    });

    it('should have agency tier with unlimited messages', () => {
      expect(COPILOT_TIERS.agency.price_cents).toBe(19900);
      expect(COPILOT_TIERS.agency.bonus_volume).toBe(150);
      expect(COPILOT_TIERS.agency.messages_per_day).toBe(-1); // unlimited
    });
  });
});
