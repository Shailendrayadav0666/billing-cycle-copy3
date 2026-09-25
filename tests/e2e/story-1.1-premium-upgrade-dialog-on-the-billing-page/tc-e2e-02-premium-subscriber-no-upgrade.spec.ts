// spec: spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Billing Page and Upgrade Dialog (E2E)', () => {
  test('TC-E2E-02 - Premium subscriber is not offered the upgrade', async ({ page }) => {
    // 1. Navigate to /login. Before signing in, register page.route('**/api/billing?*', ...) to
    // fulfill the request with the same JSON shape as the real Standard billing response but
    // plan_name 'Premium' and price '$40/month' (keep renew_at, usages and included_usage present
    // and well-formed).
    await page.goto('/login');
    await page.route('**/api/billing?*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan_name: 'Premium',
          price: '$40/month',
          renew_at: 'Oct 30, 2026',
          usages: [
            {
              id: 'video-quality',
              label: 'Video quality',
              type: 'feature',
              value: 'Full HD (1080p)',
              help: 'Resolution',
            },
            {
              id: 'screens',
              label: 'Watch at the same time',
              type: 'feature',
              value: 'Can watch on 2 devices at once',
              help: 'Streams',
            },
            {
              id: 'downloads',
              label: 'Download on devices',
              type: 'feature',
              value: 'Can download on 2 devices',
              help: 'Downloads',
            },
          ],
          included_usage: {
            title: 'Plan perks',
            items: [
              { id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 },
              { id: 'spatial-audio', label: 'Spatial audio (select titles)', used_percent: 100 },
            ],
            help: 'Perks included in your plan.',
          },
        }),
      })
    );

    // 2. Fill input[type="email"] with tpg@example.com and input[type="password"] with password,
    // then click 'Sign In'.
    await page.locator('input[type="email"]').fill('tpg@example.com');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    // Auto-retrying assertion confirming the mocked Premium response was applied (the page may
    // re-fetch): the monthly price reflects the mocked Premium payload.
    await expect(page.getByText('$40/month')).toBeVisible();

    // 3. Search the entire page for any button named 'Upgrade to Premium'.
    await expect(page.getByRole('button', { name: 'Upgrade to Premium' })).toHaveCount(0);
  });
});
