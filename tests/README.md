# Playwright E2E Tests

## Setup

Install Playwright and browsers:

```bash
npm install -D @playwright/test
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Test Structure

### `signup.spec.ts`
Comprehensive tests for the distributor sign-up flow:

1. **Full Sign-Up Flow** - Tests the complete end-to-end signup process:
   - Navigate to signup page
   - Fill in all form fields (name, email, phone, license status)
   - Auto-generated username verification
   - Real-time username availability check
   - Password strength validation
   - Terms acceptance
   - Form submission
   - Success redirect verification

2. **Validation Tests** - Ensures form validation works:
   - Empty form submission prevention
   - Invalid email detection
   - Password strength requirements

3. **Username Availability** - Tests real-time username checking:
   - Auto-generation from first/last name
   - Debounced API calls
   - Visual feedback (loading, success, error)

4. **Password Validation** - Tests password requirements:
   - Strength requirements display
   - Password mismatch detection
   - Confirmation field validation

## Screenshots

Test screenshots are automatically saved to `tests/screenshots/`:
- Form filled state
- Success state
- Validation errors
- Username availability checks

## Configuration

See `playwright.config.ts` for:
- Browser configuration (Chrome, Firefox, Safari, Mobile)
- Timeout settings
- Reporter settings
- Dev server integration

## CI/CD

Tests are configured to:
- Run on all major browsers
- Retry failed tests (2 retries on CI)
- Capture screenshots on failure
- Record videos on failure
- Generate HTML report

## Debugging

Use `npm run test:debug` to:
- Step through tests
- Pause execution
- Inspect page state
- View console logs
