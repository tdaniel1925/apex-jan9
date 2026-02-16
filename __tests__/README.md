# Test Suite for Audience Segmentation Feature

## Setup Required

```bash
npm install -D vitest @vitest/ui @playwright/test
npm install -D @testing-library/react @testing-library/jest-dom
```

## Test Files to Create

### Stage 1: Database Layer Tests

#### `__tests__/lib/db/queries.test.ts`
```typescript
import { describe, test, expect } from 'vitest';
import { findDistributorByUsername } from '@/lib/db/queries';

describe('Distributor Queries', () => {
  test('findDistributorByUsername returns target_audience field', async () => {
    const distributor = await findDistributorByUsername('test-user');
    expect(distributor).toHaveProperty('targetAudience');
    expect(['agents', 'newcomers', 'both']).toContain(distributor.targetAudience);
  });
});
```

#### `__tests__/app/dashboard/profile/actions.test.ts`
```typescript
import { describe, test, expect, vi } from 'vitest';
import { updateTargetAudience } from '@/app/(dashboard)/dashboard/profile/actions';

describe('Profile Actions', () => {
  test('updateTargetAudience accepts valid values', async () => {
    const result = await updateTargetAudience('agents');
    expect(result.success).toBe(true);
  });

  test('updateTargetAudience rejects invalid values', async () => {
    const result = await updateTargetAudience('invalid' as any);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  test('updateTargetAudience requires authentication', async () => {
    // Mock unauthenticated state
    const result = await updateTargetAudience('agents');
    expect(result.success).toBe(false);
    expect(result.error).toContain('authenticated');
  });
});
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Coverage Goals

- Unit tests: 80%+ coverage
- E2E tests: All critical user flows
- Integration tests: Database operations
