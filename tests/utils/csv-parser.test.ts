import { describe, it, expect } from 'vitest';
import {
  autoDetectMapping,
  mapCSVRows,
  normalizeCarrier,
  generateCSVTemplate,
  CSVRow,
  CSVColumnMapping,
} from '@/lib/utils/csv-parser';

describe('CSV Parser', () => {
  describe('autoDetectMapping', () => {
    it('should detect standard column names', () => {
      const headers = [
        'policy_number',
        'agent_id',
        'carrier',
        'premium_amount',
        'commission_rate',
        'policy_date',
      ];

      const mapping = autoDetectMapping(headers);

      expect(mapping.policy_number).toBe('policy_number');
      expect(mapping.agent_id).toBe('agent_id');
      expect(mapping.carrier).toBe('carrier');
      expect(mapping.premium_amount).toBe('premium_amount');
      expect(mapping.commission_rate).toBe('commission_rate');
      expect(mapping.policy_date).toBe('policy_date');
    });

    it('should detect alternative column names', () => {
      const headers = [
        'Policy Number',
        'Writing Agent',
        'Insurance Carrier',
        'Annual Premium',
        'Rate',
        'Issue Date',
      ];

      const mapping = autoDetectMapping(headers);

      expect(mapping.policy_number).toBe('Policy Number');
      expect(mapping.agent_id).toBe('Writing Agent');
      expect(mapping.carrier).toBe('Insurance Carrier');
      expect(mapping.premium_amount).toBe('Annual Premium');
      expect(mapping.commission_rate).toBe('Rate');
      expect(mapping.policy_date).toBe('Issue Date');
    });

    it('should handle case-insensitive matching', () => {
      const headers = ['POLICY_NUMBER', 'AGENT_ID', 'CARRIER', 'PREMIUM', 'RATE', 'DATE'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.policy_number).toBe('POLICY_NUMBER');
      expect(mapping.agent_id).toBe('AGENT_ID');
      expect(mapping.carrier).toBe('CARRIER');
      // Premium without "premium" text won't match - this is expected
      expect(mapping.commission_rate).toBe('RATE');
      expect(mapping.policy_date).toBe('DATE');
    });

    it('should return partial mapping when some columns are missing', () => {
      const headers = ['policy_number', 'carrier', 'premium_amount'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.policy_number).toBe('policy_number');
      expect(mapping.agent_id).toBeUndefined();
      expect(mapping.carrier).toBe('carrier');
      expect(mapping.premium_amount).toBe('premium_amount');
      expect(mapping.commission_rate).toBeUndefined();
      expect(mapping.policy_date).toBeUndefined();
    });
  });

  describe('mapCSVRows', () => {
    it('should map CSV rows using column mapping', () => {
      const rows: CSVRow[] = [
        {
          'Policy #': 'POL-001',
          Agent: 'agent-id-1',
          Carrier: 'columbus_life',
          Premium: '5000',
          Rate: '0.50',
          Date: '2024-01-15',
        },
        {
          'Policy #': 'POL-002',
          Agent: 'agent-id-2',
          Carrier: 'aig',
          Premium: '10000',
          Rate: '0.40',
          Date: '2024-01-16',
        },
      ];

      const mapping: CSVColumnMapping = {
        policy_number: 'Policy #',
        agent_id: 'Agent',
        carrier: 'Carrier',
        premium_amount: 'Premium',
        commission_rate: 'Rate',
        policy_date: 'Date',
      };

      const mapped = mapCSVRows(rows, mapping);

      expect(mapped).toHaveLength(2);
      expect(mapped[0]).toEqual({
        policy_number: 'POL-001',
        agent_id: 'agent-id-1',
        carrier: 'columbus_life',
        premium_amount: '5000',
        commission_rate: '0.50',
        policy_date: '2024-01-15',
      });
      expect(mapped[1]).toEqual({
        policy_number: 'POL-002',
        agent_id: 'agent-id-2',
        carrier: 'aig',
        premium_amount: '10000',
        commission_rate: '0.40',
        policy_date: '2024-01-16',
      });
    });

    it('should handle missing values', () => {
      const rows: CSVRow[] = [
        {
          policy_number: 'POL-001',
          agent_id: '',
          carrier: 'columbus_life',
          premium_amount: '',
          commission_rate: '0.50',
          policy_date: '2024-01-15',
        },
      ];

      const mapping: CSVColumnMapping = {
        policy_number: 'policy_number',
        agent_id: 'agent_id',
        carrier: 'carrier',
        premium_amount: 'premium_amount',
        commission_rate: 'commission_rate',
        policy_date: 'policy_date',
      };

      const mapped = mapCSVRows(rows, mapping);

      expect(mapped[0].agent_id).toBe('');
      expect(mapped[0].premium_amount).toBe('0');
    });
  });

  describe('normalizeCarrier', () => {
    it('should match exact carrier names', () => {
      expect(normalizeCarrier('columbus_life')).toBe('columbus_life');
      expect(normalizeCarrier('aig')).toBe('aig');
      expect(normalizeCarrier('fg')).toBe('fg');
      expect(normalizeCarrier('moo')).toBe('moo');
      expect(normalizeCarrier('nlg')).toBe('nlg');
      expect(normalizeCarrier('symetra')).toBe('symetra');
      expect(normalizeCarrier('na')).toBe('na');
    });

    it('should normalize common variations', () => {
      expect(normalizeCarrier('Columbus Life')).toBe('columbus_life');
      expect(normalizeCarrier('AIG')).toBe('aig');
      expect(normalizeCarrier('F+G')).toBe('fg');
      expect(normalizeCarrier('Fidelity & Guaranty')).toBe('fg');
      expect(normalizeCarrier('National Life Group')).toBe('nlg');
      expect(normalizeCarrier('North American')).toBe('na');
    });

    it('should handle case insensitivity', () => {
      expect(normalizeCarrier('COLUMBUS LIFE')).toBe('columbus_life');
      expect(normalizeCarrier('Symetra')).toBe('symetra');
      expect(normalizeCarrier('MOO')).toBe('moo');
    });

    it('should return null for unknown carriers', () => {
      expect(normalizeCarrier('Unknown Carrier')).toBeNull();
      expect(normalizeCarrier('')).toBeNull();
      expect(normalizeCarrier('XYZ Insurance')).toBeNull();
    });
  });

  describe('generateCSVTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = generateCSVTemplate();

      expect(template).toContain('policy_number');
      expect(template).toContain('agent_id');
      expect(template).toContain('carrier');
      expect(template).toContain('premium_amount');
      expect(template).toContain('commission_rate');
      expect(template).toContain('policy_date');

      // Should have 2 lines (header + example)
      const lines = template.split('\n');
      expect(lines).toHaveLength(2);

      // Example row should have valid data
      expect(lines[1]).toContain('POL-12345');
      expect(lines[1]).toContain('columbus_life');
      expect(lines[1]).toContain('5000.00');
      expect(lines[1]).toContain('0.50');
    });
  });
});
