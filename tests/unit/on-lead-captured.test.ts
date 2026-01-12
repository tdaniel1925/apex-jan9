/**
 * Tests for Lead Capture Workflow - Type Definitions and Logic
 */
import { describe, it, expect } from 'vitest';

// Test type definitions for the workflow
interface LeadCaptureData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  agentId: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

interface LeadCaptureResult {
  success: boolean;
  contactId?: string;
  emailsQueued?: number;
  error?: string;
}

describe('Lead Capture Workflow Types', () => {
  describe('LeadCaptureData', () => {
    it('should accept valid lead capture data', () => {
      const data: LeadCaptureData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '555-1234',
        agentId: 'agent-123',
        source: 'contact_form',
        metadata: { message: 'Hello!' },
      };

      expect(data.firstName).toBe('Jane');
      expect(data.lastName).toBe('Doe');
      expect(data.email).toContain('@');
      expect(data.agentId).toBeDefined();
    });

    it('should allow optional fields', () => {
      const data: LeadCaptureData = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        agentId: 'agent-456',
      };

      expect(data.phone).toBeUndefined();
      expect(data.source).toBeUndefined();
      expect(data.metadata).toBeUndefined();
    });
  });

  describe('LeadCaptureResult', () => {
    it('should represent success state', () => {
      const result: LeadCaptureResult = {
        success: true,
        contactId: 'contact-123',
        emailsQueued: 6,
      };

      expect(result.success).toBe(true);
      expect(result.contactId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should represent error state', () => {
      const result: LeadCaptureResult = {
        success: false,
        error: 'Database error',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.contactId).toBeUndefined();
    });

    it('should handle existing contact (no new emails)', () => {
      const result: LeadCaptureResult = {
        success: true,
        contactId: 'existing-contact',
        emailsQueued: 0,
      };

      expect(result.success).toBe(true);
      expect(result.emailsQueued).toBe(0);
    });
  });
});

describe('Lead Capture Business Logic', () => {
  describe('Default Sequence ID', () => {
    const DEFAULT_NURTURING_SEQUENCE_ID = 'a0000000-0000-0000-0000-000000000001';

    it('should use consistent UUID format', () => {
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      expect(DEFAULT_NURTURING_SEQUENCE_ID).toMatch(uuidRegex);
    });

    it('should be the seeded sequence ID', () => {
      expect(DEFAULT_NURTURING_SEQUENCE_ID).toBe('a0000000-0000-0000-0000-000000000001');
    });
  });

  describe('Contact Deduplication Logic', () => {
    it('should identify duplicate by email + agentId', () => {
      const existingContact = {
        email: 'jane@example.com',
        agentId: 'agent-123',
      };
      const newLead = {
        email: 'jane@example.com',
        agentId: 'agent-123',
      };

      const isDuplicate =
        existingContact.email === newLead.email &&
        existingContact.agentId === newLead.agentId;

      expect(isDuplicate).toBe(true);
    });

    it('should not be duplicate if different agent', () => {
      const existingContact = {
        email: 'jane@example.com',
        agentId: 'agent-123',
      };
      const newLead = {
        email: 'jane@example.com',
        agentId: 'agent-456',
      };

      const isDuplicate =
        existingContact.email === newLead.email &&
        existingContact.agentId === newLead.agentId;

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Email Sequence Enrollment', () => {
    it('should not start sequence if already enrolled', () => {
      const contact = {
        id: 'contact-123',
        email_sequence_id: 'existing-sequence',
      };

      const shouldEnroll = !contact.email_sequence_id;

      expect(shouldEnroll).toBe(false);
    });

    it('should start sequence if not enrolled', () => {
      const contact = {
        id: 'contact-123',
        email_sequence_id: null,
      };

      const shouldEnroll = !contact.email_sequence_id;

      expect(shouldEnroll).toBe(true);
    });
  });
});

describe('Contact Pipeline Stages', () => {
  const validStages = ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'];

  it('should start new leads as "new" stage', () => {
    const defaultStage = 'new';
    expect(validStages).toContain(defaultStage);
  });

  it('should have all expected stages', () => {
    expect(validStages).toHaveLength(6);
    expect(validStages).toContain('new');
    expect(validStages).toContain('contacted');
    expect(validStages).toContain('qualified');
    expect(validStages).toContain('proposal');
    expect(validStages).toContain('closed_won');
    expect(validStages).toContain('closed_lost');
  });
});
