# Security Test Plan — Story 1.1 Prorated Upgrade Endpoint

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.1's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep -i "story-1.1\|billing/upgrade"` |
| How to build & run it | Follow the project's own build docs. This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the backend's local port |
| Local services that must be up | None |
| Test data / accounts to seed | Two accounts: the seeded `tpg@example.com`, and a second account you register yourself via `POST /api/auth/register` |

> If the build or local run fails, that is a blocker on the dev team — report it and do not log functional failures against a system that never started.

## TC-SEC-01 — Unauthenticated caller cannot preview or apply an upgrade

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-09, REQ-NF-04 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running locally |
| **Test data** | An email that has never been registered, e.g. `nobody-${timestamp}@example.com` |

**Steps**
1. Call `POST /api/billing/upgrade` with that email, `dry_run=true`.
2. Call it again without `dry_run`.

**Expected result**
- Both calls return `401 Unauthorized` with no billing data disclosed in the response body.

**Pass/Fail criteria**: Both return 401; response body contains no billing/plan details for the unknown identity.
**Cleanup**: None.

## TC-SEC-02 — Object-level authorization: a caller can only ever affect their own account

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-09 (ARCH-02) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Two distinct registered accounts, A and B, both on Standard |
| **Test data** | Account A's and Account B's emails |

**Steps**
1. Send `POST /api/billing/upgrade` with `email` set to Account A's email.
2. Confirm via `GET /api/billing?email=<A>` that ONLY Account A changed to Premium.
3. Confirm via `GET /api/billing?email=<B>` that Account B is still Standard, unaffected.

**Expected result**
- Only the account named in the request body is ever mutated — there is no way to pass one identity and affect another's billing record.

**Pass/Fail criteria**: Account B's plan/balance/limits are byte-identical before and after step 1.
**Cleanup**: Restart the backend or use fresh accounts for further runs.

## TC-SEC-03 — Idempotency guard cannot be bypassed by request variant (dry_run true/false, repeated calls)

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-05 (ARCH-01) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | An account already on Premium |
| **Test data** | That account's email |

**Steps**
1. Send the upgrade request 3 times in a row (no `dry_run`).
2. Send it once more with `dry_run=true`.
3. Check the account's billing record after all 4 calls.

**Expected result**
- All 4 calls return `400`. The billing record shows exactly one Premium upgrade's worth of state — no duplicate charges, no limit re-applied twice.

**Pass/Fail criteria**: All 4 calls rejected with 400; billing record unchanged across all 4 attempts.
**Cleanup**: None.

## TC-SEC-04 — Sensitive data not exposed in error responses or logs

| Field | Value |
|-------|-------|
| **Traces to** | REQ-NF-04 (SECURITY-03, SECURITY-09) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running locally, with server console/log output visible to the tester |
| **Test data** | Any of the error-triggering payloads from TC-API-04/05 |

**Steps**
1. Trigger each error path (401, 400, 422) from the API test plan.
2. Inspect the HTTP response bodies for stack traces, internal file paths, or framework version strings.
3. Inspect the server's console/log output for the same requests.

**Expected result**
- No response body or log line contains a Python stack trace, an internal file path, or the caller's password/token equivalent (their email is expected to appear as the identity, per this app's existing pattern — that is not a new exposure introduced by this endpoint).

**Pass/Fail criteria**: No stack trace or internal path in any response body; nothing beyond the identity already logged by every other existing endpoint.
**Cleanup**: None.
