import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  fillEducation,
  fillSkills,
  fillLanguages,
  generateSummary,
  goNext,
  selectPlan,
} from './helpers';

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const viewports: Viewport[] = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14-15', width: 390, height: 844 },
  { name: 'android-pixel', width: 412, height: 915 },
  { name: 'ipad', width: 768, height: 1024 },
];

const AUDIT_DIR = path.join(process.cwd(), 'mobile-audit');

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function capture(page: Page, viewportName: string, step: string) {
  const dir = path.join(AUDIT_DIR, 'after', viewportName);
  await ensureDir(dir);
  const file = path.join(dir, `${step}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  const hasHorizontalScroll = metrics.scrollWidth > metrics.clientWidth;
  console.log(`[audit] ${viewportName}/${step} -> ${metrics.clientWidth}x${metrics.clientHeight} scroll: ${metrics.scrollWidth}x${metrics.scrollHeight} hscroll=${hasHorizontalScroll}`);
  return { file, hasHorizontalScroll, metrics };
}

async function getCLS(page: Page) {
  return page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let value = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) value += entry.value;
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(value);
      }, 200);
    });
  });
}

async function routeMocks(page: Page) {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort('blockedbyclient'));
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort('blockedbyclient'));
  await page.route('https://va.vercel-scripts.com/**', (route) => route.abort('blockedbyclient'));
  await page.route('https://sdk.mercadopago.com/**', (route) => route.fulfill({ status: 200, body: '' }));
  await page.route('**/api/leads', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'lead-123' }) });
  });
  await page.route('**/api/ai/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: 'Desenvolvedor Frontend com sólida experiência em React, Next.js e TypeScript. Busco oportunidades para criar interfaces escaláveis e de alta performance.' }),
    });
  });
  await page.route('**/api/ai/enhance', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Limite de requisições da OpenAI atingido. Tente novamente mais tarde.' }),
    });
  });
  await page.route('**/api/payment/create', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-payment-123', qr_code: 'pix-code', qr_code_base64: 'base64' }),
    });
  });
}

async function openDropdownAndCapture(page: Page, viewportName: string, fieldName: string, step: string) {
  const field = page.getByRole('combobox', { name: new RegExp(fieldName, 'i') }).or(page.locator('input[placeholder="Seu cargo na empresa"]'));
  await field.click();
  await field.fill('a');
  await page.waitForTimeout(300);
  await capture(page, viewportName, step);
  // close without selecting so the real fill helper can complete the field
  await field.press('Escape');
}

for (const viewport of viewports) {
  test(`mobile audit: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await routeMocks(page);

    await startOnApp(page);
    const landing = await capture(page, viewport.name, '01-landing');

    await fillLeadCapture(page);
    await capture(page, viewport.name, '02-personal-info');

    await fillPersonalInfo(page);
    await goNext(page);
    await capture(page, viewport.name, '03-experience');

    // Switch to preview tab to capture resume preview on mobile
    if (viewport.width < 1024) {
      await page.getByRole('button', { name: 'Preview' }).click();
      await page.waitForTimeout(200);
      await capture(page, viewport.name, '03b-preview');
      await page.getByRole('button', { name: 'Formulário' }).click();
      await page.waitForTimeout(200);
    }

    // Open Cargo SearchableSelect to check dropdown position
    await openDropdownAndCapture(page, viewport.name, 'Cargo', '04-experience-dropdown');
    await fillExperience(page);
    await goNext(page);
    await capture(page, viewport.name, '05-education');

    await fillEducation(page);
    await goNext(page);
    await capture(page, viewport.name, '06-skills');

    await fillSkills(page);
    await goNext(page);
    await capture(page, viewport.name, '07-languages');

    // Open language dropdown for a screenshot
    await openDropdownAndCapture(page, viewport.name, 'Nome do Idioma', '08-languages-dropdown');
    await fillLanguages(page);
    await goNext(page);
    await capture(page, viewport.name, '09-summary');

    await generateSummary(page);
    await goNext(page); // summary -> pricing
    await capture(page, viewport.name, '10-pricing');

    await page.route('**/api/payment/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-payment-123', qr_code: 'pix-code', qr_code_base64: 'base64' }),
      });
    });
    await selectPlan(page, 'Básico');
    await capture(page, viewport.name, '11-checkout-pix');

    // Switch to card tab
    const cardTab = page.getByRole('button', { name: /Cartão/i });
    if (await cardTab.isVisible().catch(() => false)) {
      await cardTab.click();
      await page.waitForTimeout(500);
      await capture(page, viewport.name, '13-checkout-card');
    }

    const cls = await getCLS(page);
    console.log(`[audit] ${viewport.name} total CLS: ${cls.toFixed(4)}`);

    // Save raw metrics
    const reportFile = path.join(AUDIT_DIR, 'before', `${viewport.name}-metrics.json`);
    await ensureDir(path.join(AUDIT_DIR, 'before'));
    fs.writeFileSync(reportFile, JSON.stringify({ cls, viewport }, null, 2));
  });
}
