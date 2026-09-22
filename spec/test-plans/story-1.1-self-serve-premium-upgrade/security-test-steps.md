# Security Test Steps — Story 1.1 Self-Serve Premium Upgrade

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/self-serve-premium-upgrade` |
| This story's merged PR | 🔴 TO CONFIRM: [PR URL once Story 1.1's PR merges] |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | Backend: `http://localhost:8000` |
| Local services that must be up | Backend (FastAPI) only |
| Test data / accounts to seed | Two known accounts, e.g. `tpg@example.com` (Standard) and a second test account, so cross-account behavior can be checked without guessing |

> This app's overall authentication model (email-as-identifier, no session/token validation) is a
> **known, pre-existing, deliberately-unremediated risk** (see `spec/plans/atlas-deep-dive.md`
> Security Considerations and `spec/plans/requirements.md` REQ-NF-03). These cases check that the
> **new** endpoint does not make it WORSE than the existing `GET /api/billing` pattern — they are not
> a general security audit of the whole app.

---

### TC-SEC-01 — New endpoint does not widen the existing access pattern

| Field | Value |
|-------|-------|
| **Traces to** | AC-5, AC-7 |
| **Type** | Security |
| **Priority** | P1 (critical path) |
| **Preconditions** | Two known accounts exist: Account A (Standard) and Account B (Standard) |
| **Test data** | Account A's and Account B's emails |

**Steps**
1. Send `POST /api/billing/upgrade` with Account A's email, from a session/browser that has never logged in as Account A (i.e. no cookie, no token — this app has none anyway).
2. Observe whether the call succeeds and what data it returns.
3. Compare this behavior against `GET /api/billing?email=<Account A email>` called the same way.

**Expected result**
- Both calls behave identically in terms of what they require to succeed: knowing the email string is sufficient for both (this is the pre-existing, accepted pattern — not a new finding).
- The upgrade response contains ONLY Account A's own billing data — never Account B's or any other account's data, regardless of what email was passed.
- No mechanism in the new endpoint (e.g. a secondary ID, a header, a cookie) is introduced that could be exploited differently from the existing pattern.

**Pass/Fail criteria**: PASS if the new endpoint's access behavior is exactly as permissive/restrictive as `GET /api/billing` — no worse. FAIL if the upgrade endpoint leaks a different account's data, or introduces some new bypass not present in the existing endpoint.
**Cleanup**: Reset Account A's plan to Standard if it was mutated.

---

### TC-SEC-02 — Error responses do not leak internal detail

| Field | Value |
|-------|-------|
| **Traces to** | AC-6, AC-7, AC-10 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running locally |
| **Test data** | An already-Premium account; an unknown email; a malformed request body (`{}`) |

**Steps**
1. Trigger the already-Premium guard (`POST /api/billing/upgrade` for a Premium user).
2. Trigger the unknown-user guard (`POST /api/billing/upgrade` for a non-existent email).
3. Trigger a malformed-body validation error (`POST /api/billing/upgrade` with `{}`).
4. Inspect each response body in full.

**Expected result**
- All three responses contain only the documented `{"detail": "..."}` shape (or FastAPI's standard validation-error shape for step 3) — no stack trace, no file path, no internal exception class name, no server framework version banner beyond what FastAPI already discloses on every endpoint.
- No response echoes back a password field or any field not part of the documented contract.

**Pass/Fail criteria**: PASS only if every error response is clean of internal detail beyond the documented shape. Any leaked stack trace or internal detail is a FAIL.
**Cleanup**: None needed.

---

### TC-SEC-03 — Response never includes the password field

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | A Standard-plan test account with a known password exists |
| **Test data** | The test account's email |

**Steps**
1. Send `POST /api/billing/upgrade` for the test account.
2. Inspect the full JSON response body for any `password` key or value.

**Expected result**
- The response body contains no `password` field, matching the existing pattern already used by `POST /api/auth/login` and `GET /api/users/me` (which explicitly exclude it).

**Pass/Fail criteria**: PASS only if no password data appears anywhere in the response. Any presence of the password (even partial/masked) is a FAIL.
**Cleanup**: Reset the test account's plan to Standard.
