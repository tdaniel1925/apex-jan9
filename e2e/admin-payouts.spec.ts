import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';
import { waitForLoading, waitForTableData, checkForError, getTableRowCount } from './utils/helpers';

/**
 * E2E tests for Admin Payouts Page
 * Tests the /admin/payouts page functionality
 */

test.describe('Admin Payouts Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to payouts page and load data', async ({ page }) => {
    await page.goto('/admin/payouts');
    await waitForLoading(page);

    // Check page title
    await expect(page.locator('h1')).toHaveText('Process Payouts');

    // Check stats cards
    await expect(page.locator('text=Pending Payouts')).toBeVisible();
    await expect(page.locator('text=Processed This Month')).toBeVisible();
    await expect(page.locator('text=Monthly Processed')).toBeVisible();

    // Wait for pending payouts table
    await waitForTableData(page);

    // Check table headers
    await expect(page.locator('table thead')).toContainText('Agent');
    await expect(page.locator('table thead')).toContainText('Amount');
    await expect(page.locator('table thead')).toContainText('Method');
    await expect(page.locator('table thead')).toContainText('Requested');
  });

  test('should display pending payouts section with checkboxes', async ({ page }) => {
    await page.goto('/admin/payouts');
    await waitForLoading(page);

    // Check pending payouts card
    await expect(page.locator('text=Pending Payouts')).toBeVisible();
    await expect(page.locator('text=Withdrawal requests awaiting processing')).toBeVisible();

    // Check if checkboxes are present in table
    const checkboxes = await page.locator('table input[type="checkbox"]').count();
    expect(checkboxes).toBeGreaterThan(0);
  });

  test('should display recent payouts section', async ({ page }) => {
    await page.goto('/admin/payouts');
    await waitForLoading(page);

    // Scroll to recent payouts section
    await page.locator('text=Recent Payouts').scrollIntoViewIfNeeded();

    // Check recent payouts card
    await expect(page.locator('text=Recent Payouts')).toBeVisible();
    await expect(page.locator('text=Processed payout history')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('/api/admin/payouts*', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to fetch payouts' }),
      })
    );

    await page.goto('/admin/payouts');
    await waitForLoading(page);

    const hasError = await checkForError(page);
    expect(hasError).toBe(true);
  });

  test('should display empty state when no pending payouts', async ({ page }) => {
    await page.route('/api/admin/payouts*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'pending') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [],
            stats: { pendingAmount: 0, pendingCount: 0 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [],
            stats: { totalAmount: 0, completedCount: 0 },
          }),
        });
      }
    });

    await page.goto('/admin/payouts');
    await waitForLoading(page);

    await expect(page.locator('text=No pending payouts')).toBeVisible();
  });

  test('should display payout warning when pending payouts exist', async ({ page }) => {
    await page.route('/api/admin/payouts*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'pending') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [
              {
                id: '1',
                agent_id: 'agent-1',
                amount: 500,
                method: 'ach',
                status: 'pending',
                created_at: new Date().toISOString(),
                processed_at: null,
                agents: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
              },
            ],
            stats: { pendingAmount: 500, pendingCount: 1 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [],
            stats: { totalAmount: 0, completedCount: 0 },
          }),
        });
      }
    });

    await page.goto('/admin/payouts');
    await waitForLoading(page);

    // Check warning banner
    await expect(page.locator('text=/\\d+ payout.*awaiting processing/')).toBeVisible();
    await expect(page.locator('button:has-text("Process All")')).toBeVisible();
  });

  test('should select and deselect payouts with checkboxes', async ({ page }) => {
    await page.route('/api/admin/payouts*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'pending') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [
              {
                id: '1',
                agent_id: 'agent-1',
                amount: 500,
                method: 'ach',
                status: 'pending',
                created_at: new Date().toISOString(),
                processed_at: null,
                agents: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
              },
              {
                id: '2',
                agent_id: 'agent-2',
                amount: 1000,
                method: 'wire',
                status: 'pending',
                created_at: new Date().toISOString(),
                processed_at: null,
                agents: { first_name: 'Jane', last_name: 'Smith', email: 'jane@test.com' },
              },
            ],
            stats: { pendingAmount: 1500, pendingCount: 2 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [],
            stats: { totalAmount: 0, completedCount: 0 },
          }),
        });
      }
    });

    await page.goto('/admin/payouts');
    await waitForLoading(page);
    await waitForTableData(page);

    // Get all checkboxes in table body
    const checkboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // Click first checkbox
      await checkboxes.first().check();
      await expect(checkboxes.first()).toBeChecked();

      // Uncheck it
      await checkboxes.first().uncheck();
      await expect(checkboxes.first()).not.toBeChecked();
    }
  });

  test('should display payout status badges correctly', async ({ page }) => {
    await page.route('/api/admin/payouts*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'completed') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [
              {
                id: '1',
                agent_id: 'agent-1',
                amount: 500,
                method: 'ach',
                status: 'completed',
                created_at: new Date().toISOString(),
                processed_at: new Date().toISOString(),
                agents: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
              },
            ],
            stats: { totalAmount: 500, completedCount: 1 },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            payouts: [],
            stats: { pendingAmount: 0, pendingCount: 0 },
          }),
        });
      }
    });

    await page.goto('/admin/payouts');
    await waitForLoading(page);

    // Scroll to recent payouts
    await page.locator('text=Recent Payouts').scrollIntoViewIfNeeded();
    await waitForTableData(page);

    // Check status badge
    await expect(page.locator('text=completed').first()).toBeVisible();
  });
});
