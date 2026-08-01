import { test, expect, Page, Request } from '@playwright/test';

const MEASUREMENT_ID = 'G-FQCJ664XNB';
const COLLECT_RE = /google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/;

interface Hit {
  eventName: string;
  tid: string;
  url: string;
}

/**
 * GA4 sends hits to /g/collect. Single hits carry the event name in the `en`
 * query param; batched hits carry one `en=` per line in the POST body.
 */
function parseHits(request: Request): Hit[] {
  const url = new URL(request.url());
  const tid = url.searchParams.get('tid') || '';
  const hits: Hit[] = [];

  const queryEvent = url.searchParams.get('en');
  if (queryEvent) {
    hits.push({ eventName: queryEvent, tid, url: request.url() });
  }

  const body = request.postData();
  if (body) {
    for (const line of body.split('\n')) {
      if (!line.trim()) continue;
      const params = new URLSearchParams(line);
      const name = params.get('en');
      if (name) {
        hits.push({ eventName: name, tid: params.get('tid') || tid, url: request.url() });
      }
    }
  }

  return hits;
}

function collectGaHits(page: Page) {
  const hits: Hit[] = [];
  page.on('request', (request) => {
    if (COLLECT_RE.test(request.url())) {
      hits.push(...parseHits(request));
    }
  });
  return hits;
}

async function waitForEvent(hits: Hit[], eventName: string, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hits.some((h) => h.eventName === eventName)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

test.describe('GA4 in production', () => {
  test('gtag loads and funnel events are actually sent', async ({ page }) => {
    const hits = collectGaHits(page);

    const gtagScripts: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('googletagmanager.com/gtag/js')) {
        gtagScripts.push(request.url());
      }
    });

    // Avoid writing a real lead to the production database.
    await page.route('**/api/leads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'prod-validation-no-op' }),
      });
    });

    await page.goto('/', { waitUntil: 'load' });

    // 1. The gtag library must be requested with the correct measurement ID.
    await expect
      .poll(() => gtagScripts.length, { timeout: 30000, message: 'gtag/js was never requested' })
      .toBeGreaterThan(0);
    expect(gtagScripts[0]).toContain(`id=${MEASUREMENT_ID}`);
    console.log(`[ga4] gtag/js requested: ${gtagScripts[0]}`);

    // 2. window.gtag must exist after hydration.
    await expect
      .poll(() => page.evaluate(() => typeof (window as any).gtag), { timeout: 30000 })
      .toBe('function');

    // 3. The automatic page_view hit must reach /g/collect with the right tid.
    expect(await waitForEvent(hits, 'page_view', 30000), 'page_view was not sent').toBe(true);
    const pageView = hits.find((h) => h.eventName === 'page_view')!;
    expect(pageView.tid).toBe(MEASUREMENT_ID);
    console.log(`[ga4] page_view tid=${pageView.tid}`);

    // 4. lead_captured
    await page.getByRole('button', { name: /Criar( Meu)? Currículo/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();

    await page.locator('#lead-name').fill('Validacao GA4');
    await page.locator('#lead-email').fill('validacao-ga4@exemplo.com');
    await page.locator('#lead-whatsapp').fill('11999999999');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Informações Pessoais' })).toBeVisible();
    expect(await waitForEvent(hits, 'lead_captured'), 'lead_captured was not sent').toBe(true);
    console.log('[ga4] lead_captured confirmed');

    // 5. step_completed (advance one step of the form)
    await page.getByPlaceholder('Seu nome completo', { exact: true }).fill('Validacao GA4');
    await page.getByPlaceholder('seu@email.com', { exact: true }).fill('validacao-ga4@exemplo.com');
    await page.getByRole('button', { name: 'Próximo' }).click();
    expect(await waitForEvent(hits, 'step_completed'), 'step_completed was not sent').toBe(true);
    console.log('[ga4] step_completed confirmed');

    const summary = hits.reduce<Record<string, number>>((acc, h) => {
      acc[h.eventName] = (acc[h.eventName] || 0) + 1;
      return acc;
    }, {});
    console.log(`[ga4] all hits captured: ${JSON.stringify(summary)}`);

    // Every hit must belong to the configured property.
    for (const hit of hits) {
      expect(hit.tid, `unexpected tid on ${hit.eventName}`).toBe(MEASUREMENT_ID);
    }
  });
});
