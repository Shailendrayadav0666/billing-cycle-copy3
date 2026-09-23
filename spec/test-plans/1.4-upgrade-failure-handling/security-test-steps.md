# Security Test Steps — Story 1.4 Upgrade Failure Handling

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.4's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.4"` |
| How to build & run it | Follow the project's own build docs. Requires Story 1.1 merged. |
| Local base URL / port | TO CONFIRM: frontend local port |
| Local services that must be up | Frontend dev server; backend call simulated to fail |
| Test data / accounts to seed | tpg@example.com / password, Standard plan |

### TC-SEC-01 — Failure error message does not leak internal details (SECURITY-15 fail-safe defaults)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Upgrade request set up to fail with a non-2xx server error (not just a network block) |
| **Test data** | tpg@example.com |

**Steps**
1. Trigger a failed upgrade attempt via a simulated server error response.
2. Inspect the inline error message text shown to the user.

**Expected result**
- The message is generic and user-safe (e.g., "Something went wrong — please try again") — no stack trace, internal path, or backend error detail is surfaced in the UI.

**Pass/Fail criteria**: Generic message only = PASS; any internal detail exposed = FAIL.
**Cleanup**: Restore network/backend.

---

### TC-SEC-02 — A failure never leaves the UI in a state inconsistent with the actual backend state (fail closed)

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | Security |
| **Priority** | P1 (critical path) |
| **Preconditions** | Upgrade request set up to fail |
| **Test data** | tpg@example.com |

**Steps**
1. Trigger a failed upgrade attempt.
2. Reload the page (bypassing any transient frontend state).
3. Confirm the plan shown matches the backend's actual (unchanged) state.

**Expected result**
- After reload, the page still shows "Standard" — confirming the frontend never optimistically updated to Premium despite the failure, and the backend never applied a partial mutation.

**Pass/Fail criteria**: Consistent Standard state before and after reload = PASS; any mismatch = FAIL.
**Cleanup**: Restore network/backend.
