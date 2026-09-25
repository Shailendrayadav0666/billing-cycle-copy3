# Security Test Steps — Story 1.9: Upgrade failures shown in the dialog

**Purpose**: verify that errors shown to the subscriber disclose no internal detail, and that a failed upgrade never leaves the page claiming a plan change.
**Scope**: AC-1, AC-2 of Story 1.9, mapped to Security Baseline SECURITY-15 (exception handling and fail-safe defaults).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.9 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.9"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-SEC-01 — Generic failures show no technical detail

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-NF-05 (SECURITY-15) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started; DevTools open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog and wait for the charge.
2. Stop the backend, then click "Confirm & pay $X".
3. Read the dialog's error text and the browser Console.

**Expected result**
- The dialog shows only "We couldn't complete your upgrade. Please try again." — no status codes, stack traces, URLs, exception names or raw response bodies.
- The Console shows no uncaught (unhandled) promise rejection from the page.

**Pass/Fail criteria**: PASS if the user sees only the generic message and nothing is unhandled. FAIL if any internal detail is displayed or an unhandled rejection is logged.
**Cleanup**: Start the backend again.

### TC-SEC-02 — A failed upgrade never shows Premium (fail-safe display)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-F-12 (SECURITY-15 fail-safe defaults) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started; DevTools request blocking available |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog; block `*/api/billing/upgrade`; click "Confirm & pay $X".
2. Close the dialog with "Cancel" and inspect the page.
3. Remove the block and reload the page.

**Expected result**
- After the failure and after the reload, the page shows "Standard" at "$20/month", the "Upgrade to Premium" button, and no "Upgraded to Premium" panel.

**Pass/Fail criteria**: PASS if no Premium state or success panel appears for a failed request. FAIL otherwise.
**Cleanup**: None (no state was changed).
