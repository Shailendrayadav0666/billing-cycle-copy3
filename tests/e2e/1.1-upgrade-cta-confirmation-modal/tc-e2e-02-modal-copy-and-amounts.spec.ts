// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-02 - Clicking the CTA opens the confirmation modal with correct copy and amounts', async ({ page }) => {
    // 1. Before navigating/interacting, intercept GET '**/api/billing*' and fulfill it with a
    // JSON body representing a Standard-plan user whose renew_at is exactly 15 days from the
    // current date (computed at test run time), price '$20/month', plan_name 'Standard', plus
    // minimal valid 'usages' and 'included_usage' fields so the page renders without error.
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

    // expect: The mocked billing data is returned to the page instead of the live backend response
    await page.route('**/api/billing*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBillingData),
      });
    });

    // 2. Reload/navigate to /billing so the page re-fetches billing data via the mock, then wait
    // for the 'Plan & Billing' heading and 'Current plan: Standard' text to be visible (loading
    // finished).
    // Each spec file runs in its own fresh browser context, which only carries the seeded
    // storageState - not an actual page navigation. The context starts at about:blank, so there is
    // no prior page for reload() to reload; navigate to /billing directly instead (the route mock
    // above was registered before this navigation, so it still intercepts the initial fetch).
    await page.goto('/billing');

    // expect: Billing page is fully loaded with mocked data (no 'Loading billing...' text remains)
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await expect(page.getByText('Standard', { exact: true })).toBeVisible();
    await expect(page.getByText('Loading billing...')).toHaveCount(0);

    // 3. Click the 'Upgrade to Premium' button (data-testid='billing-upgrade-cta-button').
    await page.getByTestId('billing-upgrade-cta-button').click();

    // expect: A dialog (role='dialog', aria-modal='true') becomes visible
    const modal = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // 4. Read the modal's title element (id='upgrade-modal-title', an h3).
    // expect: Modal title text is exactly 'Upgrade to Premium'
    await expect(page.locator('#upgrade-modal-title')).toHaveText('Upgrade to Premium');

    // 5. Read the modal body copy paragraph (class 'modal-body').
    // expect: Body copy text is exactly "Premium is $40/month. You'll be charged a prorated
    // amount for the rest of this cycle."
    await expect(modal.locator('.modal-body')).toHaveText(
      "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
    );

    // 6. Read the two rows inside the modal's info box (class 'modal-info-box'): the 'Remaining
    // days' row and the 'Charge today' row.
    const infoBox = modal.locator('.modal-info-box');
    const remainingDaysRow = infoBox.locator('.modal-info-row').filter({ hasText: 'Remaining days' });
    const chargeRow = infoBox.locator('.modal-info-row').filter({ hasText: 'Charge today' });

    // expect: 'Remaining days' row's value reads '15 days'
    await expect(remainingDaysRow).toContainText('15 days');

    // expect: 'Charge today' row's value (class 'modal-info-value') reads '$10.00' (computed as
    // (40-20) x 15/30 = 10.00)
    await expect(chargeRow.locator('.modal-info-value')).toHaveText('$10.00');
  });
});
