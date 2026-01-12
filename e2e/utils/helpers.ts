import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for E2E tests
 * Following CodeBakers patterns from 08-testing.md
 */

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoading(page: Page, timeout = 30000) {
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout });
}

/**
 * Check if error alert is displayed
 */
export async function checkForError(page: Page) {
  const errorAlert = await page.locator('[role="alert"]').count();
  return errorAlert > 0;
}

/**
 * Get error message text
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
  const hasError = await checkForError(page);
  if (!hasError) return null;

  return await page.locator('[role="alert"]').textContent();
}

/**
 * Wait for table data to load
 */
export async function waitForTableData(page: Page, timeout = 30000) {
  // Wait for either data rows or "no data" message
  await page.waitForSelector('table tbody tr, [data-testid="empty-state"]', { timeout });
}

/**
 * Count table rows
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = await page.locator('table tbody tr').count();
  return rows;
}

/**
 * Click table action button
 */
export async function clickTableAction(page: Page, rowIndex: number, actionText: string) {
  const row = page.locator('table tbody tr').nth(rowIndex);
  await row.locator(`button:has-text("${actionText}")`).click();
}

/**
 * Check if stats card displays correct value
 */
export async function checkStatCard(page: Page, title: string, expectedValue: string | RegExp) {
  const card = page.locator(`[data-testid="stat-card"]:has-text("${title}")`);
  await expect(card).toContainText(expectedValue);
}
