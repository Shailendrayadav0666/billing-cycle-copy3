# Security Test Steps — Story 1.8: Confirm the upgrade from the dialog

**Purpose**: verify the confirm action cannot be used to choose a price or plan from the browser, and that repeating it cannot charge twice.
**Scope**: AC-1 of Story 1.8, mapped to Security Baseline rules. The endpoint's own validation and rejection paths are Stories 1.5 and 1.6.

> **Known accepted risk (REQ-NF-05, Q3 A)**: the backend identifies the caller only by the email "token", so anyone who knows an account's email can upgrade it. This is out of scope for this cycle and is **not** logged as a defect by these cases.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.8 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.8"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-SEC-01 — The confirm request carries no client-chosen price, plan or charge

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-05 (SECURITY-08 mass-assignment, SECURITY-11 secure design) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; DevTools Network tab open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog, and confirm.
2. Inspect the `POST /api/billing/upgrade` request payload.

**Expected result**
- The payload contains only `email`. No `plan`, `price`, `prorated_charge`, `usages` or similar field is sent.

**Pass/Fail criteria**: PASS if only the email is sent. FAIL if any pricing or plan value travels from the browser.
**Cleanup**: Restart the backend.

### TC-SEC-02 — Replaying the confirm request after success does not upgrade or charge again

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03, REQ-F-04 (SECURITY-11) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | TC-SEC-01 completed (account upgraded; backend still running); DevTools Network tab still showing the POST |
| **Test data** | `tpg@example.com` |

**Steps**
1. Right-click the successful `POST /api/billing/upgrade` in the Network log and use "Replay XHR" (or "Copy as fetch" and run it in the Console).
2. Inspect the replayed response.
3. Reload the Billing page.

**Expected result**
- The replay returns 400 with `{"detail": "Already on Premium plan"}`.
- The page still shows Premium at "$40/month"; nothing else changes.

**Pass/Fail criteria**: PASS if the replay is refused with 400 and state is unchanged. FAIL if it returns 200 or produces a second charge.
**Cleanup**: Restart the backend.
