# E2E Tests with Playwright

## Overview

End-to-end tests for the Apex Affinity Group admin dashboard using Playwright.

## Test Coverage

- **Admin Agents Page** (`admin-agents.spec.ts`)
  - Navigation and data loading
  - Filter by rank
  - Search by name
  - Error handling
  - Empty states

- **Admin Commissions Page** (`admin-commissions.spec.ts`)
  - Data loading and stats display
  - Commission import dialog
  - Status badges
  - Error handling
  - Empty states

- **Admin Bonuses Page** (`admin-bonuses.spec.ts`)
  - Pending and monthly bonuses
  - Phase display
  - Status badges
  - Approval workflow UI
  - Error handling

- **Admin Payouts Page** (`admin-payouts.spec.ts`)
  - Pending and recent payouts
  - Checkbox selection
  - Status badges
  - Warning banners
  - Error handling

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (see browser)

```bash
npm run test:e2e:headed
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test e2e/admin-agents.spec.ts
```

## Test Authentication

The tests use utility functions in `e2e/utils/auth.ts` to handle authentication:

- `loginAsAdmin()` - Login with admin credentials
- `loginAsAgent()` - Login with agent credentials
- `logout()` - Logout current user

**Note**: For tests to pass, you need valid test credentials in your database or mock the authentication endpoints.

## Test Helpers

The `e2e/utils/helpers.ts` file provides:

- `waitForLoading()` - Wait for loading spinners
- `checkForError()` - Check if error alert is displayed
- `getErrorMessage()` - Get error message text
- `waitForTableData()` - Wait for table data to load
- `getTableRowCount()` - Count table rows
- `clickTableAction()` - Click action buttons in table
- `checkStatCard()` - Verify stat card values

## CI/CD

The tests run automatically on push/PR via GitHub Actions (`.github/workflows/playwright.yml`).

## Best Practices

1. **Always use test IDs** for critical elements (add `data-testid` attributes)
2. **Mock API responses** when testing error states
3. **Wait for elements** before interacting with them
4. **Use meaningful test descriptions** that explain what's being tested
5. **Group related tests** using `test.describe()`
6. **Clean up after tests** (logout, reset state)

## Troubleshooting

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if dev server is starting correctly
- Verify database connectivity

### Authentication failures

- Check credentials in `e2e/utils/auth.ts`
- Verify Supabase setup and environment variables
- Ensure test users exist in database

### Flaky tests

- Add explicit waits for elements
- Use `waitForLoadState('networkidle')` for complex pages
- Increase retry count in `playwright.config.ts`

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [CodeBakers Testing Patterns](../.claude/08-testing.md)
