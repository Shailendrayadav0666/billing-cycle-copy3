// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-06 - Dismiss with Escape and with a backdrop click (and non-dismissal on inside click)', async ({
    page,
  }) => {
    // 1. Sign in and begin tracking requests to '/api/billing/upgrade-preview' and
    //    '/api/billing/upgrade' for the whole test.
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

    const billingHeader = page.locator('.billing-header');
    const trigger = billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });

    // 2. Open the dialog via 'Upgrade to Premium', then press Escape.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('Current plan: Standard')).toBeVisible();
    await expect(page.getByText('$20/month')).toBeVisible();
    await expect(trigger).toBeVisible();

    // 3. Open the dialog again, then click on the backdrop overlay (.upgrade-overlay) at a point clearly
    //    outside the bounding box of the white dialog card (.upgrade-dialog) - e.g. click position
    //    (x:10, y:10) on the overlay, confirmed outside the card in this viewport.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.locator('.upgrade-overlay').click({ position: { x: 10, y: 10 } });
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('Current plan: Standard')).toBeVisible();
    await expect(page.getByText('$20/month')).toBeVisible();
    await expect(trigger).toBeVisible();

    // 4. Open the dialog a third time, then click inside the dialog card on a non-button area, for
    //    example the benefit list (<ul>).
    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.upgrade-benefits').click();
    await expect(dialog).toBeVisible();

    // 5. Cleanup: click 'Cancel' to close the dialog.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    // Inspect tracked requests across the whole test - no upgrade request should ever have been sent.
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade-preview'))).toBe(
      false
    );
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade'))).toBe(false);
  });
});
