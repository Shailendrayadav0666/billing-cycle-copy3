# E2E Test Steps — Story 1.7: Dialog shows the server-computed prorated charge

**Purpose**: verify, as a subscriber would, that opening the upgrade dialog loads and shows the remaining days and today's charge exactly as the server returns them, with a "Confirm & pay" button.
**Scope**: AC-1, AC-2, AC-3 of Story 1.7 (`spec/plans/stories.md`). Confirming the upgrade is Story 1.8 and is not tested here.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.7 `[STORY]` PR once raised and merged into the epic branch (requires Stories 1.1 and 1.4 merged) |
| Confirm the story is in the build | `git log --oneline \| grep "1.7"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM (not documented in the design artifacts). Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore (in-memory store) |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026 (Atlas). Registered accounts renew today + 30 days. The seeded account can only be upgraded once per backend run — restart the backend to reset it. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-E2E-01 — Dialog shows remaining days and charge for the seeded Standard account

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; backend freshly started so `tpg@example.com` is Standard |
| **Test data** | `tpg@example.com` / `password`; renewal Oct 30, 2026 |

**Steps**
1. Open the frontend base URL and log in as `tpg@example.com` / `password`.
2. On the Billing page, note today's date and the "Renew at" date shown.
3. Click "Upgrade to Premium".
4. Wait for the dialog's summary box to finish loading.

**Expected result**
- The summary box shows a "Remaining days" row and a "Charge today" row.
- With today on or before Sep 30, 2026 the renewal is 30 or more days away, so "Remaining days" reads "30 days" and "Charge today" reads "$20.00" (capped at a full cycle, REQ-F-02). On a later date, the values match the calendar days to Oct 30, 2026 and `$20.00 × days / 30`, rounded to 2 decimals.
- A primary "Confirm & pay $20.00" button (same amount as "Charge today") appears beside "Cancel".

**Pass/Fail criteria**: PASS if both rows and the "Confirm & pay" button show the amounts above, and the button amount equals "Charge today". Anything else is a FAIL.
**Cleanup**: Click "Cancel". No state was changed.

### TC-E2E-02 — Dialog shows a mid-cycle charge below the cap

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | System Under Test running; an account whose renewal date is fewer than 30 days away |
| **Test data** | TO CONFIRM: no documented way to create an account with a renewal date under 30 days — new registrations renew today + 30 days (always the $20.00 cap). Ask the dev team for a seed/fixture (for example "renews in 15 days" → expected 15 days / $10.00). |

**Steps**
1. Log in with the account whose renewal date is N days away (N between 1 and 29).
2. Click "Upgrade to Premium" and wait for the summary to load.

**Expected result**
- "Remaining days" reads "N days".
- "Charge today" reads `$20.00 × N / 30` rounded to 2 decimals (15 days → "$10.00", 29 days → "$19.33").
- The button reads "Confirm & pay" followed by the same amount.

**Pass/Fail criteria**: PASS if days and charge match the formula exactly to the cent. Anything else is a FAIL.
**Cleanup**: Click "Cancel".

### TC-E2E-03 — Loading state shows while the preview is pending, and no Confirm is offered

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | System Under Test running; browser DevTools open on the Network tab |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in as `tpg@example.com`.
2. In DevTools, set network throttling to a very slow profile (for example "Slow 3G", or a custom profile with several seconds of latency).
3. Click "Upgrade to Premium".
4. Observe the dialog's summary box before the preview request completes.
5. Restore network throttling to "No throttling".

**Expected result**
- While the preview request is pending, the summary box shows a loading state in place of the "Remaining days" / "Charge today" rows.
- No "Confirm & pay" button is available while loading.
- Once the request completes, the rows and the "Confirm & pay" button appear.

**Pass/Fail criteria**: PASS if a loading state is visible during the pending request and Confirm is absent or unusable until the preview arrives. FAIL if the charge or an active Confirm appears before the response.
**Cleanup**: Click "Cancel"; remove throttling.

### TC-E2E-04 — Reopening the dialog loads a fresh preview each time

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-09 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | System Under Test running; DevTools Network tab open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in and open the upgrade dialog; wait for the charge to load.
2. Click "Cancel".
3. Click "Upgrade to Premium" again.

**Expected result**
- Each opening of the dialog issues its own `GET` request to `/api/billing/upgrade-preview` (visible in the Network tab).
- The second opening shows the same days and charge as the first.

**Pass/Fail criteria**: PASS if a preview request is made on each open and the values are consistent. FAIL if the second opening shows stale or different values without a request. TO CONFIRM: whether caching the preview between openings is acceptable (AC-1 says the page requests the preview when the dialog opens).
**Cleanup**: Click "Cancel".
