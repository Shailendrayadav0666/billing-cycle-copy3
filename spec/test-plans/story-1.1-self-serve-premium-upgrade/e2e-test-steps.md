# E2E Test Steps — Story 1.1 Self-Serve Premium Upgrade

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/self-serve-premium-upgrade` |
| This story's merged PR | 🔴 TO CONFIRM: [PR URL once Story 1.1's PR merges] |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | Frontend: `http://localhost:5173` (Vite dev server, per `spec/plans/atlas-deep-dive.md`); proxies `/api/*` to the backend |
| Local services that must be up | Backend (FastAPI, port 8000) and frontend (Vite, port 5173) |
| Test data / accounts to seed | `tpg@example.com` / password `password` (existing seeded Standard user) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log functional failures against a system that never started.

---

### TC-E2E-01 — Full happy path: Standard user upgrades to Premium

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2, AC-3, AC-8, AC-9 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Logged in as `tpg@example.com` (Standard plan), on the Billing page |
| **Test data** | Seeded account `tpg@example.com` |

**Steps**
1. Log in and navigate to the Billing page.
2. Confirm the plan badge reads "Standard" and an "Upgrade to Premium" button is visible top-right of the header.
3. Click "Upgrade to Premium".
4. In the confirmation modal, note the "Remaining days" and "Charge today" values shown, and confirm the bulleted Premium highlights list is visible (4K Ultra HD, 4 simultaneous streams, 6 download devices, Dolby Vision).
5. Click "Confirm & pay <amount>".
6. Observe the page immediately after the click (no manual refresh).

**Expected result**
- After step 2: badge says "Standard"; CTA is visible.
- After step 4: the modal shows a specific dollar amount for "Charge today" and the correct remaining-days count; no network request has been sent yet (upgrade not yet applied — verify via network tab / by refreshing and seeing plan still Standard if the page were reloaded, don't actually reload).
- After step 6: the page updates WITHOUT a full page reload — plan badge reads "Premium", price shows "$40/month", the feature cards show "4K Ultra HD" / "4 devices" / "6 devices", the "Upgrade to Premium" button is gone, and a persistent success banner appears reading "Upgraded to Premium — Charged $<amount> for the remaining <N> days of this billing cycle. From <renew_at> you will be billed $40/month."

**Pass/Fail criteria**: PASS only if every element above updates correctly with no page reload. Any stale value, a page reload, or a missing banner is a FAIL.
**Cleanup**: Reset `tpg@example.com`'s plan back to Standard in the backend's in-memory store (restart the backend, or use a dedicated test account instead of the shared seed user).

---

### TC-E2E-02 — Cancel does nothing

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | Logged in as a Standard-plan user, on the Billing page |
| **Test data** | Standard-plan test account |

**Steps**
1. Click "Upgrade to Premium" to open the confirmation modal.
2. Open the browser's network tab (or equivalent) to observe outgoing requests.
3. Click "Cancel".

**Expected result**
- The modal closes.
- No `POST /api/billing/upgrade` request appears in the network log.
- The Billing page still shows the Standard plan, unchanged.

**Pass/Fail criteria**: PASS only if no API call was made and the page is unchanged. Any network call to the upgrade endpoint is a FAIL.
**Cleanup**: None needed — no mutation should have occurred.

---

### TC-E2E-03 — Upgrade CTA is absent for a Premium user

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | A test account already on the Premium plan (e.g. run TC-E2E-01 first on a dedicated test account) |
| **Test data** | Premium-plan test account |

**Steps**
1. Log in as the Premium-plan test account.
2. Navigate to the Billing page.

**Expected result**
- The plan badge reads "Premium".
- No "Upgrade to Premium" button is rendered anywhere on the page.

**Pass/Fail criteria**: PASS only if the button is completely absent (not just hidden via CSS — verify it is not in the rendered DOM). A visible or clickable CTA is a FAIL.
**Cleanup**: None needed.

---

### TC-E2E-04 — Confirmation modal shows an inline error on failure

| Field | Value |
|-------|-------|
| **Traces to** | AC-10 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | Logged in as a Standard-plan user; ability to simulate a backend failure (e.g. stop the backend process, or use browser dev tools to block the `/api/billing/upgrade` request / force it to return a 500) |
| **Test data** | Standard-plan test account |

**Steps**
1. Open the confirmation modal (click "Upgrade to Premium").
2. Simulate a failure: block the `POST /api/billing/upgrade` request in dev tools (or stop the backend) before clicking Confirm.
3. Click "Confirm & pay <amount>".
4. Observe the modal.
5. Restore the backend / unblock the request, then click "Confirm & pay <amount>" again (retry).

**Expected result**
- After step 3/4: the modal stays open and shows an inline error message (not a blank screen, not a silent failure, not a browser-level unhandled error). A "Cancel" (or equivalent) option remains available.
- After step 5 (retry): the upgrade completes successfully, matching TC-E2E-01's expected result.
- The existing `GET /api/billing` fetch on the Billing page itself is NOT expected to show any new error handling — this case is scoped to the modal only.

**Pass/Fail criteria**: PASS only if the modal shows a visible, human-readable error message and allows retry. A crash, blank state, or silent failure is a FAIL.
**Cleanup**: Ensure the backend is restored and the test account's plan is reset to Standard if the retry succeeded.

---

### TC-E2E-05 — No regressions to existing flows

| Field | Value |
|-------|-------|
| **Traces to** | AC-11 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Backend and frontend running locally |
| **Test data** | The existing seeded user `tpg@example.com` / `password`, plus a freshly registered test account |

**Steps**
1. Log out if logged in. Log in with `tpg@example.com` / `password`. Confirm successful login and redirect to the dashboard/billing area.
2. Log out. Confirm redirect to the login page.
3. Attempt to navigate directly to the Billing page URL while logged out. Confirm redirect to login (route guard).
4. Register a new account with a fresh email/password. Confirm successful registration and that the new account starts on the Standard plan.
5. Refresh the page while logged in (session restore). Confirm the session persists and billing data still loads.
6. As a Standard-plan user who does NOT click "Upgrade to Premium", view the Billing page and confirm the plan display, usage cards, and plan perks render exactly as before this story (aside from the new CTA now being present).

**Expected result**
- All six steps behave exactly as documented in `spec/plans/atlas-deep-dive.md` Flows 1–6, with no new errors, broken layouts, or missing data.

**Pass/Fail criteria**: PASS only if every existing flow works identically to before this story (plus the new CTA appearing for Standard users). Any regression in login, registration, logout, route guard, session restore, or the Standard billing display is a FAIL.
**Cleanup**: Remove the freshly registered test account if the backend persists it beyond restart (it will not, since storage is in-memory).
