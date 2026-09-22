# Story 1.1 — Self-Serve Premium Upgrade — E2E Test Plan

## Application Overview

StreamPlex Billing page (`/billing`) lets a logged-in Standard-plan user self-serve upgrade to Premium. The page fetches `GET /api/billing?email=<email>` on load and renders a plan badge ("Current plan: Standard"), a monthly price card, a renewal-date card, a feature/usage grid, a plan-perks card and, only while on a non-Premium plan, an "Upgrade to Premium" CTA button in the top-right of the page header (`.upgrade-cta`). Clicking the CTA opens a confirmation modal (`role="dialog"`, `aria-labelledby="upgrade-modal-title"`) that computes and displays, client-side only (no network call yet), the prorated "Remaining days" and "Charge today" values plus a static 4-item Premium highlights list (4K Ultra HD, 4 simultaneous streams, 6 download devices, Dolby Vision). Clicking "Confirm & pay $<amount>" fires exactly one `POST /api/billing/upgrade` with JSON body `{"email": "<email>"}`; the JSON response (plan_name, price, renew_at, usages, included_usage, prorated_charge) is merged directly into React state — the whole page re-renders in place with NO full navigation/reload: badge becomes "Premium", price becomes "$40/month", the feature cards flip to Premium values, the CTA disappears, the modal closes, and a persistent success banner appears with the exact charged amount, remaining-days count and renewal date. Login is via `tests/e2e/seed.spec.ts`'s `loginAsStandardUser` helper (tpg@example.com / password), which lands on `/billing`.

This plan covers EXACTLY one manual test case, TC-E2E-01 (traces to AC-1, AC-2, AC-3, AC-8, AC-9; Type: E2E; Priority: P1 critical path), and no other scenarios.

Environment note observed during exploration: at the time of this exploration, the dev server at http://localhost:5173 was serving a stale/cached frontend bundle in which the `.upgrade-cta` button and its modal were NOT present in the served `/src/pages/Billing.jsx` module (confirmed by fetching the served module source directly), even though the on-disk source file (read directly) fully implements the CTA, modal, upgrade call and success banner exactly as described in the manual test case and the contract grounding supplied for this task. This plan is grounded in the on-disk source (`src/frontend/src/pages/Billing.jsx`) and backend (`src/backend/main.py`) implementation, which is the authoritative contract the story is building; if the generated spec fails purely on "Upgrade to Premium" button/CTA not found, restart the Vite dev server to pick up the current source before treating it as a product defect.

Network contract used for all request/response assertions below:
- `GET /api/billing?email=<email>` — query string always present; intercept/observe with `'**/api/billing*'` (never a bare `'**/api/billing'`).
- `GET /api/users/me?email=<email>` — query string always present; intercept/observe with `'**/api/users/me*'`.
- `POST /api/billing/upgrade` — JSON body `{"email": "<email>"}`, no query string; `'**/api/billing/upgrade'` exact-path glob is fine.

## Test Scenarios

### 1. Story 1.1 - Self-Serve Premium Upgrade

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. TC-E2E-01 - Full happy path: Standard user upgrades to Premium

**File:** `tests/e2e/story-1.1-self-serve-premium-upgrade.spec.ts`

**Steps:**
  1. Preconditions/setup: use the seeded `loginAsStandardUser(page)` helper from tests/e2e/seed.spec.ts to log in as tpg@example.com (password: 'password') and land on the Billing page. Before any interaction, install a network observer/route spy on 'POST **/api/billing/upgrade' (e.g. via page.on('request') or page.route) so request counts can be asserted at multiple points later in the test, and set a page-level marker via page.evaluate(() => { window.__e2eNoReload = true }) immediately after the initial billing data has loaded, to later prove no full page reload occurs.
    - expect: Page URL matches **/billing after login.
    - expect: The billing data has loaded (the 'Loading billing...' placeholder is gone and 'Plan & Billing' heading is visible).
    - expect: Zero POST requests to '**/api/billing/upgrade' have been recorded so far.
    - expect: window.__e2eNoReload evaluates to true.
  2. Step 2 (AC-1): Locate the plan badge next to 'Current plan:' and the page header's top-right CTA button.
    - expect: The plan badge (`.plan-badge` / text next to 'Current plan:') reads exactly 'Standard'.
    - expect: A button named 'Upgrade to Premium' (`.upgrade-cta`) is visible in the billing header, top-right, and is enabled.
  3. Step 3 (AC-2): Click the 'Upgrade to Premium' button.
    - expect: An upgrade confirmation modal opens: an element with role='dialog', aria-modal='true' and aria-labelledby='upgrade-modal-title'.
    - expect: The modal's heading (#upgrade-modal-title) reads 'Upgrade to Premium'.
    - expect: The modal subtitle communicates Premium is $40/month and a prorated amount will be charged for the rest of the cycle.
    - expect: Still zero POST requests recorded to '**/api/billing/upgrade' (opening the modal performs no network call).
  4. Step 4a (AC-2, AC-3): Read and record the 'Remaining days' stat row value and the 'Charge today' stat row value from the modal (e.g. via `.upgrade-modal-stat-row` elements), for later comparison against the post-upgrade success banner.
    - expect: The 'Remaining days' row shows an integer N where 1 <= N <= 30, formatted as '<N> days'.
    - expect: The 'Charge today' row (`.upgrade-modal-charge`) shows a dollar amount formatted as '$X.XX', and X.XX is internally consistent with N: X.XX == round((40 - 20) * N / 30, 2).
    - expect: No network request has been sent yet: the recorded POST count to '**/api/billing/upgrade' is still 0 (do NOT reload the page to verify this — rely on the network observer only, per the manual test case's explicit instruction not to actually reload).
  5. Step 4b (AC-2): Verify the bulleted Premium highlights list inside the modal (`.upgrade-modal-highlights` list items).
    - expect: The list contains exactly 4 items, in order: '4K Ultra HD', '4 simultaneous streams', '6 download devices', 'Dolby Vision'.
  6. Step 5 (AC-3): Click the 'Confirm & pay $<amount>' button, where <amount> is exactly the 'Charge today' value recorded in step 4a (e.g. by exact accessible name match).
    - expect: Exactly one POST request fires to '**/api/billing/upgrade' with JSON request body `{"email": "tpg@example.com"}`.
    - expect: The response is a 2xx JSON payload containing plan_name: 'Premium', price: '$40/month', renew_at (unchanged from the pre-upgrade 'Renew at' date), an updated usages array, and a prorated_charge equal to the 'Charge today' amount recorded in step 4a.
  7. Step 6 (AC-8, AC-9): Immediately after the click resolves — with NO manual reload, NO page.reload(), and NO re-navigation — observe the page in place.
    - expect: window.__e2eNoReload (set during setup) still evaluates to true, proving no full page reload/navigation occurred.
    - expect: Page URL is unchanged and still matches **/billing.
    - expect: The plan badge now reads exactly 'Premium' (updated in place, not via reload).
    - expect: The 'Monthly plan' price now reads '$40/month'.
    - expect: The 'Video quality' feature card's value contains '4K Ultra HD'.
    - expect: The 'Watch at the same time' feature card's value contains '4 devices' (i.e. 'Can watch on 4 devices at once').
    - expect: The 'Download on devices' feature card's value contains '6 devices' (i.e. 'Can download on 6 devices').
    - expect: The 'Upgrade to Premium' button (`.upgrade-cta`) is no longer present in the DOM.
    - expect: The upgrade confirmation modal (role='dialog') is no longer visible/present — it has closed.
    - expect: A persistent success banner (`.upgrade-success-banner`) is visible containing bold text 'Upgraded to Premium' followed by text matching: '— Charged $<amount> for the remaining <N> days of this billing cycle. From <renew_at> you will be billed $40/month.' where <amount> and <N> exactly equal the 'Charge today' and 'Remaining days' values captured in step 4a, and <renew_at> exactly equals the 'Renew at' date shown before the upgrade (e.g. 'Oct 30, 2026').
  8. Step 7 (regression guard): Re-check the network observer installed during setup for the entire test duration.
    - expect: Exactly one POST request total was sent to '**/api/billing/upgrade' for the whole test (guards against a double-submit / duplicate-charge regression).
