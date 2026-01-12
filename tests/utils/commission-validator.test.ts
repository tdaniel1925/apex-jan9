import { describe, it, expect } from 'vitest';
import {
  validateCommissionRow,
  validateCommissionRows,
  findDuplicatePolicyNumbers,
  generateErrorCSV,
  ParsedCommissionRow,
} from '@/lib/utils/commission-validator';

describe('Commission Validator', () => {
  describe('validateCommissionRow', () => {
    it('should validate a valid commission row', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing policy number', () => {
      const row: ParsedCommissionRow = {
        policy_number: '',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'policy_number')).toBe(true);
      expect(result.errors.find((e) => e.field === 'policy_number')?.message).toContain('required');
    });

    it('should reject short policy number', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'AB',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'policy_number')).toBe(true);
      expect(result.errors.find((e) => e.field === 'policy_number')?.message).toContain('too short');
    });

    it('should reject invalid agent ID format', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: 'not-a-uuid',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'agent_id')).toBe(true);
      expect(result.errors.find((e) => e.field === 'agent_id')?.message).toContain('valid UUID');
    });

    it('should reject invalid carrier', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'unknown_carrier',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'carrier')).toBe(true);
      expect(result.errors.find((e) => e.field === 'carrier')?.message).toContain('Invalid carrier');
    });

    it('should reject zero or negative premium amount', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '0',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'premium_amount')).toBe(true);
      expect(result.errors.find((e) => e.field === 'premium_amount')?.message).toContain('greater than zero');
    });

    it('should reject excessively large premium amount', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '20000000',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'premium_amount')).toBe(true);
      expect(result.errors.find((e) => e.field === 'premium_amount')?.message).toContain('exceeds maximum');
    });

    it('should reject invalid commission rate', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '1.5',
        policy_date: '2024-01-15',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'commission_rate')).toBe(true);
      expect(result.errors.find((e) => e.field === 'commission_rate')?.message).toContain('between 0 and 1');
    });

    it('should reject invalid date format', () => {
      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: 'not-a-date',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'policy_date')).toBe(true);
      expect(result.errors.find((e) => e.field === 'policy_date')?.message).toContain('valid date');
    });

    it('should reject dates too far in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: futureDate.toISOString().split('T')[0],
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'policy_date')).toBe(true);
      expect(result.errors.find((e) => e.field === 'policy_date')?.message).toContain('future');
    });

    it('should reject dates too far in the past', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 11);

      const row: ParsedCommissionRow = {
        policy_number: 'POL-12345',
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        carrier: 'columbus_life',
        premium_amount: '5000.00',
        commission_rate: '0.50',
        policy_date: pastDate.toISOString().split('T')[0],
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'policy_date')).toBe(true);
      expect(result.errors.find((e) => e.field === 'policy_date')?.message).toContain('past');
    });

    it('should collect multiple errors for a single row', () => {
      const row: ParsedCommissionRow = {
        policy_number: '',
        agent_id: 'not-a-uuid',
        carrier: 'unknown_carrier',
        premium_amount: '-100',
        commission_rate: '2.0',
        policy_date: 'invalid-date',
      };

      const result = validateCommissionRow(row, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
      expect(result.errors.some((e) => e.field === 'policy_number')).toBe(true);
      expect(result.errors.some((e) => e.field === 'agent_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'carrier')).toBe(true);
      expect(result.errors.some((e) => e.field === 'premium_amount')).toBe(true);
      expect(result.errors.some((e) => e.field === 'commission_rate')).toBe(true);
      expect(result.errors.some((e) => e.field === 'policy_date')).toBe(true);
    });
  });

  describe('validateCommissionRows', () => {
    it('should validate multiple rows and separate valid from invalid', () => {
      const rows: ParsedCommissionRow[] = [
        {
          policy_number: 'POL-001',
          agent_id: '550e8400-e29b-41d4-a716-446655440000',
          carrier: 'columbus_life',
          premium_amount: '5000.00',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
        {
          policy_number: '',
          agent_id: 'not-a-uuid',
          carrier: 'unknown',
          premium_amount: '0',
          commission_rate: '2.0',
          policy_date: 'bad-date',
        },
        {
          policy_number: 'POL-003',
          agent_id: '550e8400-e29b-41d4-a716-446655440001',
          carrier: 'aig',
          premium_amount: '10000.00',
          commission_rate: '0.40',
          policy_date: '2024-01-16',
        },
      ];

      const result = validateCommissionRows(rows);

      expect(result.totalRows).toBe(3);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(1);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });

    it('should generate error summary', () => {
      const rows: ParsedCommissionRow[] = [
        {
          policy_number: '',
          agent_id: '550e8400-e29b-41d4-a716-446655440000',
          carrier: 'columbus_life',
          premium_amount: '5000.00',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
        {
          policy_number: '',
          agent_id: 'not-a-uuid',
          carrier: 'columbus_life',
          premium_amount: '5000.00',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
      ];

      const result = validateCommissionRows(rows);

      expect(result.errorSummary.policy_number).toBe(2);
      expect(result.errorSummary.agent_id).toBe(1);
    });
  });

  describe('findDuplicatePolicyNumbers', () => {
    it('should find duplicate policy numbers', () => {
      const rows: ParsedCommissionRow[] = [
        {
          policy_number: 'POL-001',
          agent_id: '550e8400-e29b-41d4-a716-446655440000',
          carrier: 'columbus_life',
          premium_amount: '5000.00',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
        {
          policy_number: 'POL-002',
          agent_id: '550e8400-e29b-41d4-a716-446655440001',
          carrier: 'aig',
          premium_amount: '10000.00',
          commission_rate: '0.40',
          policy_date: '2024-01-16',
        },
        {
          policy_number: 'POL-001',
          agent_id: '550e8400-e29b-41d4-a716-446655440002',
          carrier: 'fg',
          premium_amount: '3000.00',
          commission_rate: '0.60',
          policy_date: '2024-01-17',
        },
      ];

      const duplicates = findDuplicatePolicyNumbers(rows);

      expect(duplicates.size).toBe(1);
      expect(duplicates.has('POL-001')).toBe(true);
      expect(duplicates.get('POL-001')).toEqual([1, 3]);
    });

    it('should return empty map when no duplicates', () => {
      const rows: ParsedCommissionRow[] = [
        {
          policy_number: 'POL-001',
          agent_id: '550e8400-e29b-41d4-a716-446655440000',
          carrier: 'columbus_life',
          premium_amount: '5000.00',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
        {
          policy_number: 'POL-002',
          agent_id: '550e8400-e29b-41d4-a716-446655440001',
          carrier: 'aig',
          premium_amount: '10000.00',
          commission_rate: '0.40',
          policy_date: '2024-01-16',
        },
      ];

      const duplicates = findDuplicatePolicyNumbers(rows);

      expect(duplicates.size).toBe(0);
    });
  });

  describe('generateErrorCSV', () => {
    it('should generate error CSV with all columns', () => {
      const invalidRows = [
        validateCommissionRow(
          {
            policy_number: '',
            agent_id: 'not-a-uuid',
            carrier: 'unknown',
            premium_amount: '0',
            commission_rate: '2.0',
            policy_date: 'bad-date',
          },
          1
        ),
      ];

      const csv = generateErrorCSV(invalidRows);

      expect(csv).toContain('Row');
      expect(csv).toContain('Policy Number');
      expect(csv).toContain('Agent ID');
      expect(csv).toContain('Carrier');
      expect(csv).toContain('Premium Amount');
      expect(csv).toContain('Commission Rate');
      expect(csv).toContain('Policy Date');
      expect(csv).toContain('Errors');

      // Should contain error messages
      expect(csv).toContain('policy_number');
      expect(csv).toContain('agent_id');
    });
  });
});
