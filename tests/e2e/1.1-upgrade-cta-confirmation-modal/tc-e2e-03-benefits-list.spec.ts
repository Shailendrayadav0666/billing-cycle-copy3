// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-03 - Modal lists exactly the 3 approved benefits, never Dolby Vision', async ({ page }) => {
    // 1. Navigate to /billing (live GET /api/billing response is fine — remaining-days/charge
    // values are irrelevant to this test), wait for load, then click 'Upgrade to Premium'
    // (data-testid='billing-upgrade-cta-button') to open the modal.
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await page.getByTestId('billing-upgrade-cta-button').click();

    // expect: The confirmation dialog (role='dialog') is visible
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();

    // 2. Locate the benefits list (ul.modal-benefits) inside the open dialog and collect all of
    // its <li> items' text contents.
    const benefitItems = dialog.locator('ul.modal-benefits li');

    // expect: The list contains exactly 3 <li> items (assert count === 3, not >= 3)
    await expect(benefitItems).toHaveCount(3);

    // expect: The 3 items' texts are exactly, and only: 'Stream on 4 devices at once', 'Download
    // on 4 devices', '4K + HDR video quality'
    await expect(benefitItems).toHaveText([
      'Stream on 4 devices at once',
      'Download on 4 devices',
      '4K + HDR video quality',
    ]);

    // 3. Search the entire dialog's text content (or each individual li) for the substring
    // 'Dolby Vision'.
    // expect: 'Dolby Vision' does not appear anywhere inside the dialog
    await expect(dialog).not.toContainText('Dolby Vision');
  });
});
