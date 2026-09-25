# E2E Test Steps — Story 1.9: Upgrade failures shown in the dialog

**Purpose**: verify that when the preview or the upgrade fails, the subscriber sees a clear error in the dialog, can retry, and the Billing page is left untouched.
**Scope**: AC-1, AC-2, AC-3 of Story 1.9. Failures are induced by hand from the browser (second tab, DevTools request blocking, stopping the backend).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.9 `[STORY]` PR once raised and merged into the epic branch (requires Stories 1.6 and 1.8 merged) |
| Confirm the story is in the build | `git log --oneline \| grep "1.9"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM (not documented in the design artifacts). Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore (in-memory store) |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026 (Atlas). Registered accounts renew today + 30 days. The seeded account can only be upgraded once per backend run — restart the backend to reset it. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-E2E-01 — Upgrade rejected because the account was upgraded in another tab

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started (seeded account is Standard); two tabs of the same browser |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Tab A: log in as `tpg@example.com`, click "Upgrade to Premium", wait for "Confirm & pay $X". Leave the dialog open.
2. Tab B: open the frontend (already logged in via the shared session), open the dialog and click "Confirm & pay $X". Confirm tab B shows Premium.
3. Return to tab A (do not reload) and click "Confirm & pay $X".

**Expected result**
- Tab A's dialog stays open.
- An error in the dialog reads "Already on Premium plan".
- "Confirm & pay $X" is enabled again.
- Tab A's Billing page behind the dialog still shows "Standard" at "$20/month" (unchanged by the failed request).

**Pass/Fail criteria**: PASS if the dialog stays open with exactly that message, the button re-enables and the page data is unchanged. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-02 — Retry after a rejection does not change the page

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | TC-E2E-01 just performed; tab A still shows the error |
| **Test data** | — |

**Steps**
1. In tab A, click "Confirm & pay $X" again.

**Expected result**
- The same "Already on Premium plan" error is shown again; the dialog stays open; the page is unchanged.

**Pass/Fail criteria**: PASS if the retry behaves identically. FAIL on a crash, blank dialog or page change.
**Cleanup**: Restart the backend.

### TC-E2E-03 — Network error during the upgrade shows a generic error

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; DevTools open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog, wait for "Confirm & pay $X".
2. In DevTools, block the URL pattern `*/api/billing/upgrade` (Network request blocking), or set the Network tab to "Offline".
3. Click "Confirm & pay $X".

**Expected result**
- The dialog stays open.
- An error reads "We couldn't complete your upgrade. Please try again."
- "Confirm & pay $X" is enabled again.
- The page still shows "Standard" at "$20/month".

**Pass/Fail criteria**: PASS if all four hold. FAIL otherwise.
**Cleanup**: Remove the block / go back online.

### TC-E2E-04 — Retry succeeds once the network is back

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-12, REQ-F-10 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | TC-E2E-03 just performed; block removed; dialog still open with the error |
| **Test data** | — |

**Steps**
1. Click "Confirm & pay $X" again.

**Expected result**
- The upgrade succeeds: the dialog closes, the page shows Premium, and the error is no longer shown.

**Pass/Fail criteria**: PASS if the retry completes the upgrade. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-05 — Backend unavailable during the upgrade shows a generic error

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog, wait for "Confirm & pay $X".
2. Stop the backend process.
3. Click "Confirm & pay $X".

**Expected result**
- The request fails (seen in DevTools as a network error or a 5xx from the local dev server).
- The dialog shows "We couldn't complete your upgrade. Please try again.", re-enables the button, and the page is unchanged.

**Pass/Fail criteria**: PASS if the generic error is shown and the page is unchanged. FAIL otherwise.
**Cleanup**: Start the backend again.

### TC-E2E-06 — 401 and 500 responses show the generic error

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | TO CONFIRM: a way to make `POST /api/billing/upgrade` return exactly 401 or 500 from the browser. A 401 needs an unknown email sent as the token (for example by editing the stored token in DevTools Application storage while the dialog is open — storage key and whether the page re-reads it are TO CONFIRM). A 500 needs a dev-provided fault-injection switch. |
| **Test data** | Unknown email, for example `nobody@example.com` |

**Steps**
1. Induce a 401 (and separately a 500) on the upgrade request using the confirmed method.
2. Click "Confirm & pay $X".

**Expected result**
- For both statuses: the dialog stays open with "We couldn't complete your upgrade. Please try again.", the button is re-enabled, and the page is unchanged.

**Pass/Fail criteria**: PASS if both statuses produce the generic error. FAIL otherwise. Record as Not run if no method is confirmed.
**Cleanup**: Restore the stored token (log out and in again); remove any fault switch; restart the backend.

### TC-E2E-07 — Preview failure hides the charge and the confirm button

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Backend running; DevTools open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in and wait for the Billing page.
2. In DevTools, block the URL pattern `*/api/billing/upgrade-preview`.
3. Click "Upgrade to Premium" and wait.

**Expected result**
- An error in the dialog explains that the charge could not be loaded.
- No "Remaining days" or "Charge today" rows are shown.
- No "Confirm & pay" button is available; "Cancel" still closes the dialog.

**Pass/Fail criteria**: PASS if the error appears and Confirm is unavailable. FAIL if a charge, a "$NaN"/blank amount, or an active Confirm appears. TO CONFIRM: the exact preview-error wording (not specified by the ACs).
**Cleanup**: Remove the block; close the dialog.

### TC-E2E-08 — Preview rejected for an account that became Premium elsewhere

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-12 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | Backend freshly started; two tabs |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Tab A: log in and stay on the Billing page (showing Standard); do not open the dialog.
2. Tab B: upgrade the account to Premium.
3. Tab A (no reload): click "Upgrade to Premium".

**Expected result**
- The preview is rejected (400 in DevTools); the dialog shows an error, no charge rows and no "Confirm & pay".

**Pass/Fail criteria**: PASS if the dialog shows an error and offers no Confirm. FAIL otherwise.
**Cleanup**: Restart the backend.
