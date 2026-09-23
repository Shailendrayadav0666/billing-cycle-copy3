# API Test Steps — Story 1.2 Prorated Upgrade Endpoint

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.2's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.2"` |
| How to build & run it | Follow the project's own build docs. This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the backend's local port (per the Atlas Deep Dive, typically `http://localhost:8000`; confirm against the running instance) |
| Local services that must be up | Backend (Uvicorn) only — no external services |
| Test data / accounts to seed | tpg@example.com / password, Standard plan, 15 days remaining in a 30-day cycle; a second, non-existent email for the negative case |

> If the build or local run fails, that is a blocker on the dev team — report it and do not log functional failures against a system that never started.

### TC-API-01 — Successful upgrade returns the correct prorated charge and new plan state

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com exists on Standard plan, 15 days remaining in a 30-day cycle |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "tpg@example.com"}` |

**Steps**
1. Send the request.
2. Inspect the response status and body.
3. Follow with `GET /api/billing?email=tpg@example.com` to confirm persisted state.

**Expected result**
- Response is a 2xx status.
- Response body reports plan "Premium", price "$40/month", `renew_at` unchanged, and a charge of "$10.00".
- The follow-up GET confirms the same plan/price/renew_at values.

**Pass/Fail criteria**: All values match exactly = PASS; any mismatch or non-2xx = FAIL.
**Cleanup**: Restart the backend (or otherwise reset in-memory state) before the next test that assumes a Standard-plan user.

---

### TC-API-02 — Proration is correct at boundary day counts

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-4 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com exists on Standard plan |
| **Test data** | Repeat `POST /api/billing/upgrade` with the cycle set to 1, 29, and 30 days remaining (reset state between each) |

**Steps**
1. For each day-count in {1, 29, 30}: set up the user's remaining-days state, call the endpoint, record the returned charge.

**Expected result**
- 1 day remaining → $0.67
- 29 days remaining → $19.33
- 30 days remaining → $20.00

**Pass/Fail criteria**: All three values match exactly (2 decimal places) = PASS; any deviation = FAIL.
**Cleanup**: Reset state between each sub-case.

---

### TC-API-03 — Unknown email is rejected with no state change

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | No user exists with email "nobody@example.com" |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "nobody@example.com"}` |

**Steps**
1. Send the request.
2. Inspect the response status.
3. Confirm via `GET /api/users/me?email=nobody@example.com` that no such user was created.

**Expected result**
- Response is a 404-class status.
- No user or billing record exists for that email afterward.

**Pass/Fail criteria**: 404-class response and no record created = PASS; any 2xx, or a record appearing = FAIL.
**Cleanup**: None (no state was created).

---

### TC-API-04 — Already-Premium user cannot be upgraded again (idempotency)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | API |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com has already been upgraded to Premium (run TC-API-01 first) |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "tpg@example.com"}` (second call) |

**Steps**
1. With the user already on Premium, send the upgrade request again.
2. Inspect the response status.
3. Follow with `GET /api/billing?email=tpg@example.com` to confirm no additional charge/state change.

**Expected result**
- Response is a 4xx-class status.
- The user's plan/price/renew_at are unchanged from before this second call — no additional charge applied.

**Pass/Fail criteria**: 4xx-class response and no additional mutation = PASS; a 2xx response or any further state change = FAIL.
**Cleanup**: Reset state for subsequent tests.

---

### TC-API-05 — Existing endpoints are unaffected (regression)

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | tpg@example.com exists on Standard plan (fresh state) |
| **Test data** | `POST /api/auth/login`, `GET /api/users/me`, `GET /api/billing` with existing valid inputs |

**Steps**
1. Call each of the three existing endpoints with the same inputs/credentials used before this story's change.
2. Compare response shape and values against the documented pre-change behavior (Atlas Deep Dive API table).

**Expected result**
- All three endpoints return the same status codes and response shapes as before this story.

**Pass/Fail criteria**: No behavioral difference detected = PASS; any change in status/shape/values = FAIL.
**Cleanup**: None.
