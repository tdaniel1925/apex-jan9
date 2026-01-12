import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';
import { waitForLoading, waitForTableData, getTableRowCount, checkForError } from './utils/helpers';

/**
 * E2E tests for Admin Agents Page
 * Tests the /admin/agents page functionality
 */

test.describe('Admin Agents Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('should navigate to agents page and load data', async ({ page }) => {
    // Navigate to agents page
    await page.goto('/admin/agents');

    // Wait for page to load
    await waitForLoading(page);

    // Check page title
    await expect(page.locator('h1')).toHaveText('Manage Agents');

    // Check stats cards are visible
    await expect(page.locator('text=Total Agents')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Wait for table data
    await waitForTableData(page);

    // Check table headers
    await expect(page.locator('table thead')).toContainText('Agent');
    await expect(page.locator('table thead')).toContainText('Email');
    await expect(page.locator('table thead')).toContainText('Rank');
    await expect(page.locator('table thead')).toContainText('Status');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('/api/admin/agents', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    // Navigate to agents page
    await page.goto('/admin/agents');

    // Wait for loading to finish
    await waitForLoading(page);

    // Check if error alert is displayed
    const hasError = await checkForError(page);
    expect(hasError).toBe(true);
  });

  test('should filter agents by rank', async ({ page }) => {
    await page.goto('/admin/agents');
    await waitForLoading(page);
    await waitForTableData(page);

    // Open rank filter dropdown
    await page.click('[data-testid="rank-filter"]');

    // Select a specific rank (e.g., "Agent")
    await page.click('text=Agent');

    // Wait for filtered results
    await waitForLoading(page);

    // Verify filtered results (all rows should show "Agent" rank)
    const rows = await getTableRowCount(page);
    if (rows > 0) {
      await expect(page.locator('table tbody tr').first()).toContainText('Agent');
    }
  });

  test('should search agents by name', async ({ page }) => {
    await page.goto('/admin/agents');
    await waitForLoading(page);
    await waitForTableData(page);

    // Get initial row count
    const initialRows = await getTableRowCount(page);

    if (initialRows > 0) {
      // Get first agent's name
      const firstAgentName = await page.locator('table tbody tr').first().locator('td').first().textContent();

      // Enter search term
      await page.fill('[data-testid="search-input"]', firstAgentName || 'test');

      // Wait for search results
      await page.waitForTimeout(500);

      // Check if results are filtered
      const filteredRows = await getTableRowCount(page);
      expect(filteredRows).toBeLessThanOrEqual(initialRows);
    }
  });

  test('should display empty state when no agents', async ({ page }) => {
    // Intercept API call and return empty array
    await page.route('/api/admin/agents', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          agents: [],
          stats: { total: 0, active: 0, pending: 0 },
        }),
      })
    );

    await page.goto('/admin/agents');
    await waitForLoading(page);

    // Check for empty state message
    await expect(page.locator('text=No agents found')).toBeVisible();
  });
});
