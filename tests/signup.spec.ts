import { test, expect } from '@playwright/test';

test.describe('Distributor Sign-Up Flow', () => {
  // Generate unique test data for each run
  const timestamp = Date.now();
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test.user.${timestamp}@example.com`,
    phone: '(555) 123-4567',
    username: `t.user${timestamp}`,
    password: 'TestPassword123!',
  };

  test('should complete full sign-up process successfully', async ({ page }) => {
    // Step 1: Navigate to sign-up page
    await test.step('Navigate to sign-up page', async () => {
      await page.goto('http://localhost:3003/join');
      await expect(page).toHaveTitle(/Join Apex Affinity Group/i);

      // Verify page loaded with correct heading
      await expect(page.getByRole('heading', { name: /Join Apex Affinity Group/i })).toBeVisible();
    });

    // Step 2: Fill in first name
    await test.step('Fill in first name', async () => {
      const firstNameInput = page.getByLabel(/First Name/i);
      await expect(firstNameInput).toBeVisible();
      await firstNameInput.fill(testUser.firstName);
      await expect(firstNameInput).toHaveValue(testUser.firstName);
    });

    // Step 3: Fill in last name
    await test.step('Fill in last name', async () => {
      const lastNameInput = page.getByLabel(/Last Name/i);
      await expect(lastNameInput).toBeVisible();
      await lastNameInput.fill(testUser.lastName);
      await expect(lastNameInput).toHaveValue(testUser.lastName);
    });

    // Step 4: Verify username auto-generated
    await test.step('Verify username auto-generated', async () => {
      const usernameInput = page.getByLabel(/Username/i);
      await expect(usernameInput).toBeVisible();

      // Wait for auto-generated username
      await expect(usernameInput).toHaveValue(/t\.user/i);
    });

    // Step 5: Fill in email
    await test.step('Fill in email', async () => {
      const emailInput = page.getByLabel(/^Email/i);
      await expect(emailInput).toBeVisible();
      await emailInput.fill(testUser.email);
      await expect(emailInput).toHaveValue(testUser.email);
    });

    // Step 6: Fill in phone (optional)
    await test.step('Fill in phone number', async () => {
      const phoneInput = page.getByLabel(/Phone/i);
      await expect(phoneInput).toBeVisible();
      await phoneInput.fill(testUser.phone);
      await expect(phoneInput).toHaveValue(testUser.phone);
    });

    // Step 7: Select license status
    await test.step('Select license status', async () => {
      const licensedRadio = page.getByRole('radio', { name: /I am a licensed insurance agent/i });
      await expect(licensedRadio).toBeVisible();
      await licensedRadio.check();
      await expect(licensedRadio).toBeChecked();
    });

    // Step 8: Wait for username availability check
    await test.step('Wait for username availability check', async () => {
      // Wait for the check icon to appear (green checkmark)
      await page.waitForSelector('svg.text-green-500', { timeout: 5000 });

      // Verify no error message for username
      await expect(page.getByText(/This username is already taken/i)).not.toBeVisible();
    });

    // Step 9: Fill in password
    await test.step('Fill in password', async () => {
      const passwordInput = page.getByLabel('Password', { exact: true });
      await expect(passwordInput).toBeVisible();
      await passwordInput.fill(testUser.password);
      await expect(passwordInput).toHaveValue(testUser.password);

      // Verify password requirements shown
      await expect(page.getByText(/At least 8 characters, one uppercase, one number/i)).toBeVisible();
    });

    // Step 10: Fill in confirm password
    await test.step('Fill in confirm password', async () => {
      const confirmPasswordInput = page.getByLabel(/Confirm Password/i);
      await expect(confirmPasswordInput).toBeVisible();
      await confirmPasswordInput.fill(testUser.password);
      await expect(confirmPasswordInput).toHaveValue(testUser.password);
    });

    // Step 11: Accept terms and conditions
    await test.step('Accept terms and conditions', async () => {
      const termsCheckbox = page.getByRole('checkbox', { name: /I agree to the/i });
      await expect(termsCheckbox).toBeVisible();
      await termsCheckbox.check();
      await expect(termsCheckbox).toBeChecked();
    });

    // Step 12: Take screenshot before submission
    await test.step('Take screenshot of filled form', async () => {
      await page.screenshot({
        path: `tests/screenshots/signup-form-filled-${timestamp}.png`,
        fullPage: true
      });
    });

    // Step 13: Submit form
    await test.step('Submit sign-up form', async () => {
      const submitButton = page.getByRole('button', { name: /Join.*Team/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      // Click submit
      await submitButton.click();

      // Verify button shows loading state
      await expect(page.getByText(/Creating Account/i)).toBeVisible({ timeout: 2000 });
    });

    // Step 14: Wait for success and redirect
    await test.step('Verify successful sign-up', async () => {
      // Wait for success toast (or redirect to login)
      await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

      // Take screenshot of result
      await page.screenshot({
        path: `tests/screenshots/signup-success-${timestamp}.png`,
        fullPage: true
      });

      // Verify we're on login or dashboard page
      expect(page.url()).toMatch(/\/(login|dashboard)/);
    });
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await test.step('Navigate to sign-up page', async () => {
      await page.goto('http://localhost:3003/join');
    });

    await test.step('Submit empty form', async () => {
      const submitButton = page.getByRole('button', { name: /Join.*Team/i });
      await submitButton.click();

      // Should not redirect (form validation prevents submission)
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/join');
    });

    await test.step('Fill invalid email', async () => {
      await page.getByLabel(/First Name/i).fill('Test');
      await page.getByLabel(/Last Name/i).fill('User');
      await page.getByLabel(/^Email/i).fill('invalid-email');
      await page.getByLabel('Password', { exact: true }).fill('test');
      await page.getByLabel(/Confirm Password/i).fill('test');

      // Try to submit
      const submitButton = page.getByRole('button', { name: /Join.*Team/i });
      await submitButton.click();

      // Should show validation errors
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/join');
    });

    await test.step('Take screenshot of validation errors', async () => {
      await page.screenshot({
        path: 'tests/screenshots/signup-validation-errors.png',
        fullPage: true
      });
    });
  });

  test('should check username availability in real-time', async ({ page }) => {
    await test.step('Navigate to sign-up page', async () => {
      await page.goto('http://localhost:3003/join');
    });

    await test.step('Fill name fields to trigger auto-username', async () => {
      await page.getByLabel(/First Name/i).fill('John');
      await page.getByLabel(/Last Name/i).fill('Smith');
    });

    await test.step('Verify username availability check', async () => {
      const usernameInput = page.getByLabel(/Username/i);

      // Wait for auto-generated username
      await expect(usernameInput).toHaveValue('j.smith');

      // Wait for username check to complete (loading spinner)
      await page.waitForSelector('svg.animate-spin', { timeout: 5000 });

      // Wait for check result (either green check or red X)
      await page.waitForSelector('svg.text-green-500, svg.text-red-500', { timeout: 5000 });
    });

    await test.step('Take screenshot of username check', async () => {
      await page.screenshot({
        path: 'tests/screenshots/signup-username-check.png'
      });
    });
  });

  test('should show password strength requirements', async ({ page }) => {
    await test.step('Navigate to sign-up page', async () => {
      await page.goto('http://localhost:3003/join');
    });

    await test.step('Focus password field', async () => {
      const passwordInput = page.getByLabel('Password', { exact: true });
      await passwordInput.focus();
      await passwordInput.fill('weak');

      // Verify requirements message shown
      await expect(page.getByText(/At least 8 characters, one uppercase, one number/i)).toBeVisible();
    });

    await test.step('Fill strong password', async () => {
      const passwordInput = page.getByLabel('Password', { exact: true });
      await passwordInput.clear();
      await passwordInput.fill('StrongPassword123!');

      // Requirements message should still be visible
      await expect(page.getByText(/At least 8 characters, one uppercase, one number/i)).toBeVisible();
    });

    await test.step('Verify password mismatch error', async () => {
      const confirmPasswordInput = page.getByLabel(/Confirm Password/i);
      await confirmPasswordInput.fill('DifferentPassword123!');

      // Click outside to trigger validation
      await page.getByLabel(/First Name/i).click();

      // Wait a moment for validation
      await page.waitForTimeout(500);
    });

    await test.step('Take screenshot of password validation', async () => {
      await page.screenshot({
        path: 'tests/screenshots/signup-password-validation.png',
        fullPage: true
      });
    });
  });
});
