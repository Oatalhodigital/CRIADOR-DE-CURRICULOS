import { test, expect } from '@playwright/test';

const GOOGLE_BUTTON_TEXT = /Entrar com Google/i;

/**
 * Valida em producao a correcao do login com Google: o retorno do
 * signInWithRedirect recarrega a pagina inteira, e o usuario precisa continuar
 * no mesmo ponto do funil, com os dados preservados e sem erro cru do Firebase.
 */
test.describe('Google login state in production', () => {
  test('a full page reload after the Google redirect keeps the funnel state', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .getByRole('button', { name: /Criar( Meu)? Currículo/i })
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
    await page.locator('#lead-name').fill('Maria Teste');
    await page.locator('#lead-whatsapp').fill('11988887777');

    // Marca o login como pendente (o que handleGoogleLogin faz antes de sair da
    // pagina) e recarrega, reproduzindo o retorno do provedor.
    await page.evaluate(() => {
      sessionStorage.setItem(
        'leadCaptureForm',
        JSON.stringify({ name: 'Maria Teste', email: '', whatsapp: '11988887777', consentMarketing: false })
      );
      sessionStorage.setItem('googleLoginPending', '1');
    });
    await page.reload({ waitUntil: 'load' });

    await expect(page.getByRole('heading', { name: 'Vamos Começar!' })).toBeVisible();
    await expect(page.locator('#lead-name')).toHaveValue('Maria Teste');
    await expect(page.locator('#lead-whatsapp')).toHaveValue('11988887777');
    await expect(page.getByRole('button', { name: GOOGLE_BUTTON_TEXT })).toBeEnabled();
    await expect(page.locator('#lead-error')).toContainText(/Login com Google não foi concluído/i);

    const bodyText = (await page.locator('body').innerText()) || '';
    expect(bodyText).not.toMatch(/INTERNAL ASSERTION|auth\/[a-z-]+|FirebaseError/i);
  });
});
