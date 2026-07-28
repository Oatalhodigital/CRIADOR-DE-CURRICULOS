import { Page, expect } from '@playwright/test';

export const TEST_CEP = '01001000';
export const TEST_PAYMENT_ID = 'test-payment-123';

export async function startOnApp(page: Page) {
  // Bloqueia recursos externos que podem pendurar o evento load em ambientes sem rede
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort('blockedbyclient'));
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort('blockedbyclient'));
  await page.route('https://va.vercel-scripts.com/**', (route) => route.abort('blockedbyclient'));

  await page.goto('/', { waitUntil: 'load' });
  await page
    .getByRole('button', { name: /Criar( Meu)? Currículo/i })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Vamos Começar!' })
  ).toBeVisible();
}

export async function fillLeadCapture(page: Page) {
  await page.route('**/api/leads', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, id: 'lead-123' }),
    });
  });

  await page.locator('#lead-name').fill('Usuário Teste');
  await page.locator('#lead-email').fill('teste@exemplo.com');
  await page.locator('#lead-whatsapp').fill('11999999999');
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Informações Pessoais' })
  ).toBeVisible();

  await expect(page.locator('#lead-name')).toBeHidden();
}

export async function fillPersonalInfo(page: Page) {
  await page.getByPlaceholder('Seu nome completo', { exact: true }).fill('Usuário Teste');
  await page.getByPlaceholder('seu@email.com', { exact: true }).fill('teste@exemplo.com');
  await page.getByPlaceholder('(00) 00000-0000', { exact: true }).fill('11999999999');

  await page.route(`https://viacep.com.br/ws/${TEST_CEP}/json/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
      }),
    });
  });

  const cep = page.getByPlaceholder('00000-000', { exact: true });
  for (const char of TEST_CEP) {
    await cep.type(char, { delay: 50 });
  }

  await expect(page.getByPlaceholder('Rua / Avenida', { exact: true })).toHaveValue(
    'Praça da Sé',
    { timeout: 5000 }
  );
  await expect(page.getByPlaceholder('Bairro', { exact: true })).toHaveValue('Sé');
  await expect(page.getByPlaceholder('Digite a cidade', { exact: true })).toHaveValue('São Paulo');
  await page.getByRole('combobox').nth(0).selectOption('SP');
}

export async function goNext(page: Page) {
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.waitForTimeout(300);
}

export async function fillExperience(page: Page) {
  await page.getByPlaceholder('Nome da empresa').fill('Empresa Teste');

  const position = page
    .getByRole('combobox', { name: /Cargo/i })
    .or(page.locator('input[placeholder="Seu cargo na empresa"]'));
  await position.click();
  await position.fill('Desenvolvedor Frontend');
  await page.getByText('Desenvolvedor Frontend').first().click();

  await page.getByLabel('Emprego atual').check();
  const description = page.getByPlaceholder(
    'Descreva suas responsabilidades e conquistas...'
  );
  await description.fill('Trabalhei com React e Next.js.');

  await page.getByRole('button', { name: 'Adicionar Experiência' }).click();
}

export async function fillEducation(page: Page) {
  await page.getByPlaceholder('Nome da instituição').fill('Universidade Teste');

  const degree = page.getByLabel('Grau/Diploma');
  await degree.click();
  await degree.fill('Bacharelado');
  await page.getByRole('option', { name: 'Bacharelado' }).first().click();

  const field = page.getByLabel('Área de Estudo');
  await field.click();
  await field.fill('Ciência da Computação');
  await page.getByRole('option', { name: 'Ciência da Computação' }).first().click();

  await page.getByLabel('Cursando atualmente').check();
  await page.getByRole('button', { name: 'Adicionar Formação' }).click();
}

export async function fillSkills(page: Page) {
  const skill = page.getByLabel('Nome da Habilidade');
  await skill.click();
  await skill.fill('React');
  await page.getByRole('option', { name: 'React' }).first().click();
  await page.getByRole('button', { name: 'Adicionar Habilidade' }).click();
}

export async function fillLanguages(page: Page) {
  const language = page.getByLabel('Nome do Idioma');
  await language.click();
  await language.fill('Inglês');
  await page.getByRole('option', { name: 'Inglês' }).first().click();
  await page.getByRole('button', { name: 'Adicionar Idioma' }).click();
}

export async function generateSummary(page: Page) {
  await page.route('**/api/ai/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary:
          'Desenvolvedor Frontend com sólida experiência em React, Next.js e TypeScript. Busco oportunidades para criar interfaces escaláveis e de alta performance.',
      }),
    });
  });

  await page.getByRole('button', { name: 'Gerar com IA' }).click();
}

export async function selectPlan(page: Page, planName: string) {
  const card = page.locator('div.rounded-2xl').filter({ hasText: planName });
  await card.getByRole('button', { name: 'Selecionar' }).click();
  await expect(page.getByRole('heading', { name: 'Finalizar Pagamento' })).toBeVisible();
}

export function mockMercadoPagoScript(mockBody: string) {
  return `
    window.__mpCreateCalls = window.__mpCreateCalls || [];
    window.MercadoPago = function(publicKey, options) {
      return {
        bricks: function() {
          return {
            create: async function(type, container, settings) {
              window.__mpCreateCalls.push({ type, container, settings, publicKey });
              ${mockBody}
            }
          };
        }
      };
    };
  `;
}
