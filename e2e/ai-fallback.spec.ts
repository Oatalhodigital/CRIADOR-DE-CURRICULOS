import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  goNext,
} from './helpers';

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
});
