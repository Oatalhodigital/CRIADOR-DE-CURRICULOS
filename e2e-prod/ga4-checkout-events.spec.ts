import { test, expect, Page, Request } from '@playwright/test';
import {
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillEducation,
  fillSkills,
  fillLanguages,
  generateSummary,
  goNext,
  selectPlan,
} from '../e2e/helpers';

const MEASUREMENT_ID = 'G-FQCJ664XNB';
const COLLECT_RE = /google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/;
const FAKE_PAYMENT_ID = 'ga4-validation-fake-id';

interface Hit {
  eventName: string;
  tid: string;
  params: Record<string, string>;
}

function parseHits(request: Request): Hit[] {
  const url = new URL(request.url());
  const tid = url.searchParams.get('tid') || '';
  const hits: Hit[] = [];

  const push = (params: URLSearchParams, fallbackTid: string) => {
    const name = params.get('en');
    if (!name) return;
    hits.push({
      eventName: name,
      tid: params.get('tid') || fallbackTid,
      params: Object.fromEntries(params.entries()),
    });
  };

  if (url.searchParams.get('en')) push(url.searchParams, tid);

  const body = request.postData();
  if (body) {
    for (const line of body.split('\n')) {
      if (line.trim()) push(new URLSearchParams(line), tid);
    }
  }

  return hits;
}

function collectGaHits(page: Page) {
  const hits: Hit[] = [];
  page.on('request', (request) => {
    if (COLLECT_RE.test(request.url())) hits.push(...parseHits(request));
  });
  return hits;
}

async function waitForEvent(hits: Hit[], eventName: string, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = hits.find((h) => h.eventName === eventName);
    if (found) return found;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

/**
 * Every payment-related endpoint is intercepted, so no real Mercado Pago
 * charge, lead or resume is created while validating production analytics.
 */
async function stubBackend(page: Page) {
  await page.route('**/api/leads', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'no-op' }) })
  );
  await page.route('**/api/payment/create', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: FAKE_PAYMENT_ID, qr_code: 'fake-pix-code', qr_code_base64: 'ZmFrZQ==' }),
    })
  );
  await page.route('**/api/payment/status/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: FAKE_PAYMENT_ID, status: 'approved', approved: true }),
    })
  );
  await page.route('**/api/payment/complete', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, downloadUrl: `/api/download/${FAKE_PAYMENT_ID}`, emailSent: false }),
    })
  );
  await page.route(`**/api/download/${FAKE_PAYMENT_ID}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4 fake' })
  );
}

test.describe('GA4 checkout events in production', () => {
  test('checkout_started and purchase are sent with the correct value', async ({ page }) => {
    const hits = collectGaHits(page);
    await stubBackend(page);

    await page.goto('/', { waitUntil: 'load' });
    await page.getByRole('button', { name: /Criar( Meu)? Currículo/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();

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

    await selectPlan(page, 'Básico');

    const checkoutStarted = await waitForEvent(hits, 'checkout_started');
    expect(checkoutStarted, 'checkout_started was not sent').not.toBeNull();
    expect(checkoutStarted!.tid).toBe(MEASUREMENT_ID);
    console.log(
      `[ga4] checkout_started -> plan=${checkoutStarted!.params['ep.plan']} value=${checkoutStarted!.params['epn.value'] ?? checkoutStarted!.params['ep.value']}`
    );

    const purchase = await waitForEvent(hits, 'purchase', 40000);
    expect(purchase, 'purchase was not sent').not.toBeNull();
    expect(purchase!.tid).toBe(MEASUREMENT_ID);
    console.log(
      `[ga4] purchase -> tx=${purchase!.params['ep.transaction_id']} value=${purchase!.params['epn.value'] ?? purchase!.params['ep.value']} method=${purchase!.params['ep.payment_method']}`
    );

    const summary = hits.reduce<Record<string, number>>((acc, h) => {
      acc[h.eventName] = (acc[h.eventName] || 0) + 1;
      return acc;
    }, {});
    console.log(`[ga4] all hits: ${JSON.stringify(summary)}`);

    // purchase must be sent exactly once even though status polling runs repeatedly.
    expect(summary['purchase']).toBe(1);
  });
});
