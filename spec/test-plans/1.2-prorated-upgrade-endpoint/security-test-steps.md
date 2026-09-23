# Security Test Steps — Story 1.2 Prorated Upgrade Endpoint

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.2's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.2"` |
| How to build & run it | Follow the project's own build docs. This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the backend's local port |
| Local services that must be up | Backend only |
| Test data / accounts to seed | tpg@example.com / password (Standard), a second registered user "other@example.com" (Standard) |

### TC-SEC-01 — Unknown identity cannot trigger a mutation (SECURITY-08 object-level check)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Security |
| **Priority** | P1 (critical path) |
| **Preconditions** | "nobody@example.com" is not a registered user |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "nobody@example.com"}` |

**Steps**
1. Send the request.
2. Confirm no record was created for that email.

**Expected result**
- Request rejected (404-class); no user/billing record created — the endpoint does not silently trust/register an unknown identity.

**Pass/Fail criteria**: Rejected with no record created = PASS; otherwise FAIL.
**Cleanup**: None.

---

### TC-SEC-02 — Idempotent guard prevents a replayed/duplicate upgrade from charging twice

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | Security |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com already upgraded to Premium |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "tpg@example.com"}` sent a second time |

**Steps**
1. Replay the upgrade request for the same, already-Premium user.
2. Inspect the response and the user's stored state.

**Expected result**
- Rejected with a 4xx-class status; no second charge applied — a stale or replayed client request cannot double-charge.

**Pass/Fail criteria**: Rejected with no additional charge = PASS; a second charge applied = FAIL.
**Cleanup**: Reset state.

---

### TC-SEC-03 — The mutation is scoped only to the identified user's own record (IDOR-style check)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 |
| **Type** | Security |
| **Priority** | P1 (critical path) |
| **Preconditions** | Two registered users exist: tpg@example.com (Standard) and other@example.com (Standard) |
| **Test data** | `POST /api/billing/upgrade` with `{"email": "tpg@example.com"}` |

**Steps**
1. Send the upgrade request for tpg@example.com only.
2. Check `GET /api/billing?email=other@example.com` afterward.

**Expected result**
- Only tpg@example.com's record changes to Premium; other@example.com's record is untouched (still Standard, unchanged price/renew_at).

**Pass/Fail criteria**: Only the targeted user's record changes = PASS; any change to the other user's record = FAIL.
**Cleanup**: Reset state.

---

### TC-SEC-04 — Error responses do not leak internal details (fail-safe defaults)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2, AC-3 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Trigger both the unknown-email and already-Premium error paths |
| **Test data** | Same as TC-API-03 and TC-API-04 |

**Steps**
1. Send both error-triggering requests.
2. Inspect the response bodies for stack traces, file paths, or framework/version details.

**Expected result**
- Error responses contain a generic, user-safe message only — no stack trace, internal path, or framework/version disclosure.

**Pass/Fail criteria**: No internal detail present in either error response = PASS; any leak = FAIL.
**Cleanup**: None.

---

### TC-SEC-05 — Identification pattern matches the documented existing pattern (no new auth mechanism introduced)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | Security |
| **Priority** | P3 |
| **Preconditions** | None beyond a registered user |
| **Test data** | `POST /api/billing/upgrade` with a valid email, with and without any `Authorization` header |

**Steps**
1. Call the endpoint with a valid email and no `Authorization` header.
2. Confirm the request is identified purely by the `email` field, consistent with `GET /api/billing`'s existing pattern.

**Expected result**
- Behavior matches the documented, approved decision (Requirements Analysis Question 1): identification by `email` alone, no new token/header mechanism introduced. TO CONFIRM with the dev/BA if any additional header is unexpectedly required — that would be a deviation from the approved design.

**Pass/Fail criteria**: Matches the documented email-only pattern = PASS; unexplained new requirement = FAIL (raise as a finding, not a defect, since it may indicate a legitimate change of approach).
**Cleanup**: None.
