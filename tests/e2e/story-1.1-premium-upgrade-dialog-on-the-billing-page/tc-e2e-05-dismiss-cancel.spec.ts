// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-05 - Dismiss with Cancel leaves the page unchanged', async ({ page }) => {
    // 1. Sign in, open the dialog via 'Upgrade to Premium', and begin tracking requests to
    //    '/api/billing/upgrade-preview' and '/api/billing/upgrade'.
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
    await billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();

    // 2. Click the 'Cancel' button inside the dialog.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    // 3. Inspect the Billing page state.
    await expect(page.getByText('Current plan: Standard')).toBeVisible();
    await expect(page.getByText('$20/month')).toBeVisible();
    await expect(page.getByText('Oct 30, 2026')).toBeVisible();
    await expect(
      billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true })
    ).toBeVisible();

    // 4. Inspect tracked requests.
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade-preview'))).toBe(
      false
    );
    expect(upgradeRequestUrls.some((url) => url.includes('/api/billing/upgrade'))).toBe(false);
  });
});
