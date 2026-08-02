import { test, expect } from '@playwright/test';

const GOOGLE_BUTTON_TEXT = /Entrar com Google/i;

async function openLeadModal(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .getByRole('button', { name: /Criar( Meu)? Currículo/i })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
}

test.describe('Google login redirect flow', () => {
  test('clicking Google login starts a Firebase redirect', async ({ page, context }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const redirectPromise = authDomain
      ? page.waitForURL(new RegExp(`https://${authDomain.replace(/\./g, '\\.')}`), { waitUntil: 'commit' })
      : page.waitForURL(/accounts\.google\.com|firebaseapp\.com|__\/auth\/handler/, { waitUntil: 'commit' });

    await openLeadModal(page);
    await page.getByRole('button', { name: GOOGLE_BUTTON_TEXT }).click();

    await redirectPromise;

    const url = page.url();
    expect(url).toMatch(/providerId=google\.com/);

    // Back on the same tab after redirect the test cannot continue, but we check
    // that no unhandled error happened before navigation.
    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('toolbar.js') &&
        !e.includes('Firebase auth failed') &&
        !e.includes('auth')
    );
    expect(critical).toEqual([]);
  });

  test('modal stays functional after a simulated return from redirect', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await openLeadModal(page);

    // Simulate returning from a redirect by adding the hash that Firebase uses
    // to trigger getRedirectResult on next load. This will make the SDK try to
    // process the result; if it fails it should not crash the modal.
    await page.evaluate(() => {
      window.location.hash = '__firebase_request_key=mock-key&apiKey=test&appName=%5BDEFAULT%5D&authType=signInViaRedirect&providerId=google.com&scopes=email,profile&redirectUrl=http%3A%2F%2Flocalhost%3A3001%2F&v=1';
    });

    // Reload so getRedirectResult runs with the simulated hash.
    await page.reload({ waitUntil: 'load' });
    await page
      .getByRole('button', { name: /Criar( Meu)? Currículo/i })
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
    await expect(page.getByRole('button', { name: GOOGLE_BUTTON_TEXT })).toBeVisible();

    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('toolbar.js') &&
        !e.includes('Cross-Origin-Opener-Policy') &&
        !e.includes('Firebase') &&
        !e.includes('auth')
    );
    expect(critical).toEqual([]);
  });
});
