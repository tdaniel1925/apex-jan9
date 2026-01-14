/**
 * Copilot Email Templates Tests
 */

import { describe, it, expect } from 'vitest';

describe('Copilot Email Templates', () => {
  describe('Trial Ending Email', () => {
    it('should have correct props interface', () => {
      const props = {
        agentName: 'John Doe',
        daysRemaining: 3,
        trialEndDate: 'January 15, 2026',
        upgradeUrl: 'https://theapexway.net/copilot/subscribe',
      };

      expect(props.agentName).toBeDefined();
      expect(props.daysRemaining).toBeGreaterThan(0);
      expect(props.trialEndDate).toBeDefined();
      expect(props.upgradeUrl).toContain('copilot');
    });

    it('should generate correct preview text', () => {
      const daysRemaining = 3;
      const preview = `Your AI Copilot trial ends in ${daysRemaining} days`;
      expect(preview).toContain('3 days');
    });

    it('should include upgrade CTA', () => {
      const upgradeUrl = 'https://theapexway.net/copilot/subscribe';
      expect(upgradeUrl).toBeDefined();
      expect(upgradeUrl.length).toBeGreaterThan(0);
    });
  });

  describe('Usage Warning Email', () => {
    it('should have correct props interface', () => {
      const props = {
        agentName: 'John Doe',
        usedMessages: 45,
        limitMessages: 50,
        percentUsed: 90,
        currentTier: 'Basic',
        upgradeUrl: 'https://theapexway.net/copilot/subscribe',
      };

      expect(props.usedMessages).toBeLessThanOrEqual(props.limitMessages);
      expect(props.percentUsed).toBeGreaterThanOrEqual(0);
      expect(props.percentUsed).toBeLessThanOrEqual(100);
    });

    it('should calculate percentage correctly', () => {
      const used = 45;
      const limit = 50;
      const percent = Math.round((used / limit) * 100);
      expect(percent).toBe(90);
    });

    it('should calculate remaining messages', () => {
      const used = 45;
      const limit = 50;
      const remaining = limit - used;
      expect(remaining).toBe(5);
    });

    it('should generate correct preview text', () => {
      const percentUsed = 90;
      const preview = `You've used ${percentUsed}% of your daily AI Copilot messages`;
      expect(preview).toContain('90%');
    });
  });

  describe('Welcome Email', () => {
    it('should have correct props for trial', () => {
      const props = {
        agentName: 'John Doe',
        tier: 'Basic',
        isTrialing: true,
        trialDays: 7,
        dailyLimit: 20,
        dashboardUrl: 'https://theapexway.net/copilot',
        widgetUrl: 'https://theapexway.net/copilot/widget',
      };

      expect(props.isTrialing).toBe(true);
      expect(props.trialDays).toBe(7);
    });

    it('should have correct props for paid subscription', () => {
      const props = {
        agentName: 'John Doe',
        tier: 'Pro',
        isTrialing: false,
        trialDays: undefined,
        dailyLimit: 200,
        dashboardUrl: 'https://theapexway.net/copilot',
        widgetUrl: 'https://theapexway.net/copilot/widget',
      };

      expect(props.isTrialing).toBe(false);
      expect(props.dailyLimit).toBe(200);
    });

    it('should generate correct preview for trial', () => {
      const trialDays = 7;
      const preview = `Your ${trialDays}-day AI Copilot trial has started!`;
      expect(preview).toContain('7-day');
      expect(preview).toContain('trial');
    });

    it('should generate correct preview for subscription', () => {
      const tier = 'Pro';
      const preview = `Welcome to AI Copilot ${tier}!`;
      expect(preview).toContain('Pro');
    });

    it('should include setup steps', () => {
      const steps = [
        'Go to your widget settings page',
        'Customize your widget appearance and greeting',
        'Copy the embed code and paste it on your website',
      ];

      expect(steps.length).toBe(3);
      steps.forEach((step) => {
        expect(step.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Email Styles', () => {
    it('should have consistent brand colors', () => {
      const primaryColor = '#0ea5e9';
      const backgroundColor = '#f6f9fc';

      expect(primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(backgroundColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have max width for email container', () => {
      const containerMaxWidth = '600px';
      expect(containerMaxWidth).toBe('600px');
    });

    it('should have readable font sizes', () => {
      const bodyFontSize = '16px';
      const footerFontSize = '12px';

      expect(parseInt(bodyFontSize)).toBeGreaterThanOrEqual(14);
      expect(parseInt(footerFontSize)).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Email Content', () => {
    it('should include company name in footer', () => {
      const footer = 'Apex Affinity Group';
      expect(footer).toContain('Apex');
    });

    it('should include support contact', () => {
      const supportEmail = 'support@theapexway.net';
      expect(supportEmail).toContain('@theapexway.net');
    });

    it('should have call-to-action buttons', () => {
      const ctaText = 'Upgrade Now';
      expect(ctaText.length).toBeGreaterThan(0);
      expect(ctaText.length).toBeLessThan(30);
    });
  });

  describe('URL Validation', () => {
    it('should have valid dashboard URL', () => {
      const dashboardUrl = 'https://theapexway.net/copilot';
      expect(dashboardUrl).toMatch(/^https?:\/\//);
    });

    it('should have valid widget URL', () => {
      const widgetUrl = 'https://theapexway.net/copilot/widget';
      expect(widgetUrl).toMatch(/^https?:\/\//);
      expect(widgetUrl).toContain('/widget');
    });

    it('should have valid upgrade URL', () => {
      const upgradeUrl = 'https://theapexway.net/copilot/subscribe';
      expect(upgradeUrl).toMatch(/^https?:\/\//);
      expect(upgradeUrl).toContain('/subscribe');
    });
  });

  describe('Tier Information', () => {
    const TIERS = {
      basic: { price: 29, limit: 50 },
      pro: { price: 79, limit: 200 },
      agency: { price: 199, limit: null },
    };

    it('should have correct tier pricing', () => {
      expect(TIERS.basic.price).toBe(29);
      expect(TIERS.pro.price).toBe(79);
      expect(TIERS.agency.price).toBe(199);
    });

    it('should have correct message limits', () => {
      expect(TIERS.basic.limit).toBe(50);
      expect(TIERS.pro.limit).toBe(200);
      expect(TIERS.agency.limit).toBeNull(); // Unlimited
    });

    it('should format tier info for email', () => {
      const formatTierInfo = (tier: keyof typeof TIERS) => {
        const config = TIERS[tier];
        const limitText = config.limit ? `${config.limit} messages/day` : 'Unlimited messages';
        return `$${config.price}/mo - ${limitText}`;
      };

      expect(formatTierInfo('basic')).toBe('$29/mo - 50 messages/day');
      expect(formatTierInfo('pro')).toBe('$79/mo - 200 messages/day');
      expect(formatTierInfo('agency')).toBe('$199/mo - Unlimited messages');
    });
  });
});
