// spec: tests/playwright-specs/1.1-upgrade-cta-confirmation-modal.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Story 1.1 - Upgrade CTA & Confirmation Modal', () => {
  test('TC-E2E-06 - Confirm button disables immediately to block a duplicate submission', async ({ page }) => {
    // 1. Set up a request counter/interceptor on '**/api/billing/upgrade' (route.continue() so the
    // real — currently unimplemented — endpoint still responds, e.g. with a 404/405 error status;
    // just count invocations). Navigate to /billing, wait for load, click 'Upgrade to Premium'
    // (data-testid='billing-upgrade-cta-button') to open the modal.
    let upgradeRequestCount = 0;
    await page.route('**/api/billing/upgrade', async (route) => {
      upgradeRequestCount += 1;
      await route.continue();
    });

    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Plan & Billing' })).toBeVisible();
    await page.getByTestId('billing-upgrade-cta-button').click();

    // expect: The confirmation dialog is visible; the POST counter is 0 so far
    const dialog = page.getByRole('dialog', { name: 'Upgrade to Premium' });
    await expect(dialog).toBeVisible();
    expect(upgradeRequestCount).toBe(0);

    // 2. Click the Confirm button (data-testid='upgrade-modal-confirm-button') once, then, without
    // awaiting any navigation or response, immediately click the same button a second time; the
    // second click attempt must not fail the test (a real disabled button silently ignores it).
    const upgradeResponsePromise = page.waitForResponse((response) =>
      /\/api\/billing\/upgrade/.test(response.url())
    );

    // expect: Immediately after the first click, both the Confirm and Cancel buttons' `disabled`
    // attribute are present, before the POST response has resolved. Then, while still disabled,
    // a rapid duplicate click is attempted.
    // The real (currently unimplemented) endpoint responds so fast locally (sub-millisecond, same
    // machine) that isSubmitting can flip back to false again before a second, separately-awaited
    // Playwright assertion/action gets a chance to run - each `expect(locator)...`/`locator.click()`
    // call is its own round trip to the browser, and that round trip alone is enough time for the
    // in-flight request to settle. To reliably observe "both disabled, then a blocked duplicate
    // click" as a single atomic moment, do all three steps - click, read both buttons' `disabled`
    // property, and attempt the second click - inside one single page.evaluate() call, so nothing
    // (including the network response) can happen in between. The second click uses the native
    // DOM `element.click()` rather than Playwright's API: a real disabled <button> element simply
    // never dispatches a click event to its handler (no actionability bypass/error-swallowing
    // needed), which is exactly the behavior this step is verifying.
    const { confirmDisabled, cancelDisabled } = await page.evaluate(
      async ({ confirmTestId, cancelTestId }) => {
        const confirmEl = document.querySelector(`[data-testid="${confirmTestId}"]`) as HTMLButtonElement | null;
        const cancelEl = document.querySelector(`[data-testid="${cancelTestId}"]`) as HTMLButtonElement | null;
        confirmEl?.click();
        // React flushes the isSubmitting state update (and its resulting `disabled` attribute)
        // asynchronously, on the microtask queue - not synchronously within this same call stack.
        // Yield a single microtask (far shorter than a network round trip) so the re-render
        // commits before we read `disabled` and attempt the duplicate click.
        await Promise.resolve();
        const confirmDisabled = confirmEl?.disabled ?? false;
        const cancelDisabled = cancelEl?.disabled ?? false;
        confirmEl?.click();
        return { confirmDisabled, cancelDisabled };
      },
      { confirmTestId: 'upgrade-modal-confirm-button', cancelTestId: 'upgrade-modal-cancel-button' }
    );
    expect(confirmDisabled).toBe(true);
    expect(cancelDisabled).toBe(true);

    // 3. After the in-flight request settles, inspect the request counter for
    // '**/api/billing/upgrade'.
    await upgradeResponsePromise;

    // expect: Exactly 1 request was made to POST /api/billing/upgrade — the rapid second click did
    // not trigger a second request. No assertion is made on the response body or on any success
    // outcome for this endpoint; a non-2xx status (e.g. 404 or 405) is acceptable and expected
    // since the endpoint is not yet implemented.
    expect(upgradeRequestCount).toBe(1);
  });
});
