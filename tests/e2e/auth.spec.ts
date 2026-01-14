/**
 * Authentication E2E Tests
 * Comprehensive testing of auth system including performance
 */

import { test, expect } from '@playwright/test';

// Test user credentials (these should be created in your test database)
const TEST_USER = {
  email: 'test@theapexway.net',
  password: 'TestPassword123!',
};

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await page.context().clearCookies();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected dashboard route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should successfully log in and redirect to dashboard', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`[PERF] Login and dashboard load took ${loadTime}ms`);

    // Should show dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Performance check: Dashboard should load in under 3 seconds after login
    expect(loadTime).toBeLessThan(3000);
  });

  test('should show agent data in dashboard without extra queries', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Agent name should be visible in header
    await expect(page.locator('text=Test Agent')).toBeVisible();

    // Navigate to another dashboard page
    const startTime = Date.now();
    await page.click('a[href="/dashboard/wallet"]');
    await page.waitForURL('/dashboard/wallet');
    const navTime = Date.now() - startTime;

    console.log(`[PERF] Dashboard navigation took ${navTime}ms`);

    // Should be fast because agent data is cached
    expect(navTime).toBeLessThan(1000);
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Reload page
    const startTime = Date.now();
    await page.reload();
    const reloadTime = Date.now() - startTime;

    console.log(`[PERF] Page reload took ${reloadTime}ms`);

    // Should stay on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Reload should be fast with cached agent data
    expect(reloadTime).toBeLessThan(2000);
  });

  test('should successfully log out', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');

    // Try to access dashboard again - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should block admin routes for non-admin users', async ({ page }) => {
    // Log in as regular agent
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Try to access admin route
    await page.goto('/admin');

    // Should redirect back to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow admin users to access admin routes', async ({ page }) => {
    const ADMIN_USER = {
      email: 'admin@theapexway.net',
      password: 'AdminPassword123!',
    };

    // Log in as admin
    await page.goto('/admin-login');
    await page.fill('input[name="email"]', ADMIN_USER.email);
    await page.fill('input[name="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');

    // Should access admin panel
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('should handle concurrent page navigations without race conditions', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Rapidly navigate between pages
    const startTime = Date.now();

    await page.click('a[href="/dashboard/wallet"]');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/dashboard/commissions"]');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/dashboard/team"]');
    await page.waitForLoadState('networkidle');

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] Three rapid navigations took ${totalTime}ms`);

    // All navigations should complete without errors
    await expect(page).toHaveURL('/dashboard/team');

    // Should be fast because agent data is cached
    expect(totalTime).toBeLessThan(3000);
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    // This would test session expiration, but requires manipulating session cookies
    // For now, we'll test that the app can recover from a cleared session
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Clear cookies to simulate session loss
    await page.context().clearCookies();

    // Try to navigate to another dashboard page
    await page.goto('/dashboard/wallet');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should measure initial page load performance', async ({ page }) => {
    // Measure performance of loading the homepage
    const startTime = Date.now();
    await page.goto('/');
    const homeLoadTime = Date.now() - startTime;

    console.log(`[PERF] Homepage load took ${homeLoadTime}ms`);

    // Homepage should load quickly
    expect(homeLoadTime).toBeLessThan(2000);

    // Measure performance of loading login page
    const loginStartTime = Date.now();
    await page.goto('/login');
    const loginLoadTime = Date.now() - loginStartTime;

    console.log(`[PERF] Login page load took ${loginLoadTime}ms`);

    // Login page should load quickly
    expect(loginLoadTime).toBeLessThan(2000);
  });
});

test.describe('Agent Data Caching', () => {
  test('should fetch agent data only once per session', async ({ page }) => {
    let agentQueries = 0;

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/rest/v1/agents')) {
        agentQueries++;
        console.log(`[PERF] Agent query #${agentQueries}`);
      }
    });

    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Wait for initial agent query
    await page.waitForTimeout(1000);

    const queriesAfterLogin = agentQueries;
    console.log(`[PERF] Agent queries after login: ${queriesAfterLogin}`);

    // Navigate to multiple pages
    await page.click('a[href="/dashboard/wallet"]');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/dashboard/commissions"]');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/dashboard/team"]');
    await page.waitForLoadState('networkidle');

    // Wait to ensure no extra queries
    await page.waitForTimeout(1000);

    const queriesAfterNav = agentQueries;
    console.log(`[PERF] Agent queries after navigation: ${queriesAfterNav}`);

    // Should have made only 1 agent query (during initial login)
    // No additional queries during page navigation
    expect(queriesAfterNav).toBe(queriesAfterLogin);
    expect(queriesAfterLogin).toBeLessThanOrEqual(1);
  });
});
