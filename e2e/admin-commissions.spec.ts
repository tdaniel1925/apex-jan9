import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';
import { waitForLoading, waitForTableData, checkForError } from './utils/helpers';

/**
 * E2E tests for Admin Commissions Page
 * Tests the /admin/commissions page functionality
 */

test.describe('Admin Commissions Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to commissions page and load data', async ({ page }) => {
    await page.goto('/admin/commissions');
    await waitForLoading(page);

    // Check page title
    await expect(page.locator('h1')).toHaveText('Import Commissions');

    // Check stats cards
    await expect(page.locator('text=This Month')).toBeVisible();
    await expect(page.locator('text=Total Premium')).toBeVisible();
    await expect(page.locator('text=Total Commissions')).toBeVisible();

    // Check upload section
    await expect(page.locator('text=Upload Commission File')).toBeVisible();
    await expect(page.locator('button:has-text("Import Commissions")')).toBeVisible();

    // Wait for recent commissions table
    await waitForTableData(page);

    // Check table headers
    await expect(page.locator('table thead')).toContainText('Agent');
    await expect(page.locator('table thead')).toContainText('Carrier');
    await expect(page.locator('table thead')).toContainText('Policy #');
    await expect(page.locator('table thead')).toContainText('Premium');
    await expect(page.locator('table thead')).toContainText('Commission');
  });

  test('should open commission import dialog', async ({ page }) => {
    await page.goto('/admin/commissions');
    await waitForLoading(page);

    // Click import button
    await page.click('button:has-text("Import Commissions")');

    // Check if dialog opened
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should handle API errors', async ({ page }) => {
    await page.route('/api/admin/commissions*', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to fetch commissions' }),
      })
    );

    await page.goto('/admin/commissions');
    await waitForLoading(page);

    const hasError = await checkForError(page);
    expect(hasError).toBe(true);
  });

  test('should display empty state when no commissions', async ({ page }) => {
    await page.route('/api/admin/commissions*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          commissions: [],
          stats: { totalCommissions: 0, totalAmount: 0 },
        }),
      })
    );

    await page.goto('/admin/commissions');
    await waitForLoading(page);

    await expect(page.locator('text=No commissions imported yet')).toBeVisible();
  });

  test('should display commission status badges correctly', async ({ page }) => {
    await page.route('/api/admin/commissions*', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          commissions: [
            {
              id: '1',
              agent_id: 'agent-1',
              carrier: 'columbus_life',
              policy_number: 'POL-123',
              premium_amount: 1000,
              commission_amount: 100,
              status: 'paid',
              created_at: new Date().toISOString(),
              agents: { first_name: 'John', last_name: 'Doe' },
            },
            {
              id: '2',
              agent_id: 'agent-2',
              carrier: 'aig',
              policy_number: 'POL-456',
              premium_amount: 2000,
              commission_amount: 200,
              status: 'pending',
              created_at: new Date().toISOString(),
              agents: { first_name: 'Jane', last_name: 'Smith' },
            },
          ],
          stats: { totalCommissions: 2, totalAmount: 300 },
        }),
      })
    );

    await page.goto('/admin/commissions');
    await waitForLoading(page);
    await waitForTableData(page);

    // Check status badges
    await expect(page.locator('text=paid')).toBeVisible();
    await expect(page.locator('text=pending')).toBeVisible();
  });
});
