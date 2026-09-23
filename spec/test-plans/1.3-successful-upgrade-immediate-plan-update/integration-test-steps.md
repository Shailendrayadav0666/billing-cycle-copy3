# Integration Test Steps — Story 1.3 Successful Upgrade — Immediate Plan Update

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.3's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.3"` |
| How to build & run it | Follow the project's own build docs. Requires Story 1.1 + 1.2 merged. |
| Local base URL / port | TO CONFIRM: frontend + backend local ports |
| Local services that must be up | Frontend dev server AND backend |
| Test data / accounts to seed | tpg@example.com / password, Standard plan |

### TC-INT-01 — Frontend displays exactly what the backend returned, not a recomputed guess

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Integration |
| **Priority** | P1 (critical path) |
| **Preconditions** | tpg@example.com, Standard plan, modal open |
| **Test data** | Use browser devtools Network tab to inspect the real `POST /api/billing/upgrade` response |

**Steps**
1. Open devtools Network tab, confirm the upgrade request.
2. Complete the upgrade.
3. Compare the response body's charge/renew_at/plan values against what the success banner and plan card display.

**Expected result**
- The displayed charge, renew date, and plan name in the UI exactly match the values in the backend's response body — no independent client-side recalculation is used for display after a successful response.

**Pass/Fail criteria**: UI values match the response body exactly = PASS; any discrepancy = FAIL.
**Cleanup**: Reset state.

---

### TC-INT-02 — A page reload after a successful upgrade still shows Premium (state persisted, not just in-memory UI state)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | tpg@example.com just completed an upgrade |
| **Test data** | tpg@example.com |

**Steps**
1. Complete the upgrade.
2. Manually reload the browser page (or navigate away and back to `/billing`).

**Expected result**
- The page still shows "Current plan: Premium" and "$40/month" — the backend's in-memory store, not just transient frontend state, reflects the upgrade.

**Pass/Fail criteria**: Premium state persists across reload = PASS; reverts to Standard = FAIL.
**Cleanup**: Reset backend state for subsequent tests.
