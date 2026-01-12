import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';
import { waitForLoading, waitForTableData, checkForError, getTableRowCount } from './utils/helpers';

/**
 * E2E tests for Admin Bonuses Page
 * Tests the /admin/bonuses page functionality
 */

test.describe('Admin Bonuses Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to bonuses page and load data', async ({ page }) => {
    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    // Check page title
    await expect(page.locator('h1')).toHaveText('Review Bonuses');

    // Check phase badge
    await expect(page.locator('text=/Phase \\d+/')).toBeVisible();

    // Check stats cards
    await expect(page.locator('text=Pending Review')).toBeVisible();
    await expect(page.locator('text=Approved This Month')).toBeVisible();
    await expect(page.locator('text=Active Agents')).toBeVisible();

    // Wait for pending bonuses table
    await waitForTableData(page);

    // Check table headers
    await expect(page.locator('table thead')).toContainText('Agent');
    await expect(page.locator('table thead')).toContainText('Type');
    await expect(page.locator('table thead')).toContainText('Amount');
    await expect(page.locator('table thead')).toContainText('Description');
  });

  test('should display pending bonuses section', async ({ page }) => {
    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    // Check pending bonuses card
    await expect(page.locator('text=Pending Bonuses')).toBeVisible();
    await expect(page.locator('text=Bonuses awaiting admin approval')).toBeVisible();

    // Check filter and approve all buttons
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    await expect(page.locator('button:has-text("Approve All")')).toBeVisible();
  });

  test('should display monthly bonuses section', async ({ page }) => {
    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    // Scroll to monthly bonuses section
    await page.locator('text=All Bonuses This Month').scrollIntoViewIfNeeded();

    // Check monthly bonuses card
    await expect(page.locator('text=All Bonuses This Month')).toBeVisible();
    await expect(page.locator('text=Complete history of bonus activity')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/admin/bonuses*', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to fetch bonuses' }),
      })
    );

    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    const hasError = await checkForError(page);
    expect(hasError).toBe(true);
  });

  test('should display empty state when no pending bonuses', async ({ page }) => {
    await page.route('/api/admin/bonuses*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'pending') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            bonuses: [],
            stats: { pendingAmount: 0 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            bonuses: [],
            stats: { totalAmount: 0 },
          }),
        });
      }
    });

    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    await expect(page.locator('text=No pending bonuses to review')).toBeVisible();
  });

  test('should display bonus status badges', async ({ page }) => {
    await page.route('/api/admin/bonuses*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'pending') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            bonuses: [],
            stats: { pendingAmount: 0 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            bonuses: [
              {
                id: '1',
                agent_id: 'agent-1',
                bonus_type: 'fast_start',
                amount: 500,
                description: 'First 3 sales bonus',
                status: 'paid',
                created_at: new Date().toISOString(),
                agents: { first_name: 'John', last_name: 'Doe', rank: 'agent' },
              },
              {
                id: '2',
                agent_id: 'agent-2',
                bonus_type: 'rank_advancement',
                amount: 1000,
                description: 'Promotion to Senior Agent',
                status: 'approved',
                created_at: new Date().toISOString(),
                agents: { first_name: 'Jane', last_name: 'Smith', rank: 'sr_agent' },
              },
            ],
            stats: { totalAmount: 1500 },
          }),
        });
      }
    });

    await page.goto('/admin/bonuses');
    await waitForLoading(page);

    // Scroll to monthly bonuses
    await page.locator('text=All Bonuses This Month').scrollIntoViewIfNeeded();
    await waitForTableData(page);

    // Check status badges
    await expect(page.locator('text=paid').first()).toBeVisible();
    await expect(page.locator('text=approved').first()).toBeVisible();
  });
});
