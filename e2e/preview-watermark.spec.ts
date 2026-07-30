import { test, expect } from '@playwright/test';
import {
  startOnApp,
  fillLeadCapture,
  fillPersonalInfo,
  fillExperience,
  goNext,
} from './helpers';

test.describe('Preview watermark', () => {
  test('shows the full resume with a watermark and no progressive blur', async ({ page }) => {
    await startOnApp(page);
    await fillLeadCapture(page);
    await fillPersonalInfo(page);
    await goNext(page);
    await fillExperience(page);

    const watermark = page.getByTestId('preview-watermark');
    await expect(watermark).toBeVisible();

    // The watermark must be a non-interactive overlay carrying the preview mark.
    const overlay = await watermark.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        pointerEvents: style.pointerEvents,
        backdropFilter: style.backdropFilter,
        hasBackgroundImage: style.backgroundImage.includes('data:image/svg+xml'),
        hasPreviewText: decodeURIComponent(style.backgroundImage).includes('PRÉVIA'),
      };
    });

    expect(overlay.pointerEvents).toBe('none');
    expect(overlay.hasBackgroundImage).toBe(true);
    expect(overlay.hasPreviewText).toBe(true);
    // No progressive blur anymore: the content must stay fully readable.
    expect(['none', '']).toContain(overlay.backdropFilter);

    // Content below the old 45% blur cut-off must now be readable.
    const sheet = page.locator('.max-w-\\[210mm\\]').first();
    await expect(sheet).toContainText('Empresa Teste');
    await expect(sheet).toContainText('Desenvolvedor Frontend');

    // Anti-copy protection must remain on the unpaid sheet.
    const userSelect = await sheet.evaluate((el) => window.getComputedStyle(el).userSelect);
    expect(userSelect).toBe('none');

    // The payment CTA must remain visible next to the full preview.
    await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeVisible();
    await expect(page.getByText(/marca d.água/i).first()).toBeVisible();
  });
});
