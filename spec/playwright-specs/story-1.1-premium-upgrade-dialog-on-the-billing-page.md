# Story 1.1 - Premium Upgrade Dialog on the Billing Page - Playwright E2E Test Plan

## Application Overview

Application under test: StreamPlex (http://localhost:5173, Vite dev server proxying /api to the backend on :8000). Environment seed: tests/e2e/seed.spec.ts signs in as tpg@example.com / password (inputs located by type: input[type="email"], input[type="password"]; submit button "Sign In") and lands on /billing, which shows the "Plan & Billing" heading, a Standard plan ($20/month, renews Oct 30, 2026).

Key DOM facts confirmed by live exploration (use these for reliable selectors):
- The page's "Plan & Billing" title row is a `.billing-header` container holding the `<h2>Plan & Billing</h2>` title block and, for Standard subscribers only, a `button.upgrade-cta` labelled exactly "Upgrade to Premium".
- Loading the Billing page issues `GET /api/billing?email=<encoded-email>` — the query string is ALWAYS present. Any `page.route()` interception for this endpoint MUST use a wildcard-suffixed glob such as `'**/api/billing?*'` (confirmed working) — never an exact-path glob without a trailing wildcard, or the route will not match.
- Clicking "Upgrade to Premium" renders a backdrop `div.upgrade-overlay` (covers the full viewport, dark translucent) containing `div.upgrade-dialog[role="dialog"][aria-modal="true"][aria-labelledby="upgrade-dialog-title"][tabindex="-1"]`. Its accessible name (via aria-labelledby) is exactly "Upgrade to Premium", matching an `<h3 id="upgrade-dialog-title">Upgrade to Premium</h3>`.
- Dialog body: a paragraph "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."; a definition list with term "Current plan" / definition "Standard ($20/mo)" and term "New plan" / definition "Premium ($40/mo)"; a `<ul>` with exactly 4 `<li>` items in order: "4K Ultra HD video quality", "Stream on 4 devices at once", "Download on 6 devices", "Dolby Vision (select titles)"; and a "Cancel" button.
- Opening the dialog makes NO network request — /api/billing/upgrade-preview and /api/billing/upgrade do not exist yet in this story; tests must watch for (not call) them and assert they are never requested.
- Confirmed dismissal paths: Escape key, and a click on `.upgrade-overlay` at a point outside the `.upgrade-dialog` card's bounding box (e.g. an (x:10, y:10) offset on the overlay) both close the dialog. A click inside the card on a non-button area (e.g. the benefit `<ul>`) does NOT close it.
- Confirmed keyboard behavior: focusing `button.upgrade-cta` and pressing Enter (or Space) opens the dialog and moves DOM focus to the dialog container itself (`div.upgrade-dialog`, which has `tabindex="-1"`); pressing Escape returns focus to `button.upgrade-cta`.
- No Premium account exists in the seed data; TC-E2E-02 must intercept `GET /api/billing?*` with `page.route()` and `route.fulfill()` using the SAME JSON shape as the real Standard response (plan_name, price, renew_at, usages[], included_usage{title, items[], help}) but with `plan_name: "Premium"` and `price: "$40/month"`. The route must be registered BEFORE the billing page's fetch fires — i.e. before completing the sign-in step that redirects to /billing — since the interception must be active the moment the page loads.
- Real Standard-plan billing response shape (for building the TC-E2E-02 mock and for reference): `{"plan_name":"Standard","price":"$20/month","renew_at":"Oct 30, 2026","usages":[...],"included_usage":{"title":"Plan perks","items":[...],"help":"..."}}`.

Test independence: each test performs its own sign-in (following the seed pattern) rather than relying on shared state; each test cleans up dialogs it opened before finishing.

## Test Scenarios

### 1. Billing Page and Upgrade Dialog (E2E)

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. TC-E2E-01 - Standard subscriber sees the Upgrade to Premium button

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-01-upgrade-button-visible.spec.ts`

**Steps:**
  1. Sign in as tpg@example.com / password (per seed) and land on /billing.
    - expect: URL is /billing
    - expect: The 'Plan & Billing' heading is visible
  2. Locate the .billing-header title row (the container holding the 'Plan & Billing' heading).
    - expect: Within .billing-header, a button with the exact accessible name 'Upgrade to Premium' is visible
  3. Inspect the rest of the Billing page.
    - expect: The page still shows text 'Current plan:' followed by 'Standard'
    - expect: The page still shows '$20/month'

#### 1.2. TC-E2E-02 - Premium subscriber is not offered the upgrade

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-02-premium-subscriber-no-upgrade.spec.ts`

**Steps:**
  1. Navigate to /login. Before signing in, register page.route('**/api/billing?*', ...) to fulfill the request with the same JSON shape as the real Standard billing response but plan_name 'Premium' and price '$40/month' (keep renew_at, usages and included_usage present and well-formed).
    - expect: Route registered with no error
  2. Fill input[type="email"] with tpg@example.com and input[type="password"] with password, then click 'Sign In'.
    - expect: Redirected to /billing
    - expect: 'Plan & Billing' heading is visible
    - expect: 'Current plan:' shows 'Premium' (confirms the mock response was applied) using an auto-retrying assertion (e.g. toContainText) rather than a one-shot read, since the app may re-fetch
  3. Search the entire page for any button named 'Upgrade to Premium'.
    - expect: getByRole('button', { name: 'Upgrade to Premium' }) resolves to zero elements (toHaveCount(0)) - no such button is rendered anywhere on the page, including disabled

#### 1.3. TC-E2E-03 - Opening the dialog shows the plan comparison and Premium benefits

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-03-dialog-content.spec.ts`

**Steps:**
  1. Sign in as tpg@example.com / password and land on /billing. Begin tracking outgoing requests (e.g. via page.on('request')) for URLs containing '/api/billing/upgrade-preview' or '/api/billing/upgrade'.
    - expect: No such requests recorded yet
  2. Click the 'Upgrade to Premium' button in .billing-header.
    - expect: A dialog becomes visible: an element with role 'dialog', aria-modal='true', rendered over a visually distinct dark translucent backdrop (.upgrade-overlay ancestor)
    - expect: The dialog's accessible name is exactly 'Upgrade to Premium' (e.g. getByRole('dialog', { name: 'Upgrade to Premium' }) is visible)
  3. Read the dialog title.
    - expect: The dialog heading text is exactly 'Upgrade to Premium'
  4. Read the dialog's explanatory paragraph.
    - expect: Text is exactly "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
  5. Read the plan comparison summary rows inside the dialog.
    - expect: A row/term 'Current plan' has definition/value exactly 'Standard ($20/mo)'
    - expect: A row/term 'New plan' has definition/value exactly 'Premium ($40/mo)'
  6. Read the benefit list inside the dialog.
    - expect: The list contains exactly 4 items, in this order, with exact text: '4K Ultra HD video quality', 'Stream on 4 devices at once', 'Download on 6 devices', 'Dolby Vision (select titles)'
  7. Look for a dismiss control in the dialog.
    - expect: A 'Cancel' button is visible inside the dialog
  8. Inspect the tracked requests collected since the button click.
    - expect: No request was made to any URL containing '/api/billing/upgrade-preview'
    - expect: No request was made to any URL containing '/api/billing/upgrade'

#### 1.4. TC-E2E-04 - Dialog shell shows no charge or confirm controls yet (boundary)

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-04-dialog-boundary-no-charge-controls.spec.ts`

**Steps:**
  1. Sign in and open the upgrade dialog by clicking 'Upgrade to Premium'.
    - expect: Dialog is visible
  2. Search the dialog for the text 'Remaining days'.
    - expect: Not present anywhere in the dialog
  3. Search the dialog for the text 'Charge today'.
    - expect: Not present anywhere in the dialog
  4. Search the dialog for a button named 'Confirm & pay'.
    - expect: No such button exists (count 0)
  5. Re-inspect the benefit list.
    - expect: The list does NOT contain 'Download on 4 devices'
    - expect: The list does NOT contain '4K + HDR'
  6. Cleanup: click 'Cancel' to close the dialog.
    - expect: Dialog is closed

#### 1.5. TC-E2E-05 - Dismiss with Cancel leaves the page unchanged

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-05-dismiss-cancel.spec.ts`

**Steps:**
  1. Sign in, open the dialog via 'Upgrade to Premium', and begin tracking requests to '/api/billing/upgrade-preview' and '/api/billing/upgrade'.
    - expect: Dialog is visible
  2. Click the 'Cancel' button inside the dialog.
    - expect: The dialog (role dialog) is no longer visible/attached to the DOM
  3. Inspect the Billing page state.
    - expect: Page still shows 'Current plan:' 'Standard'
    - expect: Page still shows '$20/month'
    - expect: Page still shows 'Oct 30, 2026'
    - expect: The 'Upgrade to Premium' button is visible again in .billing-header
  4. Inspect tracked requests.
    - expect: No request was made to '/api/billing/upgrade-preview' or '/api/billing/upgrade'

#### 1.6. TC-E2E-06 - Dismiss with Escape and with a backdrop click (and non-dismissal on inside click)

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-06-dismiss-escape-backdrop.spec.ts`

**Steps:**
  1. Sign in and begin tracking requests to '/api/billing/upgrade-preview' and '/api/billing/upgrade' for the whole test.
    - expect: Tracking active
  2. Open the dialog via 'Upgrade to Premium', then press Escape.
    - expect: Dialog closes
    - expect: Page unchanged: 'Standard', '$20/month', 'Upgrade to Premium' button visible
    - expect: No upgrade request was sent
  3. Open the dialog again, then click on the backdrop overlay (.upgrade-overlay) at a point clearly outside the bounding box of the white dialog card (.upgrade-dialog) - e.g. click position (x:10, y:10) on the overlay, confirmed outside the card in this viewport.
    - expect: Dialog closes
    - expect: Page unchanged as above
    - expect: No upgrade request was sent
  4. Open the dialog a third time, then click inside the dialog card on a non-button area, for example the benefit list (<ul>).
    - expect: The dialog remains open/visible (negative assertion - it must NOT close)
  5. Cleanup: click 'Cancel' to close the dialog.
    - expect: Dialog is closed

#### 1.7. TC-E2E-07 - Reopening after dismissal shows the same dialog (boundary)

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-e2e-07-reopen-consistency.spec.ts`

**Steps:**
  1. Sign in as tpg@example.com / password.
    - expect: Landed on /billing
  2. Repeat three times: click 'Upgrade to Premium'; verify the dialog title, the explanatory paragraph, both summary rows, the 4-item benefit list and the 'Cancel' button all match TC-E2E-03's exact content; then click 'Cancel'.
    - expect: Each of the 3 opens shows identical, correct content
    - expect: After each Cancel, the dialog is closed and the page shows unchanged Standard/$20/month/Oct 30, 2026 data with the 'Upgrade to Premium' button visible
  3. Open the dialog a fourth time.
    - expect: Content is identical to the previous opens
    - expect: Exactly one dialog element (role='dialog') exists in the DOM at this point (toHaveCount(1))
    - expect: The page is otherwise unchanged
  4. Cleanup: click 'Cancel'.
    - expect: Dialog closed

### 2. Upgrade Dialog Accessibility

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. TC-ACC-01 - Dialog opens from the keyboard and receives focus

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-acc-01-keyboard-open-focus.spec.ts`

**Steps:**
  1. Sign in, then move keyboard focus to the 'Upgrade to Premium' button (e.g. Tab through the page or focus the button directly to simulate arriving there via Tab), then press Enter.
    - expect: The dialog opens (role='dialog' visible)
    - expect: Keyboard focus (document.activeElement) is inside the dialog - either the dialog container itself or its first focusable control - not left on the page behind it (assert with toBeFocused() on the dialog or a descendant)
  2. Press Escape to close, refocus 'Upgrade to Premium', then press Space instead of Enter.
    - expect: The dialog opens again
    - expect: Focus again moves inside the dialog
  3. Cleanup: press Escape.
    - expect: Dialog closed

#### 2.2. TC-ACC-02 - Dialog is exposed as a labelled modal dialog

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-acc-02-dialog-role-aria.spec.ts`

**Steps:**
  1. Sign in and open the dialog via 'Upgrade to Premium'.
    - expect: Dialog visible
  2. Inspect the dialog element's role and ARIA attributes.
    - expect: An element with role='dialog' exists
    - expect: That element has aria-modal='true'
    - expect: Its accessible name is exactly 'Upgrade to Premium' (e.g. getByRole('dialog', { name: 'Upgrade to Premium', exact: true }) matches it)
  3. Cleanup: press Escape.
    - expect: Dialog closed

#### 2.3. TC-ACC-03 - Focus returns to the Upgrade button on close

**File:** `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/tc-acc-03-focus-return.spec.ts`

**Steps:**
  1. Sign in, focus 'Upgrade to Premium' via the keyboard, and press Enter to open the dialog.
    - expect: Dialog is open
  2. Press Escape.
    - expect: Dialog closes
    - expect: Focus is on the 'Upgrade to Premium' button (toBeFocused())
  3. Open the dialog again via the keyboard, press Tab until focus reaches the 'Cancel' button inside the dialog, then press Enter.
    - expect: Dialog closes
    - expect: Focus is on the 'Upgrade to Premium' button (toBeFocused())
