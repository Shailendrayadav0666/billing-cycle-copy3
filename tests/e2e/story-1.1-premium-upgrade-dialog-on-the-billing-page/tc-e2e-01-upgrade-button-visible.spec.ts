// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-01 - Standard subscriber sees the Upgrade to Premium button', async ({ page }) => {
    // 1. Sign in as tpg@example.com / password (per seed) and land on /billing.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();

    // 2. Locate the .billing-header title row (the container holding the 'Plan & Billing' heading).
    const billingHeader = page.locator('.billing-header');
    await expect(
      billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true })
    ).toBeVisible();

    // 3. Inspect the rest of the Billing page.
    await expect(page.getByText('Current plan: Standard')).toBeVisible();
    await expect(page.getByText('$20/month')).toBeVisible();
  });
});
