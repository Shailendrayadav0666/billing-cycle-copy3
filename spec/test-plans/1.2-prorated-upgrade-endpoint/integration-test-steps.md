# Integration Test Steps — Story 1.2 Prorated Upgrade Endpoint

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.2's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.2"` |
| How to build & run it | Follow the project's own build docs. This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the backend's local port |
| Local services that must be up | Backend only (in-memory store is part of the same process) |
| Test data / accounts to seed | tpg@example.com / password, Standard plan |

### TC-INT-01 — Upgrade mutation is visible to the existing read endpoint (`GET /api/billing`)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | Integration |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com on Standard plan |
| **Test data** | `POST /api/billing/upgrade` then `GET /api/billing?email=tpg@example.com` |

**Steps**
1. Call the upgrade endpoint.
2. Immediately call the existing `GET /api/billing` endpoint for the same user.

**Expected result**
- The GET response reflects the exact same plan/price/renew_at/charge values the upgrade response just returned — the two endpoints agree on the in-memory store's post-mutation state.

**Pass/Fail criteria**: Values agree exactly across both endpoints = PASS; any discrepancy (stale read, partial write) = FAIL.
**Cleanup**: Reset state.

---

### TC-INT-02 — Rejected upgrade attempts leave the store byte-for-byte unchanged

| Field | Value |
|-------|-------|
| **Traces to** | AC-2, AC-3 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | tpg@example.com on Standard plan |
| **Test data** | `GET /api/billing?email=tpg@example.com` before, then an unknown-email upgrade attempt, then an already-Premium upgrade attempt on a second Premium user, then `GET /api/billing` again on the original user |

**Steps**
1. Record tpg@example.com's billing state via GET.
2. Trigger an unknown-email upgrade attempt (should be rejected).
3. Re-fetch tpg@example.com's billing state via GET.

**Expected result**
- tpg@example.com's state is identical before and after the rejected attempt on a different (nonexistent) email — no cross-contamination between requests.

**Pass/Fail criteria**: State identical before/after = PASS; any drift = FAIL.
**Cleanup**: None.
