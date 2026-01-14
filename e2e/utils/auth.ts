import { Page } from '@playwright/test';

/**
 * Authentication utilities for E2E tests
 * Following CodeBakers patterns from 08-testing.md
 */

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');

  // Fill in admin credentials
  await page.fill('input[name="email"]', 'admin@theapexway.net');
  await page.fill('input[name="password"]', 'admin123');

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}

export async function loginAsAgent(page: Page, email = 'agent@test.com', password = 'agent123') {
  await page.goto('/login');

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for redirect to agent dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout
  await page.click('text=Logout');

  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 10000 });
}
