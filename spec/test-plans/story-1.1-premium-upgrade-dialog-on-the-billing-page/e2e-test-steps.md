# E2E Test Steps — Story 1.1 Premium upgrade dialog on the Billing page

**Purpose**: verify, from the browser, that a Standard subscriber sees the "Upgrade to Premium" button, can open the dialog shell with the plan comparison and Premium benefits, and can dismiss it without any change; and that a Premium subscriber is not offered the upgrade.
**Scope**: AC-1 to AC-4. Keyboard and screen-reader behaviour (AC-5) is in `accessibility-test-steps.md`.
**Note**: this story ships the dialog shell only. "Remaining days", "Charge today" and "Confirm & pay" arrive in Story 1.7 and must NOT appear yet.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.1 `[STORY]` PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — the local frontend URL is not documented in the design artifacts |
| Local services that must be up | Backend API and frontend, both running locally from the branch above |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` (plan Standard, $20/month, renews Oct 30, 2026 — per Atlas) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-E2E-01 — Standard subscriber sees the Upgrade to Premium button

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-08 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; browser with no stored session |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the local frontend URL in the browser.
2. Log in as `tpg@example.com` / `password`.
3. On the Billing page, look at the "Plan & Billing" title row.

**Expected result**
- A green primary button labelled "Upgrade to Premium" is shown at the right of the "Plan & Billing" title row, matching the design reference (`spec/context-project/new-references/StreamPlex Billing.html`).
- The page still shows "Current plan: Standard" and "$20/month".

**Pass/Fail criteria**: PASS if the button is visible in the title row with the exact label; FAIL if it is missing, mislabelled, or placed elsewhere.
**Cleanup**: Log out.

### TC-E2E-02 — Premium subscriber is not offered the upgrade

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-08 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; a subscriber whose billing data has plan "Premium" |
| **Test data** | TO CONFIRM — no Premium account exists in the seed data. Once Story 1.5 is merged, upgrade a freshly registered account via `POST /api/billing/upgrade`; until then this case can only be run with a dev-provided Premium fixture |

**Steps**
1. Obtain a Premium account (see Test data).
2. Log in as that account and open the Billing page.
3. Inspect the "Plan & Billing" title row and the rest of the page.

**Expected result**
- No "Upgrade to Premium" button is rendered anywhere on the page.

**Pass/Fail criteria**: PASS if the button is absent; FAIL if it is shown in any form (including disabled).
**Cleanup**: Restart the backend to reset the in-memory store (Atlas: all data is in memory).

### TC-E2E-03 — Opening the dialog shows the plan comparison and Premium benefits

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Logged in as `tpg@example.com` on the Billing page; browser developer tools Network tab open and cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Click "Upgrade to Premium".
2. Read the dialog content.
3. Check the Network tab for requests made since step 1.

**Expected result**
- A dialog opens over a dark translucent backdrop.
- Title "Upgrade to Premium".
- Line "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
- Summary rows "Current plan — Standard ($20/mo)" and "New plan — Premium ($40/mo)".
- Benefit list: "4K Ultra HD video quality", "Stream on 4 devices at once", "Download on 6 devices", "Dolby Vision (select titles)".
- A "Cancel" button.
- No request to `/api/billing/upgrade-preview` or `/api/billing/upgrade` in the Network tab.

**Pass/Fail criteria**: PASS if every listed element is present with exact text and no upgrade request is sent; FAIL otherwise.
**Cleanup**: Click "Cancel".

### TC-E2E-04 — Dialog shell shows no charge or confirm controls yet (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | As TC-E2E-03; Story 1.7 NOT yet merged |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Click "Upgrade to Premium".
2. Look for "Remaining days", "Charge today" and a "Confirm & pay" button.

**Expected result**
- None of "Remaining days", "Charge today" or "Confirm & pay" is shown; there is no way to trigger an upgrade from the dialog.
- The benefit list does NOT show the prototype's demo values "Download on 4 devices" or "4K + HDR".

**Pass/Fail criteria**: PASS if no charge/confirm controls and no prototype demo values appear; FAIL if any do. (Skip this case once Story 1.7 is merged.)
**Cleanup**: Click "Cancel".

### TC-E2E-05 — Dismiss with Cancel leaves the page unchanged

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-13 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | Logged in as `tpg@example.com`; dialog open; Network tab cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Click "Cancel".
2. Inspect the page and the Network tab.

**Expected result**
- The dialog closes.
- The page still shows "Current plan: Standard", "$20/month", "Oct 30, 2026", and the "Upgrade to Premium" button.
- No request to any upgrade endpoint.

**Pass/Fail criteria**: PASS if the dialog closes with no change and no upgrade request; FAIL otherwise.
**Cleanup**: None.

### TC-E2E-06 — Dismiss with Escape and with a backdrop click

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-13 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | Logged in as `tpg@example.com`; Network tab cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog; press Escape.
2. Open the dialog again; click the dark backdrop outside the white dialog card.
3. Open the dialog again; click inside the dialog card on a non-button area (for example the benefit list).

**Expected result**
- Steps 1 and 2: the dialog closes; the page is unchanged; no upgrade request is sent.
- Step 3 (negative): clicking inside the card does NOT close the dialog.

**Pass/Fail criteria**: PASS if Escape and backdrop close the dialog without change, and a click inside the card does not; FAIL otherwise.
**Cleanup**: Click "Cancel" if the dialog is open.

### TC-E2E-07 — Reopening after dismissal shows the same dialog (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3, AC-4 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | Logged in as `tpg@example.com` |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open and cancel the dialog three times in a row.
2. Open it a fourth time.

**Expected result**
- The dialog opens each time with the same content as TC-E2E-03; only one dialog is ever visible; the page is unchanged after each close.

**Pass/Fail criteria**: PASS if behaviour is identical on every open; FAIL on duplicated dialogs, stale content or page changes.
**Cleanup**: Click "Cancel".
