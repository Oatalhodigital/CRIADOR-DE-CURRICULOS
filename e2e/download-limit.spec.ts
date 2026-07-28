import { test, expect } from '@playwright/test';

test.describe('Download API behavior', () => {
  test('browser navigation is redirected instead of raw JSON', async ({ request }) => {
    const res = await request.get('/api/download/invalid-id', {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
      },
      maxRedirects: 0,
      timeout: 60000,
    });

    expect(res.status()).toBe(307);
    const location = res.headers()['location'];
    expect(location).toMatch(/\/(\?error=.*)?$/);
    const body = await res.text();
    expect(body).not.toContain('error');
  });

  test('non-browser request receives JSON error', async ({ request }) => {
    const res = await request.get('/api/download/invalid-id', {
      headers: {
        Accept: 'application/json',
      },
      timeout: 60000,
    });

    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Pedido não encontrado.');
  });
});
