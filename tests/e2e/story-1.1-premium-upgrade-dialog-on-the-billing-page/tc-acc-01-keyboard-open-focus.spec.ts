// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Upgrade Dialog Accessibility', () => {
  test('TC-ACC-01 - Dialog opens from the keyboard and receives focus', async ({ page }) => {
    // 1. Sign in, then move keyboard focus to the 'Upgrade to Premium' button (e.g. Tab through the
    //    page or focus the button directly to simulate arriving there via Tab), then press Enter.
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

    // expect: The dialog opens (role='dialog' visible)
    await expect(dialog).toBeVisible();
    // expect: Keyboard focus (document.activeElement) is inside the dialog - either the dialog
    // container itself or its first focusable control - not left on the page behind it
    await expect(dialog).toBeFocused();

    // 2. Press Escape to close, refocus 'Upgrade to Premium', then press Space instead of Enter.
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Space');

    // expect: The dialog opens again
    await expect(dialog).toBeVisible();
    // expect: Focus again moves inside the dialog
    await expect(dialog).toBeFocused();

    // 3. Cleanup: press Escape.
    await page.keyboard.press('Escape');

    // expect: Dialog closed
    await expect(dialog).not.toBeVisible();
  });
});
