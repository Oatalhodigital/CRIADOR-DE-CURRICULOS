import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // The mobile audit suite is slow (4 viewports, full funnel each).
  // Run it on demand with: RUN_MOBILE_AUDIT=1 npx playwright test e2e/mobile-audit.spec.ts
  testIgnore: process.env.RUN_MOBILE_AUDIT ? [] : ['**/mobile-audit.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120000,
  reporter: 'list',
  expect: {
    timeout: 20000,
  },
  use: {
    baseURL: 'http://localhost:3001',
    navigationTimeout: 60000,
    actionTimeout: 20000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomente as linhas abaixo e rode `npx playwright install firefox webkit` para multi-browser
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    // { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'node scripts/e2e-server.js',
    url: 'http://localhost:3001',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY:
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
        'TEST-00000000-0000-0000-0000-000000000000',
      FIREBASE_SERVICE_ACCOUNT_KEY: '',
      POSTGRES_URL: '',
      NEXT_PRIVATE_DIST_DIR: '..\\..\\..\\.next-cache-curriculos',
      NODE_PATH: 'C:\\Users\\leand\\OneDrive\\Desktop\\CRIADOR DE CURRICULOS\\node_modules',
    },
  },
});
