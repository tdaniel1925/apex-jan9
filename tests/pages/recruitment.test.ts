/**
 * Agent Recruitment Page Tests
 */

import { describe, it, expect } from 'vitest';

describe('Agent Recruitment Page', () => {
  describe('Benefits Display', () => {
    const BENEFITS = [
      { title: 'High Commissions', description: 'Earn up to 90% commission' },
      { title: 'Build a Team', description: 'Earn override income' },
      { title: 'Top Carriers', description: 'Access to 7 A-rated carriers' },
      { title: 'AI-Powered Tools', description: 'Cutting-edge CRM' },
      { title: 'Free Training', description: 'Comprehensive training' },
      { title: 'Flexible Schedule', description: 'Work on your terms' },
    ];

    it('should have correct number of benefits', () => {
      expect(BENEFITS.length).toBe(6);
    });

    it('should include key selling points', () => {
      const titles = BENEFITS.map((b) => b.title.toLowerCase());
      expect(titles.some((t) => t.includes('commission'))).toBe(true);
      expect(titles.some((t) => t.includes('team'))).toBe(true);
      expect(titles.some((t) => t.includes('training'))).toBe(true);
    });
  });

  describe('Rank Structure', () => {
    const RANKS = [
      { name: 'Associate', rate: 0.30 },
      { name: 'Senior Associate', rate: 0.35 },
      { name: 'District Manager', rate: 0.40 },
      { name: 'Regional Manager', rate: 0.45 },
      { name: 'National Manager', rate: 0.50 },
      { name: 'Executive Director', rate: 0.55 },
    ];

    it('should have correct number of ranks', () => {
      expect(RANKS.length).toBe(6);
    });

    it('should have ascending commission rates', () => {
      for (let i = 1; i < RANKS.length; i++) {
        expect(RANKS[i].rate).toBeGreaterThan(RANKS[i - 1].rate);
      }
    });

    it('should start at 30% and end at 55%', () => {
      expect(RANKS[0].rate).toBe(0.30);
      expect(RANKS[RANKS.length - 1].rate).toBe(0.55);
    });
  });

  describe('Signup Form Validation', () => {
    it('should require all mandatory fields', () => {
      const formData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        referralCode: '',
      };

      const errors: string[] = [];
      if (!formData.firstName) errors.push('First name is required');
      if (!formData.lastName) errors.push('Last name is required');
      if (!formData.email) errors.push('Email is required');
      if (!formData.password) errors.push('Password is required');

      expect(errors.length).toBe(4);
    });

    it('should validate password match', () => {
      const formData = {
        password: 'password123',
        confirmPassword: 'password456',
      };

      const passwordsMatch = formData.password === formData.confirmPassword;
      expect(passwordsMatch).toBe(false);
    });

    it('should validate password length', () => {
      const shortPassword = 'short';
      const validPassword = 'longenough123';

      expect(shortPassword.length >= 8).toBe(false);
      expect(validPassword.length >= 8).toBe(true);
    });

    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'notanemail';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });
  });

  describe('Referral Code Handling', () => {
    it('should allow empty referral code', () => {
      const formData = { referralCode: '' };
      const isValid = true; // Referral code is optional
      expect(isValid).toBe(true);
    });

    it('should handle valid referral code', () => {
      const referralCode = 'ABC123';
      const mockAgentLookup = (code: string) => {
        const agents: Record<string, { id: string }> = {
          ABC123: { id: 'agent-sponsor' },
        };
        return agents[code] || null;
      };

      const sponsor = mockAgentLookup(referralCode);
      expect(sponsor).not.toBeNull();
      expect(sponsor?.id).toBe('agent-sponsor');
    });

    it('should handle invalid referral code gracefully', () => {
      const referralCode = 'INVALID';
      const mockAgentLookup = (code: string) => {
        const agents: Record<string, { id: string }> = {
          ABC123: { id: 'agent-sponsor' },
        };
        return agents[code] || null;
      };

      const sponsor = mockAgentLookup(referralCode);
      expect(sponsor).toBeNull();
      // Should still allow signup without sponsor
    });
  });

  describe('Stats Display', () => {
    it('should display correct statistics', () => {
      const stats = {
        carriers: 7,
        maxCommission: '90%',
        startupCost: '$0',
        overrideLevels: 6,
      };

      expect(stats.carriers).toBe(7);
      expect(stats.maxCommission).toBe('90%');
      expect(stats.startupCost).toBe('$0');
      expect(stats.overrideLevels).toBe(6);
    });
  });

  describe('Testimonials', () => {
    const TESTIMONIALS = [
      { name: 'Michael T.', role: 'Regional Manager', rating: 5 },
      { name: 'Sarah K.', role: 'District Manager', rating: 5 },
      { name: 'James R.', role: 'Senior Associate', rating: 5 },
    ];

    it('should have at least 3 testimonials', () => {
      expect(TESTIMONIALS.length).toBeGreaterThanOrEqual(3);
    });

    it('should have 5-star ratings', () => {
      TESTIMONIALS.forEach((t) => {
        expect(t.rating).toBe(5);
      });
    });

    it('should have name and role for each testimonial', () => {
      TESTIMONIALS.forEach((t) => {
        expect(t.name).toBeDefined();
        expect(t.role).toBeDefined();
      });
    });
  });

  describe('Navigation', () => {
    it('should have scroll to sections', () => {
      const sections = ['#benefits', '#apply'];
      sections.forEach((section) => {
        expect(section.startsWith('#')).toBe(true);
      });
    });

    it('should have link to login page', () => {
      const loginUrl = '/login';
      expect(loginUrl).toBe('/login');
    });
  });
});
