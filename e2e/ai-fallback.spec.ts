import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillEducation,
  fillSkills,
  fillLanguages,
  goNext,
} from './helpers';

const RATE_LIMIT_MESSAGE = 'Limite de requisições da OpenAI atingido. Tente novamente mais tarde.';

test.describe('AI fallback', () => {
  test.beforeEach(async ({ page }) => {
    await startOnApp(page);
  });

  test('does not show red error when fallback/template fills the field', async ({ page }) => {
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);

    await page.getByPlaceholder('Nome da empresa').fill('Empresa Teste');

    const position = page.locator('input[placeholder="Seu cargo na empresa"]');
    await position.click();
    await position.fill('Desenvolvedor Frontend');
    await page.getByText('Desenvolvedor Frontend').first().click();

    await page.getByLabel('Emprego atual').check();

    const description = page.getByPlaceholder(
      'Descreva suas responsabilidades e conquistas...'
    );
    await description.fill('Trabalhei com React e Next.js em projetos digitais.');

    await page.route('**/api/ai/enhance', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Limite de requisições da OpenAI atingido. Tente novamente mais tarde.',
        }),
      });
    });

    await page.getByRole('button', { name: 'IA' }).first().click();

    await expect(
      page.locator('text=Limite de requisições da OpenAI atingido')
    ).toHaveCount(0);

    await expect(
      page.getByText('Sugestão gerada automaticamente')
    ).toBeVisible();

    const value = await description.inputValue();
    expect(value.length).toBeGreaterThan(20);
    expect(value).not.toBe('Trabalhei com React e Next.js em projetos digitais.');
  });

  test('Objetivo Profissional step never shows the rate-limit error', async ({ page }) => {
    await page.route('**/api/ai/summary', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: RATE_LIMIT_MESSAGE }),
      });
    });
    await page.route('**/api/ai/enhance', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: RATE_LIMIT_MESSAGE }),
      });
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

    await expect(page.getByRole('heading', { name: 'Objetivo Profissional' })).toBeVisible();

    const summary = page.locator('#summary-textarea');

    // "Gerar com IA" -> 429 must fall back silently, never showing the red error.
    await page.getByRole('button', { name: 'Gerar com IA' }).click();
    await expect(page.locator('#summary-error')).toHaveCount(0);
    await expect(page.getByText(RATE_LIMIT_MESSAGE)).toHaveCount(0);
    await expect(summary).not.toHaveValue('');

    // Templates Rápidos must stay available as a working alternative.
    await expect(page.getByText('Templates Rápidos:')).toBeVisible();

    // The inline "IA" enhance button on this step must also fall back silently.
    await page.getByRole('button', { name: 'IA' }).first().click();
    await expect(page.getByText(RATE_LIMIT_MESSAGE)).toHaveCount(0);
    await expect(page.getByText('Sugestão gerada automaticamente')).toBeVisible();
    await expect(page.locator('#summary-error')).toHaveCount(0);
  });
});
