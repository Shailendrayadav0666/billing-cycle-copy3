// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-01 - Upgrade CTA is visible on the Billing page', async ({ page }) => {
    // 1. Start from the seeded state (tests/e2e/seed.spec.ts logs in as tpg@example.com and
    // lands on /billing). No route mocks are added for this test - the live GET /api/billing
    // response is used.
    // Each spec file runs in its own fresh browser context, which only carries the seeded
    // storageState (cookies/localStorage) - not an actual page navigation. The context starts at
    // about:blank, so we must navigate to /billing ourselves before asserting on it.
    await page.goto('/billing');

    // expect: Page URL is /billing
    await expect(page).toHaveURL(/\/billing$/);

    // expect: The 'Plan & Billing' heading (h2) is visible
    const heading = page.getByRole('heading', { name: 'Plan & Billing' });
    await expect(heading).toBeVisible();

    // expect: Current plan is shown as 'Standard'
    await expect(page.getByText('Standard', { exact: true })).toBeVisible();

    // 2. Locate the element with data-testid='billing-upgrade-cta-button' in the header row
    // that also contains the 'Plan & Billing' heading.
    const billingHeader = page.locator('.billing-header');
    const upgradeButton = billingHeader.getByTestId('billing-upgrade-cta-button');

    // expect: A button with accessible name 'Upgrade to Premium' is visible
    await expect(upgradeButton).toBeVisible();
    await expect(upgradeButton).toHaveAccessibleName('Upgrade to Premium');

    // expect: The button is positioned within the same header container as the 'Plan & Billing'
    // heading, to its right (scoped to the '.billing-header' container, both children asserted
    // present, then bounding box x-coordinates compared)
    await expect(billingHeader.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await expect(billingHeader.getByTestId('billing-upgrade-cta-button')).toBeVisible();

    const headingBox = await heading.boundingBox();
    const buttonBox = await upgradeButton.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.x).toBeGreaterThan(headingBox!.x);
  });
});
