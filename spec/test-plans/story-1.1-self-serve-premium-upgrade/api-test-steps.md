# API Test Steps — Story 1.1 Self-Serve Premium Upgrade

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/self-serve-premium-upgrade` |
| This story's merged PR | 🔴 TO CONFIRM: [PR URL once Story 1.1's PR merges] |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | Backend: `http://localhost:8000` (per `spec/plans/atlas-deep-dive.md` Getting Started section) |
| Local services that must be up | Backend (FastAPI) only — no database, no queue |
| Test data / accounts to seed | `tpg@example.com` (seeded Standard user, per `src/backend/main.py`'s existing in-memory `users` dict) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log functional failures against a system that never started.

---

### TC-API-01 — Successful prorated upgrade returns the full billing contract

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | Backend running locally; a Standard-plan user exists with a known `renew_at` 15 days in the future |
| **Test data** | `{"email": "tpg@example.com"}` |

**Steps**
1. Send `POST /api/billing/upgrade` with the test data as the JSON body.
2. Inspect the response status and body.

**Expected result**
- Status `200`.
- Response body contains `plan_name: "Premium"`, `price: "$40/month"`, `renew_at` unchanged from before the call, `prorated_charge: 10.00`, a full `usages` array, and `included_usage`.
- `usages` includes `video-quality: "4K Ultra HD"`, `screens: "Can watch on 4 devices at once"`, `downloads: "Can download on 6 devices"`.
- `included_usage.items` includes `ad-free`, `spatial-audio`, and a new `dolby-vision` entry.

**Pass/Fail criteria**: PASS only if all fields above are present with the exact values stated. Any missing field, wrong value, or a different status code is a FAIL.
**Cleanup**: Restart the backend process (in-memory store resets) or manually reset the test user's plan back to Standard before the next run.

---

### TC-API-02 — Boundary: renewal date is today (0 days remaining)

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | A Standard-plan test user exists with `renew_at` set to today's date |
| **Test data** | `{"email": "<boundary-test-user>"}` |

**Steps**
1. Send `POST /api/billing/upgrade` for the boundary user.
2. Inspect `prorated_charge` in the response.

**Expected result**
- Status `200`.
- `prorated_charge` is exactly `0.00`.
- The plan still becomes `Premium` (the upgrade proceeds even at zero charge).

**Pass/Fail criteria**: PASS only if `prorated_charge` is `0.00` and the plan is updated. A negative charge or an unchanged plan is a FAIL.
**Cleanup**: Reset the boundary test user's plan to Standard.

---

### TC-API-03 — Boundary: full 30 days remaining

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | A Standard-plan test user exists with `renew_at` set to exactly 30 days from today |
| **Test data** | `{"email": "<full-cycle-test-user>"}` |

**Steps**
1. Send `POST /api/billing/upgrade` for the full-cycle user.
2. Inspect `prorated_charge`.

**Expected result**
- Status `200`.
- `prorated_charge` is exactly `20.00` (the full `$40 - $20` price difference).

**Pass/Fail criteria**: PASS only if `prorated_charge` equals `20.00`.
**Cleanup**: Reset the test user's plan to Standard.

---

### TC-API-04 — Already-Premium guard

| Field | Value |
|-------|-------|
| **Traces to** | AC-6 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | A user already on the Premium plan exists (e.g. run TC-API-01 first, or seed one directly) |
| **Test data** | `{"email": "<premium-test-user>"}` |

**Steps**
1. Send `POST /api/billing/upgrade` for the Premium user.
2. Inspect the response.

**Expected result**
- Status `400`.
- Response body is `{"detail": "Already on Premium plan"}`.
- The user's stored plan/price is unchanged by this call (verify via `GET /api/billing?email=<premium-test-user>` before and after — values must be identical).

**Pass/Fail criteria**: PASS only if the status is `400` with the exact detail string, and no mutation occurred. A `200` or any plan change is a FAIL.
**Cleanup**: None needed — no mutation should have occurred.

---

### TC-API-05 — Unknown-user guard

| Field | Value |
|-------|-------|
| **Traces to** | AC-7 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | Backend running locally |
| **Test data** | `{"email": "ghost-not-a-real-user@example.com"}` |

**Steps**
1. Send `POST /api/billing/upgrade` with an email that does not exist in the `users` store.
2. Inspect the response.

**Expected result**
- Status `401`.
- Response body is `{"detail": "Not authenticated"}`.

**Pass/Fail criteria**: PASS only if the status is `401` with the exact detail string. Any other status (especially `200` or `500`) is a FAIL.
**Cleanup**: None needed.

---

### TC-API-06 — Malformed request body is rejected

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 (negative/boundary case for the endpoint's contract) |
| **Type** | API |
| **Priority** | P3 |
| **Preconditions** | Backend running locally |
| **Test data** | `{}` (missing `email` field), and separately `{"email": 12345}` (wrong type) |

**Steps**
1. Send `POST /api/billing/upgrade` with each malformed body in turn.
2. Inspect the response status for each.

**Expected result**
- Status `422 Unprocessable Entity` for both malformed payloads (FastAPI/Pydantic's standard validation-error response).
- No plan mutation occurs for any user.

**Pass/Fail criteria**: PASS only if both malformed payloads return `422` and no data changes. A `200`, `500`, or unhandled exception is a FAIL.
**Cleanup**: None needed.
