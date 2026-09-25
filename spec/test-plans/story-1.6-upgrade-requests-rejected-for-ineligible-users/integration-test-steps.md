# Integration Test Steps — Story 1.6 Upgrade requests rejected for ineligible users

**Purpose**: verify that rejected requests leave the in-memory store untouched, as observed through the existing read endpoints, and that failures are recorded in the backend log.
**Scope**: AC-1, AC-2 (no data change), AC-3 (error logged).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.6 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.6"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only; access to the backend's console/log output |
| Test data / accounts to seed | Seeded `tpg@example.com` (upgraded to Premium once to get a Premium account) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-INT-01 — Rejected second upgrade leaves the Premium account unchanged

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-04 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; `tpg@example.com` upgraded once |
| **Test data** | `tpg@example.com` |

**Steps**
1. Snapshot `GET {API}/api/billing?email=tpg@example.com` and `GET {API}/api/users/me?email=tpg@example.com`.
2. Call the preview and the upgrade for `tpg@example.com` (both expected `400`).
3. Repeat step 1 and compare.

**Expected result**
- Both snapshots are unchanged: `"Premium"`, `"$40/month"`, `renew_at` `"Oct 30, 2026"`, same usages and perks.

**Pass/Fail criteria**: PASS if before and after are identical.
**Cleanup**: restart the backend.

### TC-INT-02 — Unknown account requests create no data

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-03, REQ-F-04 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | `nobody@example.com` |

**Steps**
1. Call the preview and the upgrade for `nobody@example.com` (both expected `401`).
2. `GET {API}/api/billing?email=nobody@example.com` and `GET {API}/api/users/me?email=nobody@example.com`.
3. `POST {API}/api/auth/login` with `{"email":"nobody@example.com","password":"anything"}`.

**Expected result**
- Step 2 calls both return `401`; step 3 returns `401` "Invalid credentials" — no account or billing record was created.

**Pass/Fail criteria**: PASS if no call in steps 2–3 succeeds.
**Cleanup**: none.

### TC-INT-03 — Unexpected error is recorded in the server log

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | The fault from API TC-API-06 can be induced (TO CONFIRM with dev); backend log output visible |
| **Test data** | The faulting account |

**Steps**
1. Induce the fault on the upgrade endpoint.
2. Inspect the backend log output for that request.

**Expected result**
- The log contains an error entry for the request (with enough detail for a developer to diagnose), while the HTTP response itself stayed generic.
- The log entry contains no password.

**Pass/Fail criteria**: PASS if the error is logged and the password is absent. If the fault cannot be induced, mark "Blocked — cannot induce".
**Cleanup**: restore the seed / restart the backend.
