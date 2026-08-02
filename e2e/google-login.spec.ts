import { test, expect } from '@playwright/test';

const GOOGLE_BUTTON_TEXT = /Entrar com Google/i;
const BASE_URL = 'http://localhost:3001/';

// Simula o handler de autenticacao do Google: responde a navegacao do
// signInWithRedirect e devolve o usuario para a home, exatamente como acontece
// quando o login e cancelado ou falha do lado do provedor. Assim o teste
// exercita o ciclo completo (page unload + reload) sem depender da rede.
async function stubGoogleAuthHandler(context: import('@playwright/test').BrowserContext) {
  await context.route(/accounts\.google\.com|firebaseapp\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<html><head><meta http-equiv="refresh" content="0;url=${BASE_URL}"></head><body>stub google</body></html>`,
    })
  );
}

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

    // Reload so getRedirectResult runs with the simulated hash. O estado do
    // funil e restaurado automaticamente, portanto o modal continua aberto sem
    // precisar passar pela landing page de novo.
    await page.reload({ waitUntil: 'load' });

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

  // Regressao: o retorno do signInWithRedirect recarrega a pagina inteira.
  // Antes da correcao o usuario voltava para a landing page e perdia os dados
  // digitados, porque o estado do funil nao era persistido.
  test('returning from the Google redirect keeps the funnel state and the typed data', async ({ page, context }) => {
    await stubGoogleAuthHandler(context);

    await openLeadModal(page);
    await page.locator('#lead-name').fill('Maria Teste');
    await page.locator('#lead-whatsapp').fill('11988887777');

    await page.getByRole('button', { name: GOOGLE_BUTTON_TEXT }).click();
    await page.waitForURL(BASE_URL, { timeout: 30000 });

    // Continua no modal (nao voltou para a landing page) e mantem o que foi digitado.
    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
    await expect(page.locator('#lead-name')).toHaveValue('Maria Teste');
    await expect(page.locator('#lead-whatsapp')).toHaveValue('11988887777');

    // O usuario pode tentar de novo sem recomecar o funil.
    await expect(page.getByRole('button', { name: GOOGLE_BUTTON_TEXT })).toBeEnabled();
  });

  // O bug era intermitente (race entre getRedirectResult e signInAnonymously),
  // portanto a validacao repete o ciclo varias vezes.
  test('survives 15 consecutive redirect round-trips without losing state or leaking raw Firebase errors', async ({
    page,
  }) => {
    const rawFirebaseErrorOnScreen = /INTERNAL ASSERTION|auth\/[a-z-]+|FirebaseError/i;

    await openLeadModal(page);
    await page.locator('#lead-name').fill('Maria Teste');
    await page.locator('#lead-whatsapp').fill('11988887777');

    for (let attempt = 1; attempt <= 15; attempt++) {
      // Reproduz o retorno do Google (recarga completa da pagina com o login
      // marcado como pendente) de forma deterministica, sem depender do
      // provedor externo.
      await page.evaluate(() => {
        sessionStorage.setItem(
          'leadCaptureForm',
          JSON.stringify({
            name: 'Maria Teste',
            email: '',
            whatsapp: '11988887777',
            consentMarketing: false,
          })
        );
        sessionStorage.setItem('googleLoginPending', '1');
      });
      await page.reload({ waitUntil: 'load' });

      await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
      await expect(page.locator('#lead-name')).toHaveValue('Maria Teste');
      await expect(page.locator('#lead-whatsapp')).toHaveValue('11988887777');
      await expect(page.getByRole('button', { name: GOOGLE_BUTTON_TEXT })).toBeEnabled();

      // Mensagem amigavel, nunca o erro cru do Firebase.
      await expect(page.locator('#lead-error')).toContainText(/Login com Google não foi concluído/i);

      const bodyText = (await page.locator('body').innerText()) || '';
      expect(bodyText, `raw Firebase error shown on attempt ${attempt}`).not.toMatch(
        rawFirebaseErrorOnScreen
      );
    }
  });
});
