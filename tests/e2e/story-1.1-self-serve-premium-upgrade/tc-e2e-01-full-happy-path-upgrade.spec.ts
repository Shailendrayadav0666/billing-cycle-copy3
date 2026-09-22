// spec: Story 1.1 - Self-Serve Premium Upgrade
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';
import { loginAsStandardUser } from '../seed.spec';

test.describe('Story 1.1 - Self-Serve Premium Upgrade', () => {
  test('TC-E2E-01 - Full happy path: Standard user upgrades to Premium', async ({ page }) => {
    // 1. Preconditions/setup: use the seeded loginAsStandardUser(page) helper to log in as
    // tpg@example.com (password: 'password') and land on the Billing page. Before any interaction,
    // install a network observer/route spy on 'POST **/api/billing/upgrade' so request counts can be
    // asserted at multiple points later, and set a page-level marker via page.evaluate immediately
    // after the initial billing data has loaded, to later prove no full page reload occurs.
    const upgradePostRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/billing/upgrade')) {
        upgradePostRequests.push(request.postData() ?? '');
      }
    });

    await loginAsStandardUser(page);

    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText('Loading billing...')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    expect(upgradePostRequests.length).toBe(0);

    await page.evaluate(() => {
      (window as any).__e2eNoReload = true;
    });
    expect(await page.evaluate(() => (window as any).__e2eNoReload)).toBe(true);

    // 2. Step 2 (AC-1): Locate the plan badge next to 'Current plan:' and the page header's
    // top-right CTA button.
    const planBadge = page.locator('.plan-badge');
    await expect(planBadge).toHaveText('Standard');
    const upgradeCta = page.locator('.upgrade-cta');
    await expect(upgradeCta).toBeVisible();
    await expect(upgradeCta).toBeEnabled();
    const renewAtText = await page.locator('.renew-date').innerText();

    // 3. Step 3 (AC-2): Click the 'Upgrade to Premium' button.
    await upgradeCta.click();

    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'upgrade-modal-title');
    await expect(page.locator('#upgrade-modal-title')).toHaveText('Upgrade to Premium');
    await expect(page.locator('.upgrade-modal-subtitle')).toContainText(
      "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
    );
    expect(upgradePostRequests.length).toBe(0);

    // 4. Step 4a (AC-2, AC-3): Read and record the 'Remaining days' stat row value and the
    // 'Charge today' stat row value from the modal, for later comparison against the post-upgrade
    // success banner.
    const statRows = dialog.locator('.upgrade-modal-stat-row');
    const remainingDaysText = await statRows.nth(0).locator('.upgrade-modal-stat-value').innerText();
    const chargeTodayText = await dialog.locator('.upgrade-modal-charge').innerText();

    const remainingDaysMatch = remainingDaysText.match(/^(\d+) days$/);
    expect(remainingDaysMatch).not.toBeNull();
    const remainingDays = Number(remainingDaysMatch![1]);
    expect(remainingDays).toBeGreaterThanOrEqual(1);
    expect(remainingDays).toBeLessThanOrEqual(30);

    const chargeMatch = chargeTodayText.match(/^\$(\d+\.\d{2})$/);
    expect(chargeMatch).not.toBeNull();
    const chargeToday = Number(chargeMatch![1]);
    const expectedCharge = Math.round((((40 - 20) * remainingDays) / 30) * 100) / 100;
    expect(chargeToday).toBeCloseTo(expectedCharge, 2);

    expect(upgradePostRequests.length).toBe(0);

    // 5. Step 4b (AC-2): Verify the bulleted Premium highlights list inside the modal.
    const highlightItems = dialog.locator('.upgrade-modal-highlights li');
    await expect(highlightItems).toHaveText([
      '4K Ultra HD',
      '4 simultaneous streams',
      '6 download devices',
      'Dolby Vision',
    ]);

    // 6. Step 5 (AC-3): Click the 'Confirm & pay $<amount>' button, where <amount> is exactly the
    // 'Charge today' value recorded above.
    const confirmButtonName = `Confirm & pay ${chargeTodayText}`;
    const [upgradeResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/billing/upgrade') && response.request().method() === 'POST'
      ),
      dialog.getByRole('button', { name: confirmButtonName, exact: true }).click(),
    ]);

    expect(upgradeResponse.status()).toBeGreaterThanOrEqual(200);
    expect(upgradeResponse.status()).toBeLessThan(300);
    const upgradeResponseBody = await upgradeResponse.json();
    expect(upgradeResponseBody.plan_name).toBe('Premium');
    expect(upgradeResponseBody.price).toBe('$40/month');
    expect(upgradeResponseBody.renew_at).toBe(renewAtText);
    expect(Array.isArray(upgradeResponseBody.usages)).toBe(true);
    expect(upgradeResponseBody.prorated_charge).toBeCloseTo(chargeToday, 2);

    expect(upgradePostRequests.length).toBe(1);
    expect(JSON.parse(upgradePostRequests[0])).toEqual({ email: 'tpg@example.com' });

    // 7. Step 6 (AC-8, AC-9): Immediately after the click resolves -- with NO manual reload, NO
    // page.reload(), and NO re-navigation -- observe the page in place.
    expect(await page.evaluate(() => (window as any).__e2eNoReload)).toBe(true);
    await expect(page).toHaveURL(/\/billing$/);

    await expect(planBadge).toHaveText('Premium');
    await expect(page.locator('.plan-price')).toHaveText('$40/month');

    const videoQualityCard = page.locator('.usage-card').filter({ hasText: 'Video quality' });
    await expect(videoQualityCard.locator('.usage-value')).toContainText('4K Ultra HD');

    const simultaneousCard = page.locator('.usage-card').filter({ hasText: 'Watch at the same time' });
    await expect(simultaneousCard.locator('.usage-value')).toContainText('4 devices');

    const downloadCard = page.locator('.usage-card').filter({ hasText: 'Download on devices' });
    await expect(downloadCard.locator('.usage-value')).toContainText('6 devices');

    await expect(page.locator('.upgrade-cta')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const successBanner = page.locator('.upgrade-success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner.locator('strong')).toHaveText('Upgraded to Premium');
    await expect(successBanner).toContainText(
      `Upgraded to Premium — Charged ${chargeTodayText} for the remaining ${remainingDays} days of this billing cycle. From ${renewAtText} you will be billed $40/month.`
    );

    // 8. Step 7 (regression guard): Re-check the network observer installed during setup for the
    // entire test duration.
    expect(upgradePostRequests.length).toBe(1);
  });
});
