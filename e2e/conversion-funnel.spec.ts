import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillSkills,
  goNext,
  selectPlan,
} from './helpers';

test.describe('Conversion Funnel — full E2E', () => {
  test('lead → checkout → mock PIX approved → download released + tracking events fired', async ({ page }) => {
    const gtagCalls: { event: string; params: Record<string, unknown> }[] = [];
    const fbqCalls: { event: string; params: Record<string, unknown> }[] = [];

    await page.addInitScript(() => {
      // Mock gtag to capture events
      (window as any).gtag = function (...args: unknown[]) {
        if (args[0] === 'event') {
          (window as any).__gtagCalls = (window as any).__gtagCalls || [];
          (window as any).__gtagCalls.push({ event: args[1], params: args[2] });
        }
      };
      (window as any).dataLayer = [];
      // Mock fbq to capture events
      (window as any).fbq = function (command: string, ...args: unknown[]) {
        if (command === 'track') {
          (window as any).__fbqCalls = (window as any).__fbqCalls || [];
          (window as any).__fbqCalls.push({ event: args[0], params: args[1] });
        }
      };
      (window as any)._fbq = [];
    });

    // Mock payment creation
    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pay-funnel-test',
          qr_code: '00020126580014BR.GOV.PIX0136test',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        }),
      });
    });

    // Mock payment status as approved
    await page.route('**/api/payment/status/pay-funnel-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'pay-funnel-test', status: 'approved', approved: true }),
      });
    });

    // Mock payment complete
    await page.route('**/api/payment/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          downloadUrl: 'http://localhost:3001/api/download/pay-funnel-test',
          emailSent: true,
        }),
      });
    });

    // Mock PDF download
    await page.route('**/api/download/pay-funnel-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'content-disposition': 'attachment; filename="curriculo.pdf"' },
        body: Buffer.from('%PDF-1.4 test-funnel'),
      });
    });

    // Navigate through the funnel
    await startOnApp(page);
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);
    await fillExperience(page);
    await goNext(page);
    await goNext(page); // education
    await fillSkills(page);
    await goNext(page);
    await goNext(page); // languages
    await goNext(page); // summary → pricing

    await selectPlan(page, 'Básico');

    // Generate PIX QR code
    await page.getByRole('button', { name: 'Gerar QR Code PIX' }).click();
    await expect(
      page.getByRole('button', { name: 'Verificar Pagamento' })
    ).toBeVisible({ timeout: 15000 });

    // Simulate payment approval by clicking "Verificar Pagamento"
    await page.getByRole('button', { name: 'Verificar Pagamento' }).click();

    // Verify UI transitions to approved state with download button
    await expect(
      page.getByRole('heading', { name: 'Pagamento Aprovado!' }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('button', { name: 'Baixar Currículo' })
    ).toBeVisible();

    // Verify tracking events were fired
    const gtagEvents = await page.evaluate(() => (window as any).__gtagCalls || []);
    const fbqEvents = await page.evaluate(() => (window as any).__fbqCalls || []);

    const purchaseEvent = gtagEvents.find(
      (e: { event: string; params: Record<string, unknown> }) => e.event === 'purchase'
    );
    expect(purchaseEvent).toBeTruthy();
    expect(purchaseEvent.params.transaction_id).toBe('pay-funnel-test');
    expect(purchaseEvent.params.currency).toBe('BRL');

    const conversionEvent = gtagEvents.find(
      (e: { event: string; params: Record<string, unknown> }) => e.event === 'conversion'
    );
    expect(conversionEvent).toBeTruthy();
    expect(conversionEvent.params.send_to).toContain('AW-');
    expect(conversionEvent.params.transaction_id).toBe('pay-funnel-test');

    const metaPurchase = fbqEvents.find(
      (e: { event: string; params: Record<string, unknown> }) => e.event === 'Purchase'
    );
    expect(metaPurchase).toBeTruthy();
    expect(metaPurchase.params.value).toBeTruthy();
    expect(metaPurchase.params.currency).toBe('BRL');
  });

  test('payment recovery after page reload — saved payment ID restores download', async ({ page }) => {
    // Mock payment creation
    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pay-recovery-test',
          qr_code: '00020126580014BR.GOV.PIX0136test',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        }),
      });
    });

    // Mock payment status — first call returns pending, then approved
    let statusCallCount = 0;
    await page.route('**/api/payment/status/pay-recovery-test', async (route) => {
      statusCallCount++;
      const approved = statusCallCount > 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'pay-recovery-test',
          status: approved ? 'approved' : 'pending',
          approved,
        }),
      });
    });

    // Mock payment complete
    await page.route('**/api/payment/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          downloadUrl: 'http://localhost:3001/api/download/pay-recovery-test',
          emailSent: true,
        }),
      });
    });

    // Mock PDF download
    await page.route('**/api/download/pay-recovery-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'content-disposition': 'attachment; filename="curriculo.pdf"' },
        body: Buffer.from('%PDF-1.4 test-recovery'),
      });
    });

    // Navigate to checkout and generate PIX
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
    await page.getByRole('button', { name: 'Gerar QR Code PIX' }).click();
    await expect(
      page.getByRole('button', { name: 'Verificar Pagamento' })
    ).toBeVisible({ timeout: 15000 });

    // Verify payment ID was saved to sessionStorage
    const savedId = await page.evaluate(() => sessionStorage.getItem('checkout_payment_id'));
    expect(savedId).toBe('pay-recovery-test');

    // Reload the page (simulates user closing/refreshing after paying)
    await page.reload();

    // Navigate back to checkout — the modal should re-open via plan selection
    // The funnel state is persisted in sessionStorage, so we should be at pricing step
    // Re-select the plan to open checkout modal
    const pricingCard = page.locator('div.rounded-2xl').filter({ hasText: 'Básico' });
    if (await pricingCard.isVisible()) {
      await pricingCard.getByRole('button', { name: 'Selecionar' }).click();
    }

    // The recovery check should detect the saved payment and show approved state
    await expect(
      page.getByRole('heading', { name: 'Pagamento Aprovado!' }).first()
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByRole('button', { name: 'Baixar Currículo' })
    ).toBeVisible();
  });

  test('exit survey does not stack over lead capture modal', async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', (route) => route.abort('blockedbyclient'));
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort('blockedbyclient'));
    await page.route('https://va.vercel-scripts.com/**', (route) => route.abort('blockedbyclient'));

    await page.goto('/', { waitUntil: 'load' });

    // Click the main CTA to open lead capture modal
    await page.getByRole('button', { name: /Criar( Meu)? Currículo/i }).first().click();

    // Verify lead capture modal is visible
    await expect(
      page.getByRole('heading', { name: 'Vamos Começar!' })
    ).toBeVisible();

    // Wait for potential exit survey trigger (inactivity timer is 45s, but mouseleave could fire)
    // Simulate mouse leaving the viewport (would trigger exit survey if not guarded)
    await page.mouse.move(100, 1);
    await page.mouse.move(100, 0);

    // Wait a moment to see if exit survey appears
    await page.waitForTimeout(1000);

    // Exit survey should NOT be visible on top of lead capture
    const exitSurveyVisible = await page.getByRole('heading', { name: 'Ajude-nos a melhorar' }).isVisible().catch(() => false);
    expect(exitSurveyVisible).toBe(false);

    // Lead capture should still be visible
    await expect(
      page.getByRole('heading', { name: 'Vamos Começar!' })
    ).toBeVisible();
  });

  test('lead save failure shows error and does not advance user', async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', (route) => route.abort('blockedbyclient'));
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort('blockedbyclient'));
    await page.route('https://va.vercel-scripts.com/**', (route) => route.abort('blockedbyclient'));

    // Mock lead save as always failing
    let leadAttempts = 0;
    await page.route('**/api/leads', async (route) => {
      leadAttempts++;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.getByRole('button', { name: /Criar( Meu)? Currículo/i }).first().click();

    await expect(
      page.getByRole('heading', { name: 'Vamos Começar!' })
    ).toBeVisible();

    await page.locator('#lead-name').fill('Usuário Teste');
    await page.locator('#lead-email').fill('teste@exemplo.com');
    await page.locator('#lead-whatsapp').fill('11999999999');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Should show error message, NOT advance to personal info form
    await expect(page.getByText(/tente novamente/i)).toBeVisible({ timeout: 10000 });

    // Lead capture modal should still be visible
    await expect(
      page.getByRole('heading', { name: 'Vamos Começar!' })
    ).toBeVisible();

    // Personal info form should NOT be visible
    const personalInfoVisible = await page.getByRole('heading', { name: 'Informações Pessoais' }).isVisible().catch(() => false);
    expect(personalInfoVisible).toBe(false);

    expect(leadAttempts).toBeGreaterThanOrEqual(1);
  });
});
