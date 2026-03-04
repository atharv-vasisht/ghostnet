# GHOSTNET Testing Guide

## Prerequisites

```bash
pnpm install
```

---

## Unit Tests

```bash
pnpm run test
```

Runs Vitest in `apps/api`. Tests live in `apps/api/src/**/*.test.ts`.

### Current tests

- `health.test.ts` — Health endpoint returns 200 and status ok
- `env.test.ts` — Env validation schema (DATABASE_URL)

### Adding tests

Create `*.test.ts` in `apps/api/src/`:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('does something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

---

## Integration Tests

For API routes with mocked DB, use Vitest:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import myRoutes from './routes/my-routes.js';

describe('My routes', () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  beforeAll(async () => {
    app = Fastify();
    await app.register(myRoutes, { prefix: '/api/my' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/my returns data', async () => {
    const res = await app.inject({ method: 'GET', path: '/api/my' });
    expect(res.statusCode).toBe(200);
  });
});
```

---

## E2E Tests (Playwright)

To add E2E tests:

1. Install Playwright in `apps/web`:

```bash
pnpm --filter @ghostnet/web add -D @playwright/test
pnpm --filter @ghostnet/web exec playwright install chromium
```

2. Create `apps/web/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
```

3. Add E2E scripts to `apps/web/package.json`:

```json
"test:e2e": "playwright test"
```

4. Create `apps/web/e2e/landing.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GHOSTNET/i);
});
```

5. Run: `pnpm run test:e2e`

---

## CI

GitHub Actions runs on push/PR:

- Lint
- Typecheck
- Build
- Unit tests

See `.github/workflows/ci.yml`.

---

## Test Data

- Use `scripts/seed-demo.ts` for demo data
- Use `scripts/create-admin.ts` for admin user
- For isolated tests, use separate test DB or SQLite (requires schema migration)
