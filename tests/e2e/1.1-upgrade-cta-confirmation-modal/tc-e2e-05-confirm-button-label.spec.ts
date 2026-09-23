// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-05 - Confirm button labels the exact amount and is present alongside Cancel', async ({ page }) => {
    // 1. Intercept GET '**/api/billing*' with a JSON body representing a Standard-plan user whose
    // renew_at is exactly 15 days from the current date (computed at test run time, so remaining
    // days = 15 and prorated charge = (40-20) x 15/30 = $10.00), price '$20/month', plan_name
    // 'Standard', plus minimal valid 'usages' and 'included_usage' fields so the page renders
    // without error. Reload/navigate to /billing, wait for load, then click 'Upgrade to Premium'
    // (data-testid='billing-upgrade-cta-button') to open the modal.
    const renewAt = new Date();
    renewAt.setDate(renewAt.getDate() + 15);

    const mockBillingData = {
      plan_name: 'Standard',
      price: '$20/month',
      // Use a full ISO timestamp (not a bare date string) so that when the app's
      // daysRemainingInCycle() parses this back via `new Date(renewAt)` and diffs it against the
      // real current instant (which has a non-zero time-of-day component), the result is a whole
      // number of days (15), not a truncated one (14) caused by comparing a midnight timestamp
      // against a later time-of-day "now".
      renew_at: renewAt.toISOString(),
      usages: [
        {
          id: 'video-quality',
          label: 'Video quality',
          type: 'feature',
          value: 'Full HD (1080p)',
          help: 'The best video resolution available on the Standard plan.',
        },
      ],
      included_usage: {
        title: 'Plan perks',
        items: [
          { id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 },
        ],
        help: 'Perks included in your Standard plan.',
      },
    };

    await page.route('**/api/billing*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBillingData),
      });
    });

    // Each spec file runs in its own fresh browser context, which only carries the seeded
    // storageState - not an actual page navigation. The context starts at about:blank, so there is
    // no prior page for reload() to reload; navigate to /billing directly instead (the route mock
    // above was registered before this navigation, so it still intercepts the initial fetch).
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await expect(page.getByText('Loading billing...')).toHaveCount(0);

    await page.getByTestId('billing-upgrade-cta-button').click();

    // expect: The confirmation dialog is visible with 'Remaining days' = '15 days' and
    // 'Charge today' = '$10.00'
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();

    const infoBox = dialog.locator('.modal-info-box');
    const remainingDaysRow = infoBox.locator('.modal-info-row').filter({ hasText: 'Remaining days' });
    const chargeRow = infoBox.locator('.modal-info-row').filter({ hasText: 'Charge today' });

    await expect(remainingDaysRow).toContainText('15 days');
    await expect(chargeRow.locator('.modal-info-value')).toHaveText('$10.00');

    // 2. Locate the primary action button (data-testid='upgrade-modal-confirm-button') inside the
    // dialog and read its accessible name/text.
    const confirmButton = dialog.getByTestId('upgrade-modal-confirm-button');

    // expect: Its text is exactly 'Confirm & pay $10.00' (not merely containing the substring —
    // assert exact text equality)
    await expect(confirmButton).toHaveText('Confirm & pay $10.00');

    // 3. Locate the secondary action button (data-testid='upgrade-modal-cancel-button') inside the
    // same dialog, alongside the primary button (both inside the '.modal-actions' container).
    const modalActions = dialog.locator('.modal-actions');
    const cancelButton = modalActions.getByTestId('upgrade-modal-cancel-button');

    // expect: A 'Cancel' button is visible and enabled, positioned in the same actions row as the
    // Confirm button
    await expect(modalActions.getByTestId('upgrade-modal-confirm-button')).toBeVisible();
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveText('Cancel');

    // expect: Neither button is disabled at this point (modal freshly opened, no submission in
    // progress)
    await expect(confirmButton).toBeEnabled();
    await expect(cancelButton).toBeEnabled();
  });
});
