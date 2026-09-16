# API Test Plan — Story 1.1 Prorated Upgrade Endpoint

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.1's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep -i "story-1.1\|billing/upgrade"` |
| How to build & run it | Follow the project's own build docs (`README.md`, `src/backend/README.md` if present). This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the backend's local port (see `src/backend/README.md` / how `uvicorn main:app` is normally started) |
| Local services that must be up | None — in-memory data store, no external services |
| Test data / accounts to seed | The app's seeded account `tpg@example.com` (Standard plan, $20/month) — already present in `main.py`'s in-memory store on startup, no seeding action needed |

> If the build or local run fails, that is a blocker on the dev team — report it and do not log functional failures against a system that never started.

## TC-API-01 — Preview returns the prorated charge without mutating the plan

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-02, REQ-F-07 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running locally; `tpg@example.com` is on Standard plan |
| **Test data** | `POST /api/billing/upgrade?dry_run=true` body `{"email": "tpg@example.com"}` |

**Steps**
1. Send the request above.
2. Note the `prorated_charge` returned.
3. Immediately call `GET /api/billing?email=tpg@example.com`.

**Expected result**
- Step 1 response is `200` with `current_plan: "Standard"`, `new_plan: "Premium"`, and a numeric `prorated_charge`.
- Step 3 response still shows `plan_name: "Standard"` — the preview did not change anything.

**Pass/Fail criteria**: PASS only if both the charge is a plausible positive number AND the plan is unchanged after.
**Cleanup**: None — no state was mutated.

## TC-API-02 — Confirming the upgrade applies it and returns the applied charge

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-03, REQ-F-06 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running locally; a fresh (not-yet-upgraded) Standard account |
| **Test data** | `POST /api/billing/upgrade` body `{"email": "tpg@example.com"}` (no `dry_run`) |

**Steps**
1. Note the account's `on_demand_usage.remaining_balance` via `GET /api/billing?email=tpg@example.com` BEFORE the call.
2. Send the upgrade request above.
3. Call `GET /api/billing?email=tpg@example.com` again.

**Expected result**
- Step 2 response is `200` with `plan: "Premium"` and a numeric `applied_charge`.
- Step 3 shows `plan_name: "Premium"`, higher usage `total` limits than before, and the on-demand `remaining_balance` **unchanged** from Step 1.

**Pass/Fail criteria**: PASS only if plan is Premium, limits increased, and the balance is byte-identical to the pre-upgrade value.
**Cleanup**: Restart the backend (in-memory store) to reset the account back to Standard for further test runs, or re-register a fresh test account.

## TC-API-03 — Idempotency: an already-Premium account cannot be upgraded again

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-05 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | An account already on the Premium plan (run TC-API-02 first, or register+upgrade a fresh account) |
| **Test data** | `POST /api/billing/upgrade` body with that account's email |

**Steps**
1. Confirm the account is on Premium (`GET /api/billing`).
2. Send the upgrade request again.
3. Repeat with `?dry_run=true` appended.

**Expected result**
- Both Step 2 and Step 3 return `400` with a `detail` message stating the account is already Premium.
- No duplicate charge — the account's billing record is unchanged after both calls.

**Pass/Fail criteria**: PASS only if BOTH calls return 400 and no state changed.
**Cleanup**: None.

## TC-API-04 — Response code and error-response validation across all paths

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2, AC-3, AC-4 / REQ-NF-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running locally |
| **Test data** | See steps |

**Steps**
1. Call with a valid Standard account, `dry_run=true` → expect `200`.
2. Call with a valid Standard account, no `dry_run` → expect `200`.
3. Call with an already-Premium account → expect `400`.
4. Call with an email not in the system → expect `401`.
5. Call with an empty JSON body `{}` → expect `422`.

**Expected result**
- Each call returns exactly the status code listed, and every error response (400/401/422) includes a body with a human-readable message field.

**Pass/Fail criteria**: All 5 status codes match exactly.
**Cleanup**: None.

## TC-API-05 — Request validation: malformed/missing fields rejected before any business logic runs

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-10 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running locally |
| **Test data** | `{}`, `{"email": 12345}`, `{"emailx": "tpg@example.com"}` |

**Steps**
1. Send each malformed payload above to `POST /api/billing/upgrade`.
2. Observe the response for each.

**Expected result**
- All three return `422` with a validation-error body naming the offending field — never a `500` and never a partial success.

**Pass/Fail criteria**: All three return 422, none mutate any account's billing state.
**Cleanup**: None.

## TC-API-06 — Response contract validation

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-F-02, REQ-F-03 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running locally |
| **Test data** | Preview and apply calls for a fresh Standard account |

**Steps**
1. Call the preview (`dry_run=true`) endpoint.
2. Call the apply endpoint.
3. Inspect both response bodies' field names and types.

**Expected result**
- Preview response has exactly: `prorated_charge` (number), `current_plan` (string), `new_plan` (string), `days_remaining` (integer).
- Apply response has exactly: `applied_charge` (number), `plan` (string), `billing` (object matching the shape returned by `GET /api/billing`).

**Pass/Fail criteria**: Both shapes match exactly — no missing field, no unexpected extra top-level field.
**Cleanup**: None.

## TC-API-07 — No annual-billing option is exposed (monthly cycle only)

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-06 |
| **Type** | API |
| **Priority** | P3 |
| **Preconditions** | Backend running locally |
| **Test data** | A preview/apply call with an extra `billing_cycle: "annual"` field in the body |

**Steps**
1. Send `POST /api/billing/upgrade?dry_run=true` with body `{"email": "tpg@example.com", "billing_cycle": "annual"}`.
2. Observe the response.

**Expected result**
- The extra field is silently ignored (Pydantic's default behaviour) and the response is identical to a plain monthly preview — no annual pricing, no different `prorated_charge` — confirming no annual-billing branch exists to accidentally trigger.

**Pass/Fail criteria**: Response is byte-identical (aside from timing) to TC-API-01's response for the same account.
**Cleanup**: None.
