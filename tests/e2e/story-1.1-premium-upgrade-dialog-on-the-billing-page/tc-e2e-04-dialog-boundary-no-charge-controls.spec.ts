// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-04 - Dialog shell shows no charge or confirm controls yet (boundary)', async ({
    page,
  }) => {
    // 1. Sign in and open the upgrade dialog by clicking 'Upgrade to Premium'.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Plan & Billing')).toBeVisible();

    await page.getByRole('button', { name: 'Upgrade to Premium', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();

    // 2. Search the dialog for the text 'Remaining days'.
    await expect(dialog.getByText('Remaining days')).toHaveCount(0);

    // 3. Search the dialog for the text 'Charge today'.
    await expect(dialog.getByText('Charge today')).toHaveCount(0);

    // 4. Search the dialog for a button named 'Confirm & pay'.
    await expect(dialog.getByRole('button', { name: 'Confirm & pay' })).toHaveCount(0);

    // 5. Re-inspect the benefit list.
    const benefitItems = dialog.locator('.upgrade-benefits li');
    await expect(benefitItems).toHaveText([
      '4K Ultra HD video quality',
      'Stream on 4 devices at once',
      'Download on 6 devices',
      'Dolby Vision (select titles)',
    ]);
    await expect(dialog.getByText('Download on 4 devices', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('4K + HDR', { exact: true })).toHaveCount(0);

    // 6. Cleanup: click 'Cancel' to close the dialog.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
});
