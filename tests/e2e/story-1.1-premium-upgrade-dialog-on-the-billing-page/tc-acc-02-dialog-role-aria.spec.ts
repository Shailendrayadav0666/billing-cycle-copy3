// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Upgrade Dialog Accessibility', () => {
  test('TC-ACC-02 - Dialog is exposed as a labelled modal dialog', async ({ page }) => {
    // 1. Sign in and open the dialog via 'Upgrade to Premium'.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Plan & Billing')).toBeVisible();

    const billingHeader = page.locator('.billing-header');
    const trigger = billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium', exact: true });

    await trigger.click();

    // expect: Dialog visible
    await expect(dialog).toBeVisible();

    // 2. Inspect the dialog element's role and ARIA attributes.
    // expect: An element with role='dialog' exists
    // expect: That element has aria-modal='true'
    // expect: Its accessible name is exactly 'Upgrade to Premium'
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.getByRole('dialog', { name: 'Upgrade to Premium', exact: true })).toBeVisible();

    // 3. Cleanup: press Escape.
    await page.keyboard.press('Escape');

    // expect: Dialog closed
    await expect(dialog).not.toBeVisible();
  });
});
