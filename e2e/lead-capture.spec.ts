import { test, expect } from '@playwright/test';
import { startOnApp, fillLeadCapture } from './helpers';

test.describe('Lead Capture / Login', () => {
  test.beforeEach(async ({ page }) => {
    await startOnApp(page);
  });

  test('manual lead capture submits and advances without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await fillLeadCapture(page);

    await expect(page.locator('#lead-error')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Informações Pessoais' })
    ).toBeVisible();

    expect(
      consoleErrors.filter((e) => !e.includes('Firebase') && !e.includes('auth'))
    ).toEqual([]);
  });
});
