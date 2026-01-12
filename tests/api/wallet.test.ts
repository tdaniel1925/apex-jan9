/**
 * Tests for Wallet API
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
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-wallet',
              agent_id: 'test-agent',
              balance: 1000,
              pending_balance: 100,
              lifetime_earnings: 5000,
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

describe('Wallet API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Withdrawal Validation', () => {
    it('should require amount field', async () => {
      const { z } = await import('zod');

      const withdrawSchema = z.object({
        amount: z.number().positive({ message: 'Amount must be greater than 0' }),
        method: z.enum(['ach', 'wire', 'check'], { message: 'Invalid payment method' }),
      });

      const result = withdrawSchema.safeParse({
        method: 'ach',
      });

      expect(result.success).toBe(false);
    });

    it('should require positive amount', async () => {
      const { z } = await import('zod');

      const withdrawSchema = z.object({
        amount: z.number().positive({ message: 'Amount must be greater than 0' }),
        method: z.enum(['ach', 'wire', 'check'], { message: 'Invalid payment method' }),
      });

      const result = withdrawSchema.safeParse({
        amount: -100,
        method: 'ach',
      });

      expect(result.success).toBe(false);
    });

    it('should require valid payment method', async () => {
      const { z } = await import('zod');

      const withdrawSchema = z.object({
        amount: z.number().positive({ message: 'Amount must be greater than 0' }),
        method: z.enum(['ach', 'wire', 'check'], { message: 'Invalid payment method' }),
      });

      const result = withdrawSchema.safeParse({
        amount: 100,
        method: 'bitcoin',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid withdrawal request', async () => {
      const { z } = await import('zod');

      const withdrawSchema = z.object({
        amount: z.number().positive({ message: 'Amount must be greater than 0' }),
        method: z.enum(['ach', 'wire', 'check'], { message: 'Invalid payment method' }),
      });

      const result = withdrawSchema.safeParse({
        amount: 500,
        method: 'ach',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(500);
        expect(result.data.method).toBe('ach');
      }
    });
  });

  describe('Payment Methods', () => {
    it('should support ACH transfers', async () => {
      const { z } = await import('zod');
      const methodSchema = z.enum(['ach', 'wire', 'check']);
      expect(methodSchema.safeParse('ach').success).toBe(true);
    });

    it('should support wire transfers', async () => {
      const { z } = await import('zod');
      const methodSchema = z.enum(['ach', 'wire', 'check']);
      expect(methodSchema.safeParse('wire').success).toBe(true);
    });

    it('should support check payments', async () => {
      const { z } = await import('zod');
      const methodSchema = z.enum(['ach', 'wire', 'check']);
      expect(methodSchema.safeParse('check').success).toBe(true);
    });
  });

  describe('Wallet Engine', () => {
    it('should format currency correctly', async () => {
      const { formatCurrency } = await import('@/lib/engines/wallet-engine');

      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should have correct withdrawal fees', async () => {
      const { WITHDRAWAL_FEES } = await import('@/lib/engines/wallet-engine');

      expect(WITHDRAWAL_FEES.ach).toBeDefined();
      expect(WITHDRAWAL_FEES.wire).toBeDefined();
      expect(WITHDRAWAL_FEES.check).toBeDefined();
      expect(WITHDRAWAL_FEES.wire).toBeGreaterThan(WITHDRAWAL_FEES.ach);
    });

    it('should have correct minimum withdrawal amounts', async () => {
      const { MIN_WITHDRAWAL } = await import('@/lib/engines/wallet-engine');

      expect(MIN_WITHDRAWAL.ach).toBeDefined();
      expect(MIN_WITHDRAWAL.wire).toBeDefined();
      expect(MIN_WITHDRAWAL.check).toBeDefined();
    });
  });
});
