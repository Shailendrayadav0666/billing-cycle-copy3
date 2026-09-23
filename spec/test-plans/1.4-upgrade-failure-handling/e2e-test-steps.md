# E2E Test Steps — Story 1.4 Upgrade Failure Handling

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.4's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.4"` |
| How to build & run it | Follow the project's own build docs. Requires Story 1.1 merged. |
| Local base URL / port | TO CONFIRM: frontend local port |
| Local services that must be up | Frontend dev server; the backend call can be simulated to fail (e.g., stop the backend process, or use browser devtools to block/throttle the request to force a network error) |
| Test data / accounts to seed | tpg@example.com / password, Standard plan |

> Simulating failure: use browser devtools (Network tab → Block request URL, or Offline mode) to force the `POST /api/billing/upgrade` call to fail with a network error, or temporarily stop the backend process to produce the same effect.

### TC-E2E-01 — Modal remains open when the upgrade request fails

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Upgrade modal open; the upgrade request is set up to fail (network blocked or backend stopped) |
| **Test data** | tpg@example.com |

**Steps**
1. Click "Confirm & pay $10.00".
2. Wait for the request to fail.
3. Observe whether the modal is still on screen.

**Expected result**
- The modal remains open — it does not close on failure.

**Pass/Fail criteria**: Modal still visible after failure = PASS; modal closed = FAIL.
**Cleanup**: Restore network/backend, close the modal.

---

### TC-E2E-02 — Inline error message is shown inside the modal

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Same as TC-E2E-01 |
| **Test data** | tpg@example.com |

**Steps**
1. Trigger a failed upgrade attempt as above.
2. Read the modal's contents for an error message.

**Expected result**
- An inline error message (e.g., "Something went wrong — please try again") appears inside the modal.

**Pass/Fail criteria**: Inline error message present and legible = PASS; no error shown, or shown outside the modal only = FAIL.
**Cleanup**: Restore network/backend, close the modal.

---

### TC-E2E-03 — Confirm button re-enables after a failure, allowing a successful retry

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | A failed attempt has just occurred (modal open, error shown) |
| **Test data** | tpg@example.com |

**Steps**
1. After the failure, check whether "Confirm & pay $10.00" is clickable again.
2. Restore the network/backend.
3. Click "Confirm & pay $10.00" again.

**Expected result**
- The button is re-enabled after the failure.
- The retry succeeds: modal closes, plan updates to Premium (per Story 1.3's behavior).

**Pass/Fail criteria**: Button re-enabled and retry succeeds = PASS; button stuck disabled, or retry fails for a reason unrelated to the simulated network issue = FAIL.
**Cleanup**: Reset state.

---

### TC-E2E-04 — No plan/price state outside the modal changes after a failure

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Same as TC-E2E-01 |
| **Test data** | tpg@example.com |

**Steps**
1. Trigger a failed upgrade attempt.
2. Without closing the modal, look at the page behind/around it: "Current plan" pill, plan card, "What's included" section.

**Expected result**
- "Current plan" still reads "Standard" at "$20/month".
- "What's included with Standard" section is unchanged (no Premium values leaked in).

**Pass/Fail criteria**: No visible state change outside the modal = PASS; any premature/partial update = FAIL.
**Cleanup**: Restore network/backend, close the modal.
