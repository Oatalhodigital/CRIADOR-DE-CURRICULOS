import { test, expect } from '@playwright/test';

const PIXEL_RE = /facebook\.com\/tr/;
const COLLECT_RE = /connect\.facebook\.net\/en_US\/fbevents\.js/;

interface FbqHit {
  command: string;
  event?: string;
  params?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

function parseFbqCall(raw: string): FbqHit | null {
  // fbq('track', 'Purchase', {...}, {eventID: '...'})
  const match = raw.match(/fbq\(['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?\s*,?\s*(.*)\)/);
  if (!match) return null;

  const [, command, eventName, rest] = match;

  let params: Record<string, unknown> = {};
  let options: Record<string, unknown> = {};

  try {
    const args = rest.split(/,\s*(?![^{]*})/).filter(Boolean);
    if (args[0]) {
      params = new Function(`return ${args[0]}`)() as Record<string, unknown>;
    }
    if (args[1]) {
      options = new Function(`return ${args[1]}`)() as Record<string, unknown>;
    }
  } catch {
    // ignore parse errors
  }

  return { command, event: eventName, params, options };
}

test.describe('Meta Pixel in production', () => {
  test('loads Pixel base and fires PageView on landing', async ({ page }) => {
    const scriptRequests: string[] = [];
    const networkHits: FbqHit[] = [];

    page.on('request', (request) => {
      if (COLLECT_RE.test(request.url())) {
        scriptRequests.push(request.url());
      }
      if (PIXEL_RE.test(request.url())) {
        const url = new URL(request.url());
        const ev = url.searchParams.get('ev');
        const eid = url.searchParams.get('eid');
        if (ev) {
          networkHits.push({ command: 'track', event: ev, options: eid ? { eventID: eid } : undefined });
        }
      }
    });

    const response = await page.goto('https://www.xn--currculorapidocomia-o1b.com.br', {
      waitUntil: 'load',
    });
    const html = (await response?.text()) || '';

    if (!/connect\.facebook\.net\/en_US\/fbevents\.js/.test(html)) {
      test.skip(true, 'NEXT_PUBLIC_META_PIXEL_ID not configured on production');
    }

    // O Pixel usa strategy="afterInteractive": o script e o primeiro hit saem
    // depois do evento load, por isso a espera explicita.
    await expect
      .poll(() => scriptRequests.length, { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => networkHits.filter((h) => h.event === 'PageView').length, { timeout: 30000 })
      .toBeGreaterThan(0);
  });
});
