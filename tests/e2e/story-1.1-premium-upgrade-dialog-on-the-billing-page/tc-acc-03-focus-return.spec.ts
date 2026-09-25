// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Upgrade Dialog Accessibility', () => {
  test('TC-ACC-03 - Focus returns to the Upgrade button on close', async ({ page }) => {
    // 1. Sign in, focus 'Upgrade to Premium' via the keyboard, and press Enter to open the dialog.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Plan & Billing')).toBeVisible();

    const billingHeader = page.locator('.billing-header');
    const trigger = billingHeader.getByRole('button', { name: 'Upgrade to Premium', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });

    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');

    // expect: Dialog is open
    await expect(dialog).toBeVisible();

    // 2. Press Escape.
    await page.keyboard.press('Escape');

    // expect: Dialog closes
    await expect(dialog).not.toBeVisible();
    // expect: Focus is on the 'Upgrade to Premium' button (toBeFocused())
    await expect(trigger).toBeFocused();

    // 3. Open the dialog again via the keyboard, press Tab until focus reaches the 'Cancel' button
    //    inside the dialog, then press Enter.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();

    const cancelButton = dialog.getByRole('button', { name: 'Cancel', exact: true });
    await page.keyboard.press('Tab');
    await expect(cancelButton).toBeFocused();
    await page.keyboard.press('Enter');

    // expect: Dialog closes
    await expect(dialog).not.toBeVisible();
    // expect: Focus is on the 'Upgrade to Premium' button (toBeFocused())
    await expect(trigger).toBeFocused();
  });
});
