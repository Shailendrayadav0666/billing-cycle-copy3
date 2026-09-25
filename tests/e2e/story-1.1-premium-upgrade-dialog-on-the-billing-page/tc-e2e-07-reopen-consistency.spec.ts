// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-07 - Reopening after dismissal shows the same dialog (boundary)', async ({
    page,
  }) => {
    // 1. Sign in as tpg@example.com / password.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();

    const billingHeader = page.locator('.billing-header');
    const upgradeButton = billingHeader.getByRole('button', {
      name: 'Upgrade to Premium',
      exact: true,
    });
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });

    // Verifies the dialog title, the explanatory paragraph, both summary rows, the 4-item
    // benefit list and the 'Cancel' button all match TC-E2E-03's exact content.
    const verifyDialogContent = async () => {
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('heading', { name: 'Upgrade to Premium', exact: true })
      ).toHaveText('Upgrade to Premium');
      await expect(
        dialog.getByText(
          "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.",
          { exact: true }
        )
      ).toBeVisible();

      const currentPlanRow = dialog.locator('.upgrade-summary-row', { hasText: 'Current plan' });
      await expect(currentPlanRow.locator('dt')).toHaveText('Current plan');
      await expect(currentPlanRow.locator('dd')).toHaveText('Standard ($20/mo)');

      const newPlanRow = dialog.locator('.upgrade-summary-row', { hasText: 'New plan' });
      await expect(newPlanRow.locator('dt')).toHaveText('New plan');
      await expect(newPlanRow.locator('dd')).toHaveText('Premium ($40/mo)');

      const benefitItems = dialog.locator('.upgrade-benefits li');
      await expect(benefitItems).toHaveText([
        '4K Ultra HD video quality',
        'Stream on 4 devices at once',
        'Download on 6 devices',
        'Dolby Vision (select titles)',
      ]);

      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    };

    // Verifies the page still shows the unchanged Standard/$20/month/Oct 30, 2026 data with the
    // 'Upgrade to Premium' button visible.
    const verifyPageUnchanged = async () => {
      await expect(page.getByText('Current plan: Standard')).toBeVisible();
      await expect(page.getByText('$20/month')).toBeVisible();
      await expect(page.getByText('Oct 30, 2026')).toBeVisible();
      await expect(upgradeButton).toBeVisible();
    };

    // 2. Repeat three times: click 'Upgrade to Premium'; verify the dialog title, the explanatory
    //    paragraph, both summary rows, the 4-item benefit list and the 'Cancel' button all match
    //    TC-E2E-03's exact content; then click 'Cancel'.
    for (let i = 0; i < 3; i += 1) {
      await upgradeButton.click();
      await verifyDialogContent();

      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await verifyPageUnchanged();
    }

    // 3. Open the dialog a fourth time.
    await upgradeButton.click();
    await verifyDialogContent();
    await expect(page.getByRole('dialog', { name: 'Upgrade to Premium' })).toHaveCount(1);
    await verifyPageUnchanged();

    // 4. Cleanup: click 'Cancel'.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
});
