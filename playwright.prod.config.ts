import { defineConfig, devices } from '@playwright/test';

/**
 * Runs validation specs against the live production domain.
 * No webServer: the target is the deployed site.
 *
 *   npx playwright test --config playwright.prod.config.ts
 */
export default defineConfig({
  testDir: './e2e-prod',
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  reporter: 'list',
  expect: { timeout: 30000 },
  use: {
    baseURL: 'https://www.xn--currculorapidocomia-o1b.com.br',
    navigationTimeout: 60000,
    actionTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
