# API Test Steps — Story 1.2 Prorated charge calculation

**Purpose**: verify the prorated charge rule from the outside. Story 1.2 delivers a pure backend function with no endpoint of its own, so its only externally observable surface is the read-only preview endpoint `GET /api/billing/upgrade-preview` (Story 1.4, `spec/plans/architecture.md` Section 5). These cases are executed through that endpoint.
**Scope**: AC-1 to AC-4. REQ-F-02, REQ-NF-01.
**Formula under test** (REQ-F-02): `days_remaining = max(0, renew_at − today)`, `billable_days = min(days_remaining, 30)`, `prorated_charge = round(20 × billable_days / 30, 2)`. The preview returns `days_remaining` as the capped billable days (REQ-F-03).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.2 `[STORY]` PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.2"` — AND Story 1.4 (preview endpoint) must also be merged, since it is the only way to observe this function |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — the local backend URL is not documented in the design artifacts |
| Local services that must be up | Backend API running locally from the branch above (no datastore — in-memory store per Atlas) |
| Test data / accounts to seed | Seeded account `tpg@example.com` (plan Standard, renews Oct 30, 2026 — per Atlas); accounts registered during the test via `POST /api/auth/register` (renewal = registration day + 30 days, per Atlas) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

**Controlling "today" and renewal dates**: the documented API offers no way to set a user's `renew_at` or to pin the server clock. TO CONFIRM (dev team): a documented test hook, fixture account, or clock override for the renewal dates below. Where no hook exists, cases are written against the dates the documented API does produce: the seeded account (Oct 30, 2026) and a freshly registered account (execution day + 30 days). Record the execution day in every result.

Tool: any HTTP client (curl, Postman, or the browser address bar for GET).

---

### TC-API-01 — Mid-cycle charge: 15 days remaining costs $10.00

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Stories 1.2 and 1.4 merged; a Standard account whose renewal date is exactly 15 days after the execution day (TO CONFIRM how to set it). Alternative without a hook: run on Oct 15, 2026 against `tpg@example.com` (15 days before Oct 30, 2026) |
| **Test data** | Account with `renew_at` = execution day + 15 days |

**Steps**
1. Send `GET <base-url>/api/billing/upgrade-preview?email=<account email>`.

**Expected result**
- HTTP 200.
- `days_remaining` = 15, `days_in_cycle` = 30, `prorated_charge` = 10.0 (10.00).

**Pass/Fail criteria**: PASS if status and all three values match exactly; FAIL otherwise.
**Cleanup**: None (read-only).

### TC-API-02 — Boundary: 29 days remaining costs $19.33

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | As TC-API-01, with `renew_at` = execution day + 29 days (TO CONFIRM how to set). Alternative: run on Oct 1, 2026 against `tpg@example.com` |
| **Test data** | Account with `renew_at` = execution day + 29 days |

**Steps**
1. Send `GET <base-url>/api/billing/upgrade-preview?email=<account email>`.

**Expected result**
- HTTP 200; `days_remaining` = 29; `prorated_charge` = 19.33 (rounded to 2 decimals, not 19.333 and not 19.34).

**Pass/Fail criteria**: PASS if the charge is exactly 19.33; FAIL otherwise.
**Cleanup**: None.

### TC-API-03 — Renewal today costs nothing

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Standard account whose renewal date equals the execution day (TO CONFIRM how to set). Alternative: run on Oct 30, 2026 against `tpg@example.com` |
| **Test data** | Account with `renew_at` = execution day |

**Steps**
1. Send `GET <base-url>/api/billing/upgrade-preview?email=<account email>`.

**Expected result**
- HTTP 200; `days_remaining` = 0; `prorated_charge` = 0.0 (0.00).

**Pass/Fail criteria**: PASS if both values are 0; FAIL otherwise.
**Cleanup**: None.

### TC-API-04 — Renewal in the past costs nothing (negative)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Standard account whose renewal date is before the execution day (TO CONFIRM how to set). Alternative: run on or after Oct 31, 2026 against `tpg@example.com` |
| **Test data** | Account with `renew_at` earlier than the execution day (for example 24 days earlier) |

**Steps**
1. Send `GET <base-url>/api/billing/upgrade-preview?email=<account email>`.

**Expected result**
- HTTP 200; `days_remaining` = 0 (never negative); `prorated_charge` = 0.0 (never negative).

**Pass/Fail criteria**: PASS if neither value is negative and both are 0; FAIL otherwise.
**Cleanup**: None.

### TC-API-05 — Cap: a freshly registered account (30 days) costs $20.00

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Stories 1.2 and 1.4 merged; backend freshly started |
| **Test data** | Register `pb-cap@example.com` / name `Cap Test` / password `Passw0rd!` |

**Steps**
1. Send `POST <base-url>/api/auth/register` with `{"name":"Cap Test","email":"pb-cap@example.com","password":"Passw0rd!"}`.
2. Send `GET <base-url>/api/billing/upgrade-preview?email=pb-cap@example.com`.

**Expected result**
- Step 1: registration succeeds.
- Step 2: HTTP 200; `days_remaining` = 30; `prorated_charge` = 20.0 (20.00).

**Pass/Fail criteria**: PASS if the charge is exactly 20.00 for 30 days; FAIL otherwise.
**Cleanup**: Restart the backend to clear the in-memory store.

### TC-API-06 — Cap: more than 30 days remaining is still $20.00 (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Stories 1.2 and 1.4 merged; executed on or before Sep 29, 2026 so that Oct 30, 2026 is more than 30 days away (for example on Sep 25, 2026 it is 35 days). If run later, use an account with `renew_at` = execution day + 35 days (TO CONFIRM how to set) |
| **Test data** | `tpg@example.com` (renews Oct 30, 2026) |

**Steps**
1. Send `GET <base-url>/api/billing/upgrade-preview?email=tpg@example.com`.

**Expected result**
- HTTP 200; `days_remaining` = 30 (capped, not 35); `prorated_charge` = 20.0 — never more than 20.00 (the design reference's demo figure of $25.33 must NOT appear).

**Pass/Fail criteria**: PASS if days are capped at 30 and the charge is 20.00; FAIL if the charge exceeds 20.00 or days exceed 30.
**Cleanup**: None.

### TC-API-07 — The stored "MMM DD, YYYY" renewal date is read as that calendar date

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Stories 1.2 and 1.4 merged; backend freshly started |
| **Test data** | `tpg@example.com` (stored renewal text "Oct 30, 2026", visible on the Billing page and in `GET /api/billing?email=tpg@example.com`) |

**Steps**
1. Send `GET <base-url>/api/billing?email=tpg@example.com` and note `renew_at` (expect "Oct 30, 2026").
2. Compute D = calendar days from the execution day to 30 October 2026; expected days = min(max(D, 0), 30); expected charge = round(20 × expected days / 30, 2).
3. Send `GET <base-url>/api/billing/upgrade-preview?email=tpg@example.com`.

**Expected result**
- `days_remaining` and `prorated_charge` equal the expected values from step 2. On Sep 25, 2026 this is 30 days and 20.00.

**Pass/Fail criteria**: PASS if both values match the calculation from the stored date; FAIL if the date is misread (for example as day/month swapped or off by a day).
**Cleanup**: None.

### TC-API-08 — A renewal date created by registration is also read correctly (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | As TC-API-05 |
| **Test data** | Register `pb-date@example.com` / name `Date Test` / password `Passw0rd!` |

**Steps**
1. Register the account (as TC-API-05 step 1).
2. Send `GET <base-url>/api/billing?email=pb-date@example.com` and note `renew_at`.
3. Send `GET <base-url>/api/billing/upgrade-preview?email=pb-date@example.com`.

**Expected result**
- Step 2: `renew_at` is in the "MMM DD, YYYY" form (for example "Oct 25, 2026" when registered on Sep 25, 2026).
- Step 3: HTTP 200, `days_remaining` = 30, `prorated_charge` = 20.0 — the preview parses the same format without error.

**Pass/Fail criteria**: PASS if the preview returns 200 with 30 / 20.00; FAIL on any error or other values.
**Cleanup**: Restart the backend.
