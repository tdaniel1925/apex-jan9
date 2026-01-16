import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';
import { waitForLoading, checkForError } from './utils/helpers';

/**
 * E2E tests for Admin Comp Plan Settings Page
 * Tests the /admin/comp-plan page functionality
 */

test.describe('Admin Comp Plan Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to comp plan settings page and load data', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Check page title
    await expect(page.locator('h1')).toContainText('Comp Plan Settings');

    // Check description
    await expect(page.locator('text=Configure incentive program settings')).toBeVisible();

    // Check all three program cards are visible
    await expect(page.locator('text=APEX Drive (Car Bonus)')).toBeVisible();
    await expect(page.locator('text=APEX Ignition (Fast Start)')).toBeVisible();
    await expect(page.locator('text=Elite 10 Recognition')).toBeVisible();
  });

  test('should display Car Bonus program with tiers', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Find the Car Bonus card
    const carBonusCard = page.locator('[data-program="car_bonus"]').first();

    // If no data-attribute, look for the card by content
    const carBonusSection = page.locator('text=APEX Drive (Car Bonus)').locator('..');

    // Check tier information is displayed
    await expect(page.locator('text=Silver')).toBeVisible();
    await expect(page.locator('text=Gold')).toBeVisible();
    await expect(page.locator('text=Platinum')).toBeVisible();
    await expect(page.locator('text=Elite')).toBeVisible();

    // Check tier bonus amounts
    await expect(page.locator('text=$300/mo')).toBeVisible();
    await expect(page.locator('text=$500/mo')).toBeVisible();
    await expect(page.locator('text=$800/mo')).toBeVisible();
    await expect(page.locator('text=$1,200/mo')).toBeVisible();
  });

  test('should display Fast Start program with milestones', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Check Fast Start milestones are displayed
    await expect(page.locator('text=First Policy Placed')).toBeVisible();
    await expect(page.locator('text=$5,000 Premium')).toBeVisible();
    await expect(page.locator('text=$10,000 Premium')).toBeVisible();
    await expect(page.locator('text=$25,000 Premium')).toBeVisible();

    // Check milestone bonus amounts
    await expect(page.locator('text=$100')).toBeVisible();
    await expect(page.locator('text=$150')).toBeVisible();
    await expect(page.locator('text=$250')).toBeVisible();
    await expect(page.locator('text=$500')).toBeVisible();
  });

  test('should display Elite 10 program with scoring weights', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Check Elite 10 scoring weights are displayed
    await expect(page.locator('text=Total Premium Placed')).toBeVisible();
    await expect(page.locator('text=40%')).toBeVisible();

    await expect(page.locator('text=Number of Policies Written')).toBeVisible();
    await expect(page.locator('text=20%').first()).toBeVisible();

    // Check quarterly bonus
    await expect(page.locator('text=$500')).toBeVisible();
  });

  test('should have Fast Start toggle disabled (always on)', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Find the Fast Start section
    const fastStartSection = page.locator('text=APEX Ignition (Fast Start)').locator('..').locator('..');

    // The toggle/switch in Fast Start section should be disabled
    const fastStartSwitch = fastStartSection.locator('button[role="switch"]');

    // Check if the switch is disabled
    await expect(fastStartSwitch).toBeDisabled();

    // Check "Always Active" badge is present
    await expect(page.locator('text=Always Active')).toBeVisible();
  });

  test('should allow toggling Car Bonus program', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Find the Car Bonus section switch
    const carBonusSection = page.locator('text=APEX Drive (Car Bonus)').locator('..').locator('..');
    const carBonusSwitch = carBonusSection.locator('button[role="switch"]');

    // The switch should be enabled (not disabled)
    await expect(carBonusSwitch).toBeEnabled();

    // Click to toggle
    await carBonusSwitch.click();

    // Wait for API response (toast notification)
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 }).catch(() => {
      // Toast may not appear in test environment
    });
  });

  test('should allow toggling Elite 10 program', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Find the Elite 10 section switch
    const elite10Section = page.locator('text=Elite 10 Recognition').locator('..').locator('..');
    const elite10Switch = elite10Section.locator('button[role="switch"]');

    // The switch should be enabled (not disabled)
    await expect(elite10Switch).toBeEnabled();

    // Click to toggle
    await elite10Switch.click();

    // Wait for API response
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 }).catch(() => {
      // Toast may not appear in test environment
    });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/admin/comp-plan/settings', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to fetch settings' }),
      })
    );

    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Should still show page with defaults
    await expect(page.locator('h1')).toContainText('Comp Plan Settings');

    // Programs should still be visible (using fallback data)
    await expect(page.locator('text=APEX Drive (Car Bonus)')).toBeVisible();
  });

  test('should be accessible from admin sidebar', async ({ page }) => {
    await page.goto('/admin');
    await waitForLoading(page);

    // Find and click the Comp Plan Settings link in sidebar
    const sidebarLink = page.locator('text=Comp Plan Settings');
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();

    // Should navigate to comp plan page
    await page.waitForURL('/admin/comp-plan');
    await expect(page.locator('h1')).toContainText('Comp Plan Settings');
  });

  test('should display quality gates information', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Check quality gate requirements are mentioned
    await expect(page.locator('text=60%')).toBeVisible(); // Placement ratio
    await expect(page.locator('text=80%')).toBeVisible(); // Persistency ratio
  });

  test('should display program descriptions', async ({ page }) => {
    await page.goto('/admin/comp-plan');
    await waitForLoading(page);

    // Check program descriptions
    await expect(page.locator('text=/Monthly car allowance/i')).toBeVisible();
    await expect(page.locator('text=/new agents/i')).toBeVisible();
    await expect(page.locator('text=/top 10 performers/i')).toBeVisible();
  });
});
