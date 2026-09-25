# E2E Test Steps — Story 1.8: Confirm the upgrade from the dialog

**Purpose**: verify the full subscriber journey — log in, open the dialog, see the charge, confirm, and see the page switch to Premium without a reload — plus what the page shows after a reload.
**Scope**: AC-2, AC-3, AC-4 of Story 1.8 (AC-1's single-request behaviour is in `integration-test-steps.md`).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.8 `[STORY]` PR once raised and merged into the epic branch (requires Stories 1.3, 1.5 and 1.7 merged) |
| Confirm the story is in the build | `git log --oneline \| grep "1.8"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM (not documented in the design artifacts). Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore (in-memory store) |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026 (Atlas). Registered accounts renew today + 30 days. The seeded account can only be upgraded once per backend run — restart the backend to reset it. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-E2E-01 — Confirming switches the page to Premium without a reload

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-10, REQ-F-06, REQ-F-07 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started (seeded account is Standard); DevTools Network tab open with "Preserve log" on |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in as `tpg@example.com`. Note the "Renew at" date (expected "Oct 30, 2026").
2. Click "Upgrade to Premium" and wait for the charge to load.
3. Click "Confirm & pay $X" (X as shown).
4. Observe the page and the Network log.

**Expected result**
- The dialog closes.
- No full page navigation/reload appears in the Network log (no new document request).
- The "Current plan:" badge reads "Premium"; the monthly plan card shows "$40/month"; "Renew at" still shows "Oct 30, 2026".
- The heading reads "What's included with Premium"; the feature cards show "4K Ultra HD", "Can watch on 4 devices at once" and "Can download on 6 devices"; the Plan perks card includes "Dolby Vision (select titles)".
- The "Upgrade to Premium" button is gone.

**Pass/Fail criteria**: PASS if every expectation holds without a reload. FAIL on any missing change, a changed renewal date, or a page reload.
**Cleanup**: Restart the backend to return the seeded account to Standard.

### TC-E2E-02 — Confirmation panel states what was charged

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-11 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` / `password`; note the "Remaining days" (N) and "Charge today" ($X) shown in the dialog |

**Steps**
1. Log in, open the dialog, and note N and $X.
2. Click "Confirm & pay $X".
3. Read the panel that appears.

**Expected result**
- A panel titled "Upgraded to Premium" appears.
- Its text reads exactly: "Charged $X for the remaining N days of this billing cycle. From Oct 30, 2026 you will be billed $40/month." (with this cycle's seeded data and today on or before Sep 30, 2026: "Charged $20.00 for the remaining 30 days …").
- The panel stays visible while you remain on the page (scroll, wait 30 seconds).

**Pass/Fail criteria**: PASS if the panel title and text match exactly, with $X and N equal to what the dialog showed, and the panel persists. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-03 — After a reload the page shows Premium without the panel or CTA

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-05, REQ-F-11 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | TC-E2E-02 just completed (account upgraded, backend still running) |
| **Test data** | `tpg@example.com` |

**Steps**
1. Reload the Billing page (F5).
2. Observe the page.

**Expected result**
- The page shows "Premium", "$40/month", "Renew at Oct 30, 2026" and the Premium features.
- No "Upgrade to Premium" button and no "Upgraded to Premium" panel are shown.

**Pass/Fail criteria**: PASS if Premium persists and neither the CTA nor the panel appears. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-04 — Logging out and back in keeps Premium (same backend run)

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-05 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | Seeded account upgraded in this backend run |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Click "Logout".
2. Log back in as `tpg@example.com`.

**Expected result**
- The Billing page shows Premium at "$40/month", no "Upgrade to Premium" button, and no confirmation panel.

**Pass/Fail criteria**: PASS if Premium persists across logout/login. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-05 — A newly registered user can upgrade end to end

| Field | Value |
|-------|-------|
| **Traces to** | AC-2, AC-3 / REQ-F-14 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | System Under Test running |
| **Test data** | Register a new account, for example name "Nina", email `nina+<timestamp>@example.com`, any password |

**Steps**
1. Register the new account and land on the Billing page.
2. Confirm it shows "Standard", "$20/month", and a "Renew at" date 30 days from today.
3. Open the dialog, then click "Confirm & pay $20.00".

**Expected result**
- The dialog showed "30 days" and "$20.00".
- The page switches to Premium at "$40/month" with the renewal date unchanged, and the panel reads "Charged $20.00 for the remaining 30 days of this billing cycle. From <renewal date> you will be billed $40/month."

**Pass/Fail criteria**: PASS if the new account upgrades as described. FAIL otherwise.
**Cleanup**: Restart the backend (removes the registered account).

### TC-E2E-06 — Standard page untouched before confirming (regression boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-14 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in; open the dialog; wait for the charge; click "Cancel".
2. Reload the page.

**Expected result**
- The page still shows "Standard", "$20/month", "Renew at Oct 30, 2026" and the "Upgrade to Premium" button; no panel.

**Pass/Fail criteria**: PASS if nothing changed without a confirm. FAIL otherwise.
**Cleanup**: None.
