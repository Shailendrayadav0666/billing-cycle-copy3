// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-04 - Cancel closes the modal with no changes', async ({ page }) => {
    // Set up a request-count listener on '**/api/billing/upgrade*' before any interaction, so we
    // can assert zero requests to that endpoint at the end of the test.
    let upgradeRequestCount = 0;
    page.on('request', (request) => {
      if (/\/api\/billing\/upgrade/.test(request.url())) {
        upgradeRequestCount += 1;
      }
    });

    // 1. Navigate to /billing (live GET /api/billing response - irrelevant to this assertion),
    // wait for load, and click 'Upgrade to Premium' (data-testid='billing-upgrade-cta-button')
    // to open the modal.
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await page.getByTestId('billing-upgrade-cta-button').click();

    // expect: The confirmation dialog is visible
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();

    // 2. Click the 'Cancel' button (data-testid='upgrade-modal-cancel-button').
    await page.getByTestId('upgrade-modal-cancel-button').click();

    // expect: The dialog is no longer present in the DOM/no longer visible
    await expect(dialog).not.toBeVisible();

    // 3. On the now-visible Billing page, read the 'Current plan' label and the plan price shown
    // in the 'Monthly plan' card.
    // expect: 'Current plan' still reads 'Standard'
    await expect(page.getByText('Standard', { exact: true })).toBeVisible();

    // expect: The plan price still reads '$20/month'
    await expect(page.getByText('$20/month')).toBeVisible();

    // expect: No POST request to /api/billing/upgrade was made at any point during this test
    expect(upgradeRequestCount).toBe(0);
  });
});
