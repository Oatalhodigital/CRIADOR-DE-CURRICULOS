import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillEducation,
  fillSkills,
  fillLanguages,
  generateSummary,
  goNext,
} from './helpers';

test.describe('Form flow 1-8', () => {
  test.beforeEach(async ({ page }) => {
    await startOnApp(page);
  });

  test('advances through all steps until pricing without critical console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);

    await fillExperience(page);
    await goNext(page);

    await fillEducation(page);
    await goNext(page);

    await fillSkills(page);
    await goNext(page);

    await fillLanguages(page);
    await goNext(page);

    await generateSummary(page);
    await goNext(page);

    await expect(
      page.getByRole('heading', { name: 'Escolha seu Plano' })
    ).toBeVisible();

    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('Firebase') &&
        !e.includes('auth') &&
        !e.includes('MERCADO_PAGO_PUBLIC_KEY') &&
        !e.includes('FIREBASE_SERVICE_ACCOUNT_KEY') &&
        !e.includes('OpenAI') &&
        !e.includes('Failed to generate summary')
    );
    expect(critical).toEqual([]);
  });
});
