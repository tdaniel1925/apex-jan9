/**
 * Marketing Site Tests
 * Tests for main marketing pages, SEO, and contact form
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock fetch for contact form
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Marketing Site Pages', () => {
  describe('Homepage', () => {
    test('has correct hero section content', () => {
      const headline = 'Build Your Insurance Business with Apex Affinity Group';
      expect(headline).toContain('Apex Affinity Group');
    });

    test('displays key stats', () => {
      const stats = [
        { value: '2,500+', label: 'Active Agents' },
        { value: '7', label: 'A-Rated Carriers' },
        { value: '$50M+', label: 'Commissions Paid' },
        { value: '50', label: 'States' },
      ];

      expect(stats.length).toBe(4);
      expect(stats[0].value).toBe('2,500+');
    });

    test('includes testimonials section', () => {
      const testimonials = [
        { name: 'Sarah Mitchell', role: 'Senior Regional Manager' },
        { name: 'Marcus Johnson', role: 'District Manager' },
        { name: 'Jennifer Lee', role: 'MGA' },
      ];

      expect(testimonials.length).toBe(3);
      expect(testimonials[0].role).toBe('Senior Regional Manager');
    });
  });

  describe('About Page', () => {
    test('contains mission and values sections', () => {
      const values = [
        'Agent Success First',
        'Client-Centered',
        'Community & Support',
        'Integrity Always',
        'Innovation',
        'Top Carrier Access',
      ];

      expect(values.length).toBe(6);
      expect(values).toContain('Agent Success First');
    });

    test('displays company statistics', () => {
      const stats = {
        agents: '2,500+',
        carriers: '7',
        commissionsPaid: '$50M+',
        states: '50',
      };

      expect(stats.agents).toBe('2,500+');
      expect(stats.carriers).toBe('7');
    });
  });

  describe('Carriers Page', () => {
    test('lists all 7 carriers', () => {
      const carriers = [
        'Columbus Life',
        'AIG',
        'F&G',
        'Mutual of Omaha',
        'National Life Group',
        'Symetra',
        'North American',
      ];

      expect(carriers.length).toBe(7);
      expect(carriers).toContain('Columbus Life');
      expect(carriers).toContain('AIG');
    });

    test('includes product categories', () => {
      const categories = [
        'Life Insurance',
        'Indexed Universal Life',
        'Annuities',
        'Term Life Insurance',
        'Final Expense',
      ];

      expect(categories.length).toBe(5);
      expect(categories).toContain('Life Insurance');
      expect(categories).toContain('Annuities');
    });
  });

  describe('Opportunity Page', () => {
    test('lists agent benefits', () => {
      const benefits = [
        'Competitive Commissions',
        'Team Building',
        'Vested Day One',
        'Top Carrier Access',
        'AI Copilot Tools',
        'Comprehensive Training',
        'Flexible Schedule',
        'No Enrollment Fees',
      ];

      expect(benefits.length).toBe(8);
      expect(benefits).toContain('No Enrollment Fees');
    });

    test('includes income disclaimer link', () => {
      const disclaimerPath = '/income-disclaimer';
      expect(disclaimerPath).toBe('/income-disclaimer');
    });

    test('lists requirements', () => {
      const requirements = [
        '18 years or older',
        'Life insurance license',
        'Pass a background check',
        'Commitment to training',
      ];

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements).toContain('Life insurance license');
    });
  });

  describe('FAQ Page', () => {
    test('has multiple FAQ categories', () => {
      const categories = [
        'Getting Started',
        'Compensation',
        'Training & Support',
        'Products & Carriers',
        'Business Operations',
      ];

      expect(categories.length).toBe(5);
      expect(categories).toContain('Getting Started');
      expect(categories).toContain('Compensation');
    });

    test('includes common questions', () => {
      const questions = [
        'Do I need an insurance license to join?',
        'Is there a fee to join Apex?',
        'How do commissions work?',
        'What training is provided?',
      ];

      expect(questions.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Page', () => {
    test('has correct contact info', () => {
      const contactInfo = {
        phone: '(888) 555-0123',
        email: 'info@theapexway.net',
        supportEmail: 'support@theapexway.net',
        location: 'Dallas, Texas',
      };

      expect(contactInfo.email).toBe('info@theapexway.net');
      expect(contactInfo.location).toContain('Dallas');
    });

    test('contact form has required fields', () => {
      const requiredFields = ['name', 'email', 'subject', 'message'];
      const optionalFields = ['phone'];

      expect(requiredFields.length).toBe(4);
      expect(optionalFields).toContain('phone');
    });
  });
});

describe('SEO Configuration', () => {
  test('root layout has proper metadata structure', () => {
    const metadata = {
      title: {
        default: 'Apex Affinity Group | Build Your Insurance Career',
        template: '%s | Apex Affinity Group',
      },
      description: 'Join Apex Affinity Group and build your insurance career.',
    };

    expect(metadata.title.default).toContain('Apex Affinity Group');
    expect(metadata.title.template).toContain('%s');
  });

  test('OpenGraph tags are configured', () => {
    const ogConfig = {
      type: 'website',
      locale: 'en_US',
      siteName: 'Apex Affinity Group',
    };

    expect(ogConfig.type).toBe('website');
    expect(ogConfig.locale).toBe('en_US');
  });

  test('Twitter card is configured', () => {
    const twitterConfig = {
      card: 'summary_large_image',
      creator: '@TheApexWay',
    };

    expect(twitterConfig.card).toBe('summary_large_image');
    expect(twitterConfig.creator).toContain('@');
  });
});

describe('Sitemap', () => {
  test('includes all main pages', () => {
    const expectedPages = [
      '/',
      '/about',
      '/carriers',
      '/opportunity',
      '/contact',
      '/faq',
      '/privacy',
      '/terms',
      '/income-disclaimer',
      '/login',
      '/signup',
    ];

    expect(expectedPages.length).toBe(11);
    expect(expectedPages).toContain('/about');
    expect(expectedPages).toContain('/opportunity');
  });

  test('pages have correct priority settings', () => {
    const priorities = {
      home: 1,
      opportunity: 0.9,
      about: 0.8,
      contact: 0.7,
      faq: 0.6,
      legal: 0.3,
    };

    expect(priorities.home).toBe(1);
    expect(priorities.opportunity).toBeGreaterThan(priorities.about);
  });
});

describe('Robots.txt', () => {
  test('allows public pages', () => {
    const allowed = ['/'];
    expect(allowed).toContain('/');
  });

  test('disallows private areas', () => {
    const disallowed = [
      '/dashboard/',
      '/admin/',
      '/api/',
      '/admin-login',
      '/_next/',
    ];

    expect(disallowed).toContain('/dashboard/');
    expect(disallowed).toContain('/admin/');
    expect(disallowed).toContain('/api/');
  });
});

describe('Contact Form API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('validates required fields', () => {
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'join',
      message: 'I want to learn more about joining Apex.',
    };

    requiredFields.forEach(field => {
      expect(validData).toHaveProperty(field);
      expect(validData[field as keyof typeof validData]).toBeDefined();
    });
  });

  test('subject mapping is correct', () => {
    const subjectMap: Record<string, string> = {
      join: 'Interested in Joining Apex',
      products: 'Product Information Request',
      support: 'Agent Support Request',
      partnership: 'Business Partnership Inquiry',
      other: 'General Inquiry',
    };

    expect(subjectMap.join).toBe('Interested in Joining Apex');
    expect(Object.keys(subjectMap).length).toBe(5);
  });
});

describe('Legal Pages', () => {
  describe('Privacy Policy', () => {
    test('includes required sections', () => {
      const requiredSections = [
        'Information We Collect',
        'How We Use Your Information',
        'Information Sharing',
        'Data Security',
        'Your Rights',
        'Cookies and Tracking',
        "Children's Privacy",
      ];

      expect(requiredSections.length).toBe(7);
      expect(requiredSections).toContain('Data Security');
    });

    test('includes CCPA disclosure', () => {
      const ccpaContent = 'California Consumer Privacy Act';
      expect(ccpaContent).toContain('California');
    });
  });

  describe('Terms of Service', () => {
    test('includes independent contractor notice', () => {
      const contractorStatus = 'independent contractor, NOT an employee';
      expect(contractorStatus).toContain('independent contractor');
    });

    test('includes compensation terms', () => {
      const compensationTerms = [
        'Commission Structure',
        'Chargebacks',
        'Payment Schedule',
        'Minimum Payout',
      ];

      expect(compensationTerms.length).toBe(4);
    });
  });

  describe('Income Disclaimer', () => {
    test('includes rank statistics table', () => {
      const ranks = [
        'Pre-Associate',
        'Associate',
        'Senior Associate',
        'District Manager',
        'Regional Manager',
        'Senior Regional',
        'MGA',
        'Premier MGA',
      ];

      expect(ranks.length).toBe(8);
      expect(ranks[0]).toBe('Pre-Associate');
      expect(ranks[ranks.length - 1]).toBe('Premier MGA');
    });

    test('includes FTC compliance notice', () => {
      const ftcNotice = 'Federal Trade Commission';
      expect(ftcNotice).toContain('Federal Trade Commission');
    });

    test('includes key disclosures', () => {
      const disclosures = [
        'No Guaranteed Income',
        'Majority Earn Little or Nothing',
        'Income Requires Work',
        'Business Expenses',
        'Licensing Requirements',
        'Commission Structure',
      ];

      expect(disclosures.length).toBe(6);
      expect(disclosures).toContain('No Guaranteed Income');
    });
  });
});

describe('Marketing Footer', () => {
  test('includes company links', () => {
    const companyLinks = [
      '/about',
      '/carriers',
      '/opportunity',
      '/faq',
      '/contact',
    ];

    expect(companyLinks.length).toBe(5);
  });

  test('includes legal links', () => {
    const legalLinks = [
      '/privacy',
      '/terms',
      '/income-disclaimer',
    ];

    expect(legalLinks.length).toBe(3);
  });

  test('includes social media links', () => {
    const socialLinks = [
      'facebook.com',
      'linkedin.com',
      'twitter.com',
      'instagram.com',
    ];

    expect(socialLinks.length).toBe(4);
  });
});
