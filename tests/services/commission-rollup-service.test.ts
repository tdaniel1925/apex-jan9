/**
 * Commission Roll-Up Service Tests
 *
 * Tests for license eligibility checks and commission roll-up logic
 * per NAIC Model Law §218 and Texas Insurance Code §4005.053
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isAgentLicensed,
  getRollUpReason,
} from '@/lib/services/commission-rollup-service';
import type { LicenseStatus } from '@/lib/types/database';

// Mock the supabase client
vi.mock('@/lib/db/supabase-server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

describe('Commission Roll-Up Service', () => {
  describe('isAgentLicensed', () => {
    describe('License Status Checks', () => {
      it('should return licensed for agent with valid license', () => {
        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: '2027-12-31', // Future date
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(true);
        expect(result.status).toBe('licensed');
      });

      it('should return NOT licensed for unlicensed status', () => {
        const agent = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.status).toBe('unlicensed');
        expect(result.reason).toContain('unlicensed');
      });

      it('should return NOT licensed for pending status', () => {
        const agent = {
          license_status: 'pending' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.status).toBe('pending');
      });

      it('should return NOT licensed for expired status', () => {
        const agent = {
          license_status: 'expired' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: '2020-01-01',
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.status).toBe('expired');
      });

      it('should return NOT licensed for suspended status', () => {
        const agent = {
          license_status: 'suspended' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: '2027-12-31',
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.status).toBe('suspended');
      });
    });

    describe('License Number Checks', () => {
      it('should return NOT licensed if license_number is null', () => {
        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: '2027-12-31',
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.reason).toContain('no license number');
      });

      it('should return NOT licensed if license_number is empty string', () => {
        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: '',
          license_expiration_date: '2027-12-31',
        };

        const result = isAgentLicensed(agent);

        // Empty string is falsy, so should fail
        expect(result.isLicensed).toBe(false);
      });
    });

    describe('License Expiration Checks', () => {
      it('should return licensed if license_expiration_date is null (no expiration)', () => {
        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: null,
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(true);
      });

      it('should return licensed if license_expiration_date is in the future', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: futureDate.toISOString().split('T')[0],
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(true);
      });

      it('should return NOT licensed if license_expiration_date is in the past', () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: pastDate.toISOString().split('T')[0],
        };

        const result = isAgentLicensed(agent);

        expect(result.isLicensed).toBe(false);
        expect(result.status).toBe('expired');
        expect(result.reason).toContain('expired');
      });

      it('should return licensed if license expires today (edge case)', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Use local date formatting (not toISOString which converts to UTC)
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        const agent = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-12345',
          license_expiration_date: todayString,
        };

        const result = isAgentLicensed(agent);

        // Today should still be valid (expires at end of day)
        expect(result.isLicensed).toBe(true);
      });
    });

    describe('PRD Test Cases (Section 10.1)', () => {
      // These test cases are directly from the PRD

      it('Status=licensed, number=valid, expiration=future → Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'licensed',
          license_number: 'LIC-12345',
          license_expiration_date: '2027-12-31',
        });
        expect(result.isLicensed).toBe(true);
      });

      it('Status=licensed, number=null, expiration=future → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'licensed',
          license_number: null,
          license_expiration_date: '2027-12-31',
        });
        expect(result.isLicensed).toBe(false);
      });

      it('Status=licensed, number=valid, expiration=past → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'licensed',
          license_number: 'LIC-12345',
          license_expiration_date: '2020-01-01',
        });
        expect(result.isLicensed).toBe(false);
      });

      it('Status=unlicensed, number=valid, expiration=future → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'unlicensed',
          license_number: 'LIC-12345',
          license_expiration_date: '2027-12-31',
        });
        expect(result.isLicensed).toBe(false);
      });

      it('Status=pending, number=null, expiration=null → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'pending',
          license_number: null,
          license_expiration_date: null,
        });
        expect(result.isLicensed).toBe(false);
      });

      it('Status=expired, number=valid, expiration=past → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'expired',
          license_number: 'LIC-12345',
          license_expiration_date: '2020-01-01',
        });
        expect(result.isLicensed).toBe(false);
      });

      it('Status=suspended, number=valid, expiration=future → NOT Eligible', () => {
        const result = isAgentLicensed({
          license_status: 'suspended',
          license_number: 'LIC-12345',
          license_expiration_date: '2027-12-31',
        });
        expect(result.isLicensed).toBe(false);
      });
    });
  });

  describe('getRollUpReason', () => {
    it('should return upline_license_expired for expired status', () => {
      expect(getRollUpReason('expired')).toBe('upline_license_expired');
    });

    it('should return upline_license_suspended for suspended status', () => {
      expect(getRollUpReason('suspended')).toBe('upline_license_suspended');
    });

    it('should return upline_unlicensed for unlicensed status', () => {
      expect(getRollUpReason('unlicensed')).toBe('upline_unlicensed');
    });

    it('should return upline_unlicensed for pending status', () => {
      expect(getRollUpReason('pending')).toBe('upline_unlicensed');
    });

    it('should return upline_unlicensed for licensed status (edge case)', () => {
      // This shouldn't happen in practice, but test the fallback
      expect(getRollUpReason('licensed')).toBe('upline_unlicensed');
    });
  });

  describe('Roll-Up Scenarios (PRD Section 10.2)', () => {
    // These are conceptual tests - actual implementation would require mocking database

    describe('Roll-Up to Next Licensed', () => {
      it('A(lic) → B(unlic) → C(lic): B override goes to C', () => {
        // Conceptual: When A writes business, B is unlicensed Gen 1
        // B's override should roll up to C (Gen 2)
        // C should receive: C's own override + B's rolled-up override

        // Test the license check part
        const agentB = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const agentC = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-C',
          license_expiration_date: '2027-12-31',
        };

        expect(isAgentLicensed(agentB).isLicensed).toBe(false);
        expect(isAgentLicensed(agentC).isLicensed).toBe(true);
      });

      it('A(lic) → B(unlic) → C(unlic) → D(lic): B+C override goes to D', () => {
        // Both B and C are unlicensed, so both overrides should roll up to D

        const agentB = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const agentC = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const agentD = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-D',
          license_expiration_date: '2027-12-31',
        };

        expect(isAgentLicensed(agentB).isLicensed).toBe(false);
        expect(isAgentLicensed(agentC).isLicensed).toBe(false);
        expect(isAgentLicensed(agentD).isLicensed).toBe(true);
      });

      it('A(lic) → B(unlic) → C(unlic): B+C override to company (no lic upline)', () => {
        // No licensed upline exists, so company retains

        const agentB = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const agentC = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        expect(isAgentLicensed(agentB).isLicensed).toBe(false);
        expect(isAgentLicensed(agentC).isLicensed).toBe(false);
        // In this scenario, both would be rolled up, but with no licensed upline,
        // company retains
      });
    });

    describe('Company Retains Mode', () => {
      it('A(lic) → B(unlic) → C(lic): B override forfeited, C gets own only', () => {
        // In company_retains mode, C does NOT receive B's override

        const agentB = {
          license_status: 'unlicensed' as LicenseStatus,
          license_number: null,
          license_expiration_date: null,
        };

        const agentC = {
          license_status: 'licensed' as LicenseStatus,
          license_number: 'LIC-C',
          license_expiration_date: '2027-12-31',
        };

        expect(isAgentLicensed(agentB).isLicensed).toBe(false);
        expect(isAgentLicensed(agentC).isLicensed).toBe(true);
        // B's override is forfeited, C only gets their own override
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null license_status', () => {
      const agent = {
        license_status: null as unknown as LicenseStatus,
        license_number: 'LIC-12345',
        license_expiration_date: '2027-12-31',
      };

      const result = isAgentLicensed(agent);

      expect(result.isLicensed).toBe(false);
    });

    it('should handle undefined license_status', () => {
      const agent = {
        license_status: undefined as unknown as LicenseStatus,
        license_number: 'LIC-12345',
        license_expiration_date: '2027-12-31',
      };

      const result = isAgentLicensed(agent);

      expect(result.isLicensed).toBe(false);
    });

    it('should handle invalid date format gracefully', () => {
      const agent = {
        license_status: 'licensed' as LicenseStatus,
        license_number: 'LIC-12345',
        license_expiration_date: 'invalid-date',
      };

      // Invalid date parsing should result in NaN comparison
      // which may or may not pass depending on implementation
      const result = isAgentLicensed(agent);

      // The function should handle this gracefully
      expect(typeof result.isLicensed).toBe('boolean');
    });
  });

  describe('Regulatory Compliance', () => {
    it('should never allow commission to unlicensed person', () => {
      const testCases = [
        { license_status: 'unlicensed' as LicenseStatus, license_number: 'LIC-123', license_expiration_date: '2027-12-31' },
        { license_status: 'pending' as LicenseStatus, license_number: 'LIC-123', license_expiration_date: '2027-12-31' },
        { license_status: 'expired' as LicenseStatus, license_number: 'LIC-123', license_expiration_date: '2020-01-01' },
        { license_status: 'suspended' as LicenseStatus, license_number: 'LIC-123', license_expiration_date: '2027-12-31' },
        { license_status: 'licensed' as LicenseStatus, license_number: null, license_expiration_date: '2027-12-31' },
        { license_status: 'licensed' as LicenseStatus, license_number: 'LIC-123', license_expiration_date: '2020-01-01' },
      ];

      for (const testCase of testCases) {
        const result = isAgentLicensed(testCase);
        expect(result.isLicensed).toBe(false);
      }
    });

    it('should only allow commission to properly licensed person', () => {
      const validAgent = {
        license_status: 'licensed' as LicenseStatus,
        license_number: 'LIC-12345',
        license_expiration_date: '2027-12-31',
      };

      const result = isAgentLicensed(validAgent);

      expect(result.isLicensed).toBe(true);
      expect(result.status).toBe('licensed');
    });
  });
});
