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

    it('should calculate net withdrawal correctly', async () => {
      const { calculateNetWithdrawal, WITHDRAWAL_FEES } = await import('@/lib/engines/wallet-engine');

      const achResult = calculateNetWithdrawal(100, 'ach');
      expect(achResult.gross).toBe(100);
      expect(achResult.fee).toBe(WITHDRAWAL_FEES.ach);
      expect(achResult.net).toBe(100 - WITHDRAWAL_FEES.ach);

      const wireResult = calculateNetWithdrawal(500, 'wire');
      expect(wireResult.gross).toBe(500);
      expect(wireResult.fee).toBe(WITHDRAWAL_FEES.wire);
      expect(wireResult.net).toBe(500 - WITHDRAWAL_FEES.wire);

      const checkResult = calculateNetWithdrawal(200, 'check');
      expect(checkResult.gross).toBe(200);
      expect(checkResult.fee).toBe(WITHDRAWAL_FEES.check);
      expect(checkResult.net).toBe(200 - WITHDRAWAL_FEES.check);
    });

    it('should validate withdrawal against balance', async () => {
      const { validateWithdrawal, MIN_WITHDRAWAL } = await import('@/lib/engines/wallet-engine');

      const wallet = {
        id: 'test-wallet',
        agent_id: 'test-agent',
        balance: 500,
        pending_balance: 0,
        lifetime_earnings: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Valid withdrawal
      const validResult = validateWithdrawal(wallet, { amount: 100, method: 'ach' });
      expect(validResult.valid).toBe(true);

      // Insufficient balance
      const insufficientResult = validateWithdrawal(wallet, { amount: 1000, method: 'ach' });
      expect(insufficientResult.valid).toBe(false);
      expect(insufficientResult.error).toContain('Insufficient balance');

      // Below minimum
      const belowMinResult = validateWithdrawal(wallet, { amount: MIN_WITHDRAWAL.ach - 1, method: 'ach' });
      expect(belowMinResult.valid).toBe(false);
      expect(belowMinResult.error).toContain('Minimum withdrawal');
    });

    it('should create payout record correctly', async () => {
      const { createPayoutRecord, WITHDRAWAL_FEES } = await import('@/lib/engines/wallet-engine');

      const payout = createPayoutRecord('agent-123', { amount: 500, method: 'wire' });

      expect(payout.agent_id).toBe('agent-123');
      expect(payout.amount).toBe(500);
      expect(payout.method).toBe('wire');
      expect(payout.fee).toBe(WITHDRAWAL_FEES.wire);
      expect(payout.net_amount).toBe(500 - WITHDRAWAL_FEES.wire);
      expect(payout.status).toBe('pending');
    });

    it('should create withdrawal transaction correctly', async () => {
      const { createWithdrawalTransaction, WITHDRAWAL_FEES } = await import('@/lib/engines/wallet-engine');

      const wallet = {
        id: 'test-wallet',
        agent_id: 'test-agent',
        balance: 1000,
        pending_balance: 0,
        lifetime_earnings: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const transaction = createWithdrawalTransaction('agent-123', wallet, { amount: 500, method: 'ach' });

      expect(transaction.agent_id).toBe('agent-123');
      expect(transaction.type).toBe('debit');
      expect(transaction.category).toBe('withdrawal');
      expect(transaction.amount).toBe(500);
      expect(transaction.balance_after).toBe(500); // 1000 - 500
      expect(transaction.description).toContain('ACH');
      expect(transaction.description).toContain(`Fee: $${WITHDRAWAL_FEES.ach}`);
    });
  });

  describe('Withdrawal Limits', () => {
    it('should have correct default limits', async () => {
      const { DEFAULT_LIMITS } = await import('@/lib/services/withdrawal-limits');

      expect(DEFAULT_LIMITS.daily_limit).toBe(2500);
      expect(DEFAULT_LIMITS.weekly_limit).toBe(10000);
      expect(DEFAULT_LIMITS.monthly_limit).toBe(50000);
      expect(DEFAULT_LIMITS.per_transaction_limit).toBe(10000);
      expect(DEFAULT_LIMITS.min_account_age_days).toBe(7);
      expect(DEFAULT_LIMITS.first_withdrawal_hold_hours).toBe(48);
      expect(DEFAULT_LIMITS.max_withdrawals_per_day).toBe(3);
      expect(DEFAULT_LIMITS.max_withdrawals_per_week).toBe(10);
    });
  });

  describe('Banking Info Validation', () => {
    it('should validate routing number format', async () => {
      const { z } = await import('zod');

      const routingSchema = z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits');

      // Valid routing numbers
      expect(routingSchema.safeParse('123456789').success).toBe(true);
      expect(routingSchema.safeParse('021000021').success).toBe(true);

      // Invalid routing numbers
      expect(routingSchema.safeParse('12345678').success).toBe(false); // Too short
      expect(routingSchema.safeParse('1234567890').success).toBe(false); // Too long
      expect(routingSchema.safeParse('12345678a').success).toBe(false); // Contains letter
    });

    it('should validate ZIP code format', async () => {
      const { z } = await import('zod');

      const zipSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code');

      // Valid ZIP codes
      expect(zipSchema.safeParse('12345').success).toBe(true);
      expect(zipSchema.safeParse('12345-6789').success).toBe(true);

      // Invalid ZIP codes
      expect(zipSchema.safeParse('1234').success).toBe(false);
      expect(zipSchema.safeParse('123456').success).toBe(false);
      expect(zipSchema.safeParse('12345-678').success).toBe(false);
      expect(zipSchema.safeParse('abcde').success).toBe(false);
    });

    it('should validate account number length', async () => {
      const { z } = await import('zod');

      const accountSchema = z.string().min(4).max(17);

      // Valid account numbers
      expect(accountSchema.safeParse('1234').success).toBe(true);
      expect(accountSchema.safeParse('12345678901234567').success).toBe(true);

      // Invalid account numbers
      expect(accountSchema.safeParse('123').success).toBe(false); // Too short
      expect(accountSchema.safeParse('123456789012345678').success).toBe(false); // Too long
    });

    it('should validate account type', async () => {
      const { z } = await import('zod');

      const accountTypeSchema = z.enum(['checking', 'savings']);

      expect(accountTypeSchema.safeParse('checking').success).toBe(true);
      expect(accountTypeSchema.safeParse('savings').success).toBe(true);
      expect(accountTypeSchema.safeParse('money_market').success).toBe(false);
    });

    it('should validate state code', async () => {
      const { z } = await import('zod');

      const stateSchema = z.string().length(2, 'State must be 2 letter code');

      expect(stateSchema.safeParse('CA').success).toBe(true);
      expect(stateSchema.safeParse('TX').success).toBe(true);
      expect(stateSchema.safeParse('CAL').success).toBe(false);
      expect(stateSchema.safeParse('C').success).toBe(false);
    });
  });

  describe('Wallet Balance Calculations', () => {
    it('should calculate total balance correctly', async () => {
      const { getWalletBalance } = await import('@/lib/engines/wallet-engine');

      const wallet = {
        id: 'test-wallet',
        agent_id: 'test-agent',
        balance: 500,
        pending_balance: 200,
        lifetime_earnings: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const balance = getWalletBalance(wallet);

      expect(balance.available).toBe(500);
      expect(balance.pending).toBe(200);
      expect(balance.total).toBe(700);
      expect(balance.lifetimeEarnings).toBe(5000);
    });

    it('should calculate credit updates correctly', async () => {
      const { calculateCreditUpdate } = await import('@/lib/engines/wallet-engine');

      const wallet = {
        id: 'test-wallet',
        agent_id: 'test-agent',
        balance: 500,
        pending_balance: 100,
        lifetime_earnings: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Available credit
      const availableUpdate = calculateCreditUpdate(wallet, 200, false);
      expect(availableUpdate.balance).toBe(700);
      expect(availableUpdate.lifetime_earnings).toBe(1200);

      // Pending credit
      const pendingUpdate = calculateCreditUpdate(wallet, 200, true);
      expect(pendingUpdate.pending_balance).toBe(300);
    });

    it('should calculate pending to available correctly', async () => {
      const { calculatePendingToAvailable } = await import('@/lib/engines/wallet-engine');

      const wallet = {
        id: 'test-wallet',
        agent_id: 'test-agent',
        balance: 500,
        pending_balance: 300,
        lifetime_earnings: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const update = calculatePendingToAvailable(wallet, 200);
      expect(update.pending_balance).toBe(100);
      expect(update.balance).toBe(700);
    });
  });
});
