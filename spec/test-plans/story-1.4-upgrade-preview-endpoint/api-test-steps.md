# API Test Steps — Story 1.4 Upgrade preview endpoint

**Purpose**: verify `GET /api/billing/upgrade-preview` returns the prorated upgrade preview for a Standard subscriber, and rejects malformed input safely.
**Scope**: AC-1 (preview values), AC-3 (validation). Read-only behaviour (AC-2) is in `integration-test-steps.md`.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.4 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.4"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port is not documented in the design artifacts (referred to below as `{API}`) |
| Local services that must be up | Backend API only (in-memory store; no database) |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password` (Standard, `$20/month`, renews `Oct 30, 2026`). Extra accounts via `POST {API}/api/auth/register` — a newly registered user renews today + 30 days. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

**Expected charge rule (REQ-F-02)**: `days_remaining = max(0, renew_at − today)`, `billable = min(days_remaining, 30)`, `prorated_charge = round(20 × billable / 30, 2)`. The API returns `days_remaining` as the **billable** (capped) value.

---

### TC-API-01 — Preview for the seeded Standard subscriber

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-03, REQ-NF-01 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started (seeded data unmodified) |
| **Test data** | `email=tpg@example.com` |

**Steps**
1. Note today's date and compute the expected billable days: `min(Oct 30, 2026 − today, 30)` and the expected charge with the rule above.
2. Send `GET {API}/api/billing/upgrade-preview?email=tpg@example.com`.
3. Record the status code and JSON body.

**Expected result**
- Status `200`.
- Body contains `current_plan` = `"Standard"`, `current_price` = `"$20/month"`, `new_plan` = `"Premium"`, `new_price` = `"$40/month"`, `days_in_cycle` = `30`.
- `days_remaining` equals the billable days from step 1 (on Sep 25, 2026: `30`), `prorated_charge` equals the expected charge (on Sep 25, 2026: `20.0`).

**Pass/Fail criteria**: PASS if status and every field match exactly; any missing field or different value is a FAIL.
**Cleanup**: none (read-only).

### TC-API-02 — Preview for a newly registered subscriber (full cycle)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02, REQ-F-03 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | Register `{"name":"Tester","email":"tc-api-02@example.com","password":"pw12345"}` |

**Steps**
1. `POST {API}/api/auth/register` with the test data; confirm `200`.
2. Send `GET {API}/api/billing/upgrade-preview?email=tc-api-02@example.com`.

**Expected result**
- Status `200`; `current_plan` `"Standard"`, `new_plan` `"Premium"`.
- `days_remaining` = `30` and `prorated_charge` = `20.0` (renewal is today + 30 days, so a full cycle is billable).

**Pass/Fail criteria**: PASS if both values are exactly `30` and `20.0`.
**Cleanup**: restart the backend to discard the registered user.

### TC-API-03 — Mid-cycle preview (15 days, $10.00)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | A Standard account whose renewal date is exactly 15 days after today. TO CONFIRM: no documented way exists to create an account with an arbitrary renewal date (registration always sets today + 30, the seeded account renews Oct 30, 2026). Options to confirm with dev: run on Oct 15, 2026 against the seeded account, or a documented test fixture/seed. |
| **Test data** | Account renewing today + 15 days |

**Steps**
1. Prepare the precondition as agreed with dev.
2. Send `GET {API}/api/billing/upgrade-preview?email=<that account>`.

**Expected result**
- Status `200`; `days_remaining` = `15`; `prorated_charge` = `10.0`.

**Pass/Fail criteria**: PASS if both values match exactly.
**Cleanup**: restart the backend / restore the seed.

### TC-API-04 — Missing email parameter is rejected

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | No query string |

**Steps**
1. Send `GET {API}/api/billing/upgrade-preview` with no `email` parameter.

**Expected result**
- A `4xx` validation status (e.g. `422` or `400`).
- The body contains no stack trace, file path, Python exception name or internal variable names.

**Pass/Fail criteria**: PASS if 4xx and the body is free of internal detail; `200` or `500` is a FAIL.
**Cleanup**: none.

### TC-API-05 — Malformed email is rejected

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | `email=not-an-email`; also an oversized value (e.g. 500 characters of `a` followed by `@example.com`) |

**Steps**
1. Send `GET {API}/api/billing/upgrade-preview?email=not-an-email`.
2. Repeat with the oversized value.

**Expected result**
- Each request returns a `4xx` status (validation error, or `401` "Not authenticated" if the value passes validation but matches no account — TO CONFIRM with dev which of the two is intended for a malformed address).
- No response contains a stack trace or internal detail.

**Pass/Fail criteria**: PASS if every response is 4xx with no internal detail; any `200` or `500` is a FAIL.
**Cleanup**: none.
