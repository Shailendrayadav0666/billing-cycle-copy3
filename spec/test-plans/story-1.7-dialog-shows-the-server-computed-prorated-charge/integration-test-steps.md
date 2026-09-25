# Integration Test Steps — Story 1.7: Dialog shows the server-computed prorated charge

**Purpose**: verify the boundary between the Billing page dialog and the backend preview endpoint (`GET /api/billing/upgrade-preview`, `spec/plans/architecture.md` Section 5): the dialog asks the server, and shows exactly what the server returned.
**Scope**: AC-1, AC-3 of Story 1.7. Observation is through the browser DevTools Network tab (black-box).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.7 `[STORY]` PR once raised and merged into the epic branch (requires Stories 1.1 and 1.4 merged) |
| Confirm the story is in the build | `git log --oneline \| grep "1.7"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore (in-memory store) |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026 (Atlas). Registered accounts renew today + 30 days. The seeded account can only be upgraded once per backend run — restart the backend to reset it. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-INT-01 — Opening the dialog calls the preview endpoint for the logged-in account

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-03, REQ-F-09 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; DevTools Network tab open and cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in as `tpg@example.com` and wait for the Billing page.
2. Clear the Network log.
3. Click "Upgrade to Premium".
4. Inspect the requests made.

**Expected result**
- Exactly one `GET` request to `/api/billing/upgrade-preview` is made, carrying `email=tpg@example.com` as its query parameter.
- It returns 200 with a JSON body containing `current_plan`, `current_price`, `new_plan`, `new_price`, `days_remaining`, `days_in_cycle` and `prorated_charge`.
- No `POST` request to `/api/billing/upgrade` is made.

**Pass/Fail criteria**: PASS if the preview is requested for the logged-in account and no upgrade request is sent. FAIL otherwise.
**Cleanup**: Click "Cancel".

### TC-INT-02 — Displayed values equal the server's response exactly

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-01 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | As TC-INT-01 |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the upgrade dialog and wait for it to load.
2. In the Network tab, open the `/api/billing/upgrade-preview` response and note `days_remaining` and `prorated_charge`.
3. Compare them with the "Remaining days", "Charge today" and "Confirm & pay" text in the dialog.

**Expected result**
- "Remaining days" shows `days_remaining` followed by "days".
- "Charge today" and the "Confirm & pay" button show `prorated_charge` as a dollar amount with exactly 2 decimals (for example `20` → "$20.00", `19.33` → "$19.33", `0` → "$0.00").

**Pass/Fail criteria**: PASS if both values match the response exactly after 2-decimal formatting. FAIL on any difference.
**Cleanup**: Click "Cancel".

### TC-INT-03 — The page does not calculate the charge itself (response override)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-01 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | As TC-INT-01; a browser that supports local response overrides (for example Chrome DevTools "Override content") |
| **Test data** | Override body for `/api/billing/upgrade-preview`: same fields as the real response but `days_remaining: 7` and `prorated_charge: 4.67` |

**Steps**
1. Set up a local override for the preview response with the test data above.
2. Log in as `tpg@example.com` and open the upgrade dialog.
3. Read the dialog values.
4. Remove the override.

**Expected result**
- The dialog shows "7 days" and "$4.67" — the overridden server values — even though the real renewal date would give a different result.

**Pass/Fail criteria**: PASS if the dialog shows the overridden values. FAIL if it shows values computed from the renewal date instead (the page is calculating on its own). TO CONFIRM: if response overrides are not available to the tester, skip and record as Not run.
**Cleanup**: Remove the override; click "Cancel".

### TC-INT-04 — Boundary values from the server are formatted correctly

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-09 |
| **Type** | Integration |
| **Priority** | P3 |
| **Preconditions** | As TC-INT-03 (response overrides available) |
| **Test data** | Overrides: (a) `days_remaining: 0, prorated_charge: 0`; (b) `days_remaining: 29, prorated_charge: 19.33`; (c) `days_remaining: 30, prorated_charge: 20` |

**Steps**
1. For each override (a), (b), (c): apply it, open the dialog, read the values, close the dialog.

**Expected result**
- (a) "0 days" and "$0.00"; (b) "29 days" and "$19.33"; (c) "30 days" and "$20.00" — in both "Charge today" and the "Confirm & pay" button.

**Pass/Fail criteria**: PASS if all three render as expected. FAIL on missing decimals, rounding differences or blank values.
**Cleanup**: Remove the override; click "Cancel".
