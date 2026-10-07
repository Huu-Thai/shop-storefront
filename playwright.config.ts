import { defineConfig, devices } from '@playwright/test';

/**
 * Browser suite against a running storefront (E2E_BASE_URL) and its shop API. Placing orders and
 * registering customers leave data in the shop, so those specs run only when asked
 * (E2E_ORDERS=1) — see docs/TESTING.md.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
const customer = { storageState: 'e2e/.auth/customer.json' };

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { baseURL, locale: 'en-US', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop-1440',
      testIgnore: /auth\.setup|account|demo/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-768',
      testMatch: /screens\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: 'phone-360',
      testMatch: /screens\.spec\.ts|shopping\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 780 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'customer',
      dependencies: ['setup'],
      testMatch: /account\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, ...customer },
    },
    {
      name: 'demo',
      testMatch: /demo\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
