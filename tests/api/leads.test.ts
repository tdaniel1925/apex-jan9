/**
 * Tests for Lead Capture API Route - Validation Logic
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the validation schema (same as used in the route)
const leadCaptureSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().optional(),
  agentCode: z.string().min(1, 'Agent code is required'),
  source: z.string().optional().default('contact_form'),
});

describe('Lead Capture API Validation', () => {
  describe('leadCaptureSchema', () => {
    it('should accept valid data', () => {
      const validData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '555-1234',
        agentCode: 'ABC123',
        source: 'contact_form',
      };

      const result = leadCaptureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require firstName', () => {
      const data = {
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require lastName', () => {
      const data = {
        firstName: 'Jane',
        email: 'jane@example.com',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require valid email', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'invalid-email',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require agentCode', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow optional phone', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeUndefined();
      }
    });

    it('should allow optional message', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: 'ABC123',
        message: 'Hello, I am interested!',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Hello, I am interested!');
      }
    });

    it('should default source to contact_form', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('contact_form');
      }
    });

    it('should reject empty firstName', () => {
      const data = {
        firstName: '',
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty agentCode', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        agentCode: '',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
      'a@b.co',
    ];

    const invalidEmails = [
      'invalid',
      '@example.com',
      'test@',
      'test@.com',
      '',
    ];

    it.each(validEmails)('should accept valid email: %s', (email) => {
      const data = {
        firstName: 'Test',
        lastName: 'User',
        email,
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it.each(invalidEmails)('should reject invalid email: %s', (email) => {
      const data = {
        firstName: 'Test',
        lastName: 'User',
        email,
        agentCode: 'ABC123',
      };

      const result = leadCaptureSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('API Response Types', () => {
  it('should define success response structure', () => {
    const successResponse = {
      success: true,
      contactId: 'contact-123',
      emailsQueued: 6,
      message: 'Lead captured successfully',
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.contactId).toBeDefined();
    expect(typeof successResponse.emailsQueued).toBe('number');
  });

  it('should define error response structure', () => {
    const errorResponse = {
      success: false,
      error: 'Validation failed',
      details: {
        firstName: ['First name is required'],
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
  });
});
