import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillSkills,
  goNext,
  selectPlan,
  mockMercadoPagoScript,
} from './helpers';

const successScript = mockMercadoPagoScript(`
  if (!settings?.callbacks || typeof settings.callbacks.onReady !== 'function' || typeof settings.callbacks.onError !== 'function') {
    const err = new Error('[undefined error] Callbacks onReady and/or onError are required');
    err.cause = { code: 'missing_required_callbacks' };
    throw err;
  }
  setTimeout(() => settings.callbacks.onReady && settings.callbacks.onReady(), 80);
  return { unmount: () => {} };
`);

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://sdk.mercadopago.com/js/v2*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: successScript,
      });
    });
  });

  test('PIX returns QR code and copy-paste code', async ({ page }) => {
    await startOnApp(page);
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);
    await fillExperience(page);
    await goNext(page);
    await goNext(page);
    await fillSkills(page);
    await goNext(page);
    await goNext(page);
    await goNext(page);

    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pix-test',
          qr_code: '00020126580014BR.GOV.PIX0136123e4567-e12b-12d1-a456-426655440000',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        }),
      });
    });

    await selectPlan(page, 'Intermediário');

    await expect(
      page.getByRole('img', { name: 'QR Code PIX' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('00020126580014BR.GOV.PIX')
    ).toBeVisible();
  });

  test('Card Brick initializes without missing_required_callbacks error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await startOnApp(page);
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);
    await fillExperience(page);
    await goNext(page);
    await goNext(page);
    await fillSkills(page);
    await goNext(page);
    await goNext(page);
    await goNext(page);

    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'card-test',
          qr_code: 'pix-code',
          qr_code_base64: 'base64',
        }),
      });
    });

    await selectPlan(page, 'Básico');
    await page.getByRole('button', { name: 'Cartão' }).click();

    await expect(
      page.getByText('Carregando formulário de cartão...')
    ).not.toBeVisible({ timeout: 10000 });

    const callbacks = await page.evaluate(() => {
      const calls = (window as any).__mpCreateCalls || [];
      const last = calls[calls.length - 1];
      return {
        count: calls.length,
        onReady: typeof last?.settings?.callbacks?.onReady,
        onError: typeof last?.settings?.callbacks?.onError,
        onSubmit: typeof last?.settings?.callbacks?.onSubmit,
      };
    });
    expect(callbacks.count).toBeGreaterThan(0);
    expect(callbacks.onReady).toBe('function');
    expect(callbacks.onError).toBe('function');
    expect(callbacks.onSubmit).toBe('function');

    expect(
      consoleErrors.some((e) => e.includes('missing_required_callbacks'))
    ).toBe(false);
  });

  test('download is triggered after payment and excess downloads do not show raw JSON', async ({ page }) => {
    const downloads: string[] = [];

    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pay-123',
          qr_code: 'pix-code',
          qr_code_base64: 'base64',
        }),
      });
    });

    await page.route('**/api/payment/status/pay-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ approved: true }),
      });
    });

    await page.route('**/api/payment/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          downloadUrl: 'http://localhost:3001/api/download/pay-123',
          emailSent: false,
        }),
      });
    });

    await page.route('**/api/download/pay-123', async (route) => {
      const headers = route.request().headers();
      downloads.push(headers['x-requested-with'] || 'no-header');
      const count = downloads.length;
      if (count === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          headers: { 'content-disposition': 'attachment; filename="curriculo.pdf"' },
          body: Buffer.from('%PDF-1.4 test'),
        });
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Limite de downloads atingido.' }),
        });
      }
    });

    await startOnApp(page);
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);
    await fillExperience(page);
    await goNext(page);
    await goNext(page);
    await fillSkills(page);
    await goNext(page);
    await goNext(page);
    await goNext(page);

    await selectPlan(page, 'Básico');

    await page.getByRole('button', { name: 'Verificar Pagamento' }).click();

    await expect(
      page.getByRole('heading', { name: 'Pagamento Aprovado!' }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: 'Baixar Currículo' })
    ).toBeVisible();

    expect(downloads).toContain('checkout-autodownload');

    await page.getByRole('button', { name: 'Baixar Currículo' }).click();

    await expect(page.locator('text=Limite de downloads atingido.')).toHaveCount(0);
    await expect(page.getByText('Erro ao baixar')).not.toBeVisible();
  });
});
