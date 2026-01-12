/**
 * Wallet Engine
 * Single source of truth for all wallet/balance operations
 */

import { Wallet, WalletTransaction, Payout } from '../types/database';

export type TransactionCategory =
  | 'commission'
  | 'override'
  | 'bonus'
  | 'withdrawal'
  | 'adjustment';

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  lifetimeEarnings: number;
}

export interface WithdrawalRequest {
  amount: number;
  method: 'ach' | 'wire' | 'check';
}

export interface WithdrawalResult {
  success: boolean;
  netAmount: number;
  fee: number;
  error?: string;
}

// Withdrawal fees
export const WITHDRAWAL_FEES = {
  ach: 0,
  wire: 25,
  check: 5,
} as const;

// Minimum withdrawal amounts
export const MIN_WITHDRAWAL = {
  ach: 25,
  wire: 100,
  check: 50,
} as const;

/**
 * Get wallet balance summary
 */
export function getWalletBalance(wallet: Wallet): WalletBalance {
  return {
    available: wallet.balance,
    pending: wallet.pending_balance,
    total: wallet.balance + wallet.pending_balance,
    lifetimeEarnings: wallet.lifetime_earnings,
  };
}

/**
 * Calculate withdrawal fee
 */
export function calculateWithdrawalFee(
  method: 'ach' | 'wire' | 'check'
): number {
  return WITHDRAWAL_FEES[method];
}

/**
 * Calculate net withdrawal amount after fees
 */
export function calculateNetWithdrawal(
  amount: number,
  method: 'ach' | 'wire' | 'check'
): { gross: number; fee: number; net: number } {
  const fee = WITHDRAWAL_FEES[method];
  return {
    gross: amount,
    fee,
    net: amount - fee,
  };
}

/**
 * Validate withdrawal request
 */
export function validateWithdrawal(
  wallet: Wallet,
  request: WithdrawalRequest
): { valid: boolean; error?: string } {
  const { amount, method } = request;
  const minAmount = MIN_WITHDRAWAL[method];
  const fee = WITHDRAWAL_FEES[method];

  // Check minimum amount
  if (amount < minAmount) {
    return {
      valid: false,
      error: `Minimum withdrawal for ${method.toUpperCase()} is $${minAmount}`,
    };
  }

  // Check sufficient balance
  if (amount > wallet.balance) {
    return {
      valid: false,
      error: `Insufficient balance. Available: $${wallet.balance.toFixed(2)}`,
    };
  }

  // Check if net amount is positive
  const net = amount - fee;
  if (net <= 0) {
    return {
      valid: false,
      error: `Amount must be greater than $${fee} fee`,
    };
  }

  return { valid: true };
}

/**
 * Create withdrawal transaction record
 */
export function createWithdrawalTransaction(
  agentId: string,
  wallet: Wallet,
  request: WithdrawalRequest
): Omit<WalletTransaction, 'id' | 'created_at'> {
  const fee = WITHDRAWAL_FEES[request.method];
  const newBalance = wallet.balance - request.amount;

  return {
    agent_id: agentId,
    type: 'debit',
    category: 'withdrawal',
    amount: request.amount,
    balance_after: newBalance,
    description: `Withdrawal via ${request.method.toUpperCase()} (Fee: $${fee})`,
    reference_type: 'payout',
    reference_id: null, // Will be set after payout record created
  };
}

/**
 * Create credit transaction record
 */
export function createCreditTransaction(
  agentId: string,
  currentBalance: number,
  amount: number,
  category: TransactionCategory,
  description: string,
  referenceType?: string,
  referenceId?: string
): Omit<WalletTransaction, 'id' | 'created_at'> {
  return {
    agent_id: agentId,
    type: 'credit',
    category,
    amount,
    balance_after: currentBalance + amount,
    description,
    reference_type: referenceType ?? null,
    reference_id: referenceId ?? null,
  };
}

/**
 * Create payout record
 */
export function createPayoutRecord(
  agentId: string,
  request: WithdrawalRequest
): Omit<Payout, 'id' | 'created_at'> {
  const fee = WITHDRAWAL_FEES[request.method];

  return {
    agent_id: agentId,
    amount: request.amount,
    method: request.method,
    fee,
    net_amount: request.amount - fee,
    status: 'pending',
    processed_at: null,
  };
}

/**
 * Calculate wallet updates after a credit
 */
export function calculateCreditUpdate(
  wallet: Wallet,
  amount: number,
  isPending: boolean
): Partial<Wallet> {
  if (isPending) {
    return {
      pending_balance: wallet.pending_balance + amount,
    };
  }

  return {
    balance: wallet.balance + amount,
    lifetime_earnings: wallet.lifetime_earnings + amount,
  };
}

/**
 * Calculate wallet updates when pending becomes available
 */
export function calculatePendingToAvailable(
  wallet: Wallet,
  amount: number
): Partial<Wallet> {
  return {
    pending_balance: wallet.pending_balance - amount,
    balance: wallet.balance + amount,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Group transactions by date for display
 */
export function groupTransactionsByDate(
  transactions: WalletTransaction[]
): Map<string, WalletTransaction[]> {
  const grouped = new Map<string, WalletTransaction[]>();

  for (const tx of transactions) {
    const date = new Date(tx.created_at).toLocaleDateString();
    const existing = grouped.get(date) || [];
    existing.push(tx);
    grouped.set(date, existing);
  }

  return grouped;
}

/**
 * Calculate earnings by category
 */
export function calculateEarningsByCategory(
  transactions: WalletTransaction[]
): Record<TransactionCategory, number> {
  const result: Record<TransactionCategory, number> = {
    commission: 0,
    override: 0,
    bonus: 0,
    withdrawal: 0,
    adjustment: 0,
  };

  for (const tx of transactions) {
    if (tx.type === 'credit') {
      result[tx.category] += tx.amount;
    }
  }

  return result;
}
