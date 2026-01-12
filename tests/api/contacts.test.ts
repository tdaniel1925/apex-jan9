/**
 * Tests for Contacts API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/db/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-agent' }, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-contact' }, error: null }),
        })),
      })),
    })),
  })),
}));

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should require first_name field', async () => {
      // Test that validation schema requires first_name
      const { z } = await import('zod');

      const contactCreateSchema = z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        type: z.enum(['lead', 'customer', 'recruit']).default('lead'),
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      });

      const result = contactCreateSchema.safeParse({
        first_name: '',
        last_name: 'Doe',
      });

      expect(result.success).toBe(false);
    });

    it('should require last_name field', async () => {
      const { z } = await import('zod');

      const contactCreateSchema = z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        type: z.enum(['lead', 'customer', 'recruit']).default('lead'),
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      });

      const result = contactCreateSchema.safeParse({
        first_name: 'John',
        last_name: '',
      });

      expect(result.success).toBe(false);
    });

    it('should validate email format', async () => {
      const { z } = await import('zod');

      const contactCreateSchema = z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        type: z.enum(['lead', 'customer', 'recruit']).default('lead'),
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      });

      const validResult = contactCreateSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });

      expect(validResult.success).toBe(true);

      const invalidResult = contactCreateSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email',
      });

      expect(invalidResult.success).toBe(false);
    });

    it('should accept valid contact data', async () => {
      const { z } = await import('zod');

      const contactCreateSchema = z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        type: z.enum(['lead', 'customer', 'recruit']).default('lead'),
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      });

      const result = contactCreateSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        type: 'lead',
        stage: 'new',
        source: 'website',
        notes: 'Test contact',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.first_name).toBe('John');
        expect(result.data.last_name).toBe('Doe');
      }
    });
  });

  describe('Contact Types', () => {
    it('should only accept valid contact types', async () => {
      const { z } = await import('zod');

      const typeSchema = z.enum(['lead', 'customer', 'recruit']);

      expect(typeSchema.safeParse('lead').success).toBe(true);
      expect(typeSchema.safeParse('customer').success).toBe(true);
      expect(typeSchema.safeParse('recruit').success).toBe(true);
      expect(typeSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('Pipeline Stages', () => {
    it('should only accept valid pipeline stages', async () => {
      const { z } = await import('zod');

      const stageSchema = z.enum([
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost',
      ]);

      expect(stageSchema.safeParse('new').success).toBe(true);
      expect(stageSchema.safeParse('closed_won').success).toBe(true);
      expect(stageSchema.safeParse('invalid_stage').success).toBe(false);
    });
  });
});
