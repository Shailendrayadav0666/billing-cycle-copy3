# API Test Steps — Story 1.5 Upgrade endpoint switches the user to Premium

**Purpose**: verify `POST /api/billing/upgrade` upgrades a Standard subscriber, returns the Premium payload with a server-computed charge, and keeps the renewal date.
**Scope**: AC-1, AC-3, AC-4 at the API level. Persistence across endpoints (AC-2) is in `integration-test-steps.md`.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.5 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.5"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only (in-memory store; restarting it resets all data) |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password` (Standard, `$20/month`, renews `Oct 30, 2026`). Extra accounts via `POST {API}/api/auth/register` — renew today + 30 days. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

**Expected charge rule (REQ-F-02)**: `billable = min(max(0, renew_at − today), 30)`, `prorated_charge = round(20 × billable / 30, 2)`.

---

### TC-API-01 — Seeded Standard subscriber is upgraded

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-01, REQ-F-04 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | Body `{"email": "tpg@example.com"}` |

**Steps**
1. Compute the expected billable days and charge for `renew_at` `Oct 30, 2026` and today (on Sep 25, 2026: `30` days, `20.0`).
2. `POST {API}/api/billing/upgrade` with the body, `Content-Type: application/json`.

**Expected result**
- Status `200`.
- `plan_name` `"Premium"`, `price` `"$40/month"`, `renew_at` `"Oct 30, 2026"`.
- `usages` values: `"4K Ultra HD"`, `"Can watch on 4 devices at once"`, `"Can download on 6 devices"`.
- `included_usage.items` labels: `"Ad-free streaming"`, `"Spatial audio (select titles)"`, `"Dolby Vision (select titles)"`.
- `prorated_charge` and `days_remaining` equal the values from step 1.

**Pass/Fail criteria**: PASS if status and every listed field match exactly.
**Cleanup**: restart the backend.

### TC-API-02 — Newly registered subscriber is upgraded for a full-cycle charge

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02, REQ-F-04 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | Register `{"name":"Tester","email":"tc15-02@example.com","password":"pw12345"}` |

**Steps**
1. Register the account; note the returned `renew_at` (today + 30 days).
2. `POST {API}/api/billing/upgrade` with `{"email": "tc15-02@example.com"}`.

**Expected result**
- Status `200`; `plan_name` `"Premium"`; `prorated_charge` `20.0`; `days_remaining` `30`; `renew_at` equals the value from step 1.

**Pass/Fail criteria**: PASS if all values match.
**Cleanup**: restart the backend.

### TC-API-03 — Mid-cycle upgrade charges $10.00 for 15 days

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | A Standard account renewing exactly 15 days after today. TO CONFIRM: no documented way to create one (registration sets today + 30; the seed renews Oct 30, 2026) — agree a fixture, or run on Oct 15, 2026 against the seeded account. |
| **Test data** | That account's email |

**Steps**
1. Prepare the precondition.
2. `POST {API}/api/billing/upgrade` with that email.

**Expected result**
- Status `200`; `prorated_charge` `10.0`; `days_remaining` `15`.

**Pass/Fail criteria**: PASS if both values match exactly.
**Cleanup**: restart the backend / restore the seed.

### TC-API-04 — Renewal date is unchanged in the response

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-06 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` |

**Steps**
1. `GET {API}/api/billing?email=tpg@example.com`; note `renew_at`.
2. `POST {API}/api/billing/upgrade` with `{"email": "tpg@example.com"}`.

**Expected result**
- The upgrade response `renew_at` is `"Oct 30, 2026"` — identical to step 1, not today's date and not today + 30.

**Pass/Fail criteria**: PASS only if the value is unchanged.
**Cleanup**: restart the backend.

### TC-API-05 — Extra client fields are ignored

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-NF-05 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | Body `{"email":"tpg@example.com","plan":"Enterprise","price":"$1/month","prorated_charge":0.01,"renew_at":"Jan 01, 2030"}` |

**Steps**
1. `POST {API}/api/billing/upgrade` with the body.
2. `GET {API}/api/billing?email=tpg@example.com`.

**Expected result**
- Either `200` with `plan_name` `"Premium"`, `price` `"$40/month"`, `renew_at` `"Oct 30, 2026"` and the server-computed `prorated_charge` (not `0.01`), or a `4xx` validation error that rejects the extra fields and leaves the account on Standard. TO CONFIRM with dev which of the two is intended (REQ-NF-05 allows "rejected or ignored").
- In no case is the plan `"Enterprise"`, the price `"$1/month"`, the charge `0.01` or `renew_at` `"Jan 01, 2030"`.

**Pass/Fail criteria**: PASS if none of the client-supplied values takes effect.
**Cleanup**: restart the backend.

### TC-API-06 — Missing or malformed body is rejected

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 (negative) / REQ-NF-05 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started |
| **Test data** | Empty body; `{}`; `{"email": 123}`; non-JSON text `email=tpg@example.com` |

**Steps**
1. `POST {API}/api/billing/upgrade` with each body.
2. `GET {API}/api/billing?email=tpg@example.com`.

**Expected result**
- Each request returns a `4xx` status with no stack trace or internal detail.
- `tpg@example.com` is still `"Standard"` at `"$20/month"`.

**Pass/Fail criteria**: PASS if all are 4xx and the account is unchanged.
**Cleanup**: none.
