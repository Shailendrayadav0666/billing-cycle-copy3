// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-03 - Opening the dialog shows the plan comparison and Premium benefits', async ({
    page,
  }) => {
    // 1. Sign in as tpg@example.com / password and land on /billing. Begin tracking outgoing
    //    requests for URLs containing '/api/billing/upgrade-preview' or '/api/billing/upgrade'.
    const upgradeRequestUrls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/billing/upgrade-preview') || url.includes('/api/billing/upgrade')) {
        upgradeRequestUrls.push(url);
      }
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Plan & Billing')).toBeVisible();

    expect(upgradeRequestUrls).toEqual([]);

    // 2. Click the 'Upgrade to Premium' button in .billing-header.
    const billingHeader = page.locator('.billing-header');
    await billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true }).click();

    const backdrop = page.locator('.upgrade-overlay');
    const dialog = backdrop.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(backdrop).toHaveCSS('background-color', 'rgba(11, 18, 32, 0.5)');

    // 3. Read the dialog title.
    await expect(dialog.getByRole('heading', { name: 'Upgrade to Premium', exact: true })).toHaveText(
      'Upgrade to Premium'
    );

    // 4. Read the dialog's explanatory paragraph.
    await expect(
      dialog.getByText(
        "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.",
        { exact: true }
      )
    ).toBeVisible();

    // 5. Read the plan comparison summary rows inside the dialog.
    const currentPlanRow = dialog.locator('.upgrade-summary-row', { hasText: 'Current plan' });
    await expect(currentPlanRow.locator('dt')).toHaveText('Current plan');
    await expect(currentPlanRow.locator('dd')).toHaveText('Standard ($20/mo)');

    const newPlanRow = dialog.locator('.upgrade-summary-row', { hasText: 'New plan' });
    await expect(newPlanRow.locator('dt')).toHaveText('New plan');
    await expect(newPlanRow.locator('dd')).toHaveText('Premium ($40/mo)');

    // 6. Read the benefit list inside the dialog.
    const benefitItems = dialog.locator('.upgrade-benefits li');
    await expect(benefitItems).toHaveText([
      '4K Ultra HD video quality',
      'Stream on 4 devices at once',
      'Download on 6 devices',
      'Dolby Vision (select titles)',
    ]);

    // 7. Look for a dismiss control in the dialog.
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();

    // 8. Inspect the tracked requests collected since the button click.
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade-preview'))).toBe(
      false
    );
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade'))).toBe(false);
  });
});
