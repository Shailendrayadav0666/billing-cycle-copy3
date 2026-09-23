# Accessibility Test Steps — Story 1.4 Upgrade Failure Handling

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

### TC-A11Y-01 — Inline error message is announced to assistive technology

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Screen reader running, upgrade request set up to fail |
| **Test data** | tpg@example.com |

**Steps**
1. With the screen reader running, click "Confirm & pay $10.00" and let the request fail.
2. Listen for whether the error message is announced automatically.

**Expected result**
- The inline error is announced (e.g., via `role="alert"` or an `aria-live` region) without the user needing to manually search the modal for it.

**Pass/Fail criteria**: Error announced automatically = PASS; silent failure requiring manual discovery = FAIL.
**Cleanup**: Restore network/backend.

---

### TC-A11Y-02 — Re-enabled Confirm button is keyboard-operable after a failure

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Keyboard-only navigation, a failed attempt has just occurred |
| **Test data** | tpg@example.com |

**Steps**
1. After the failure, Tab to the "Confirm & pay $10.00" button.
2. Confirm it is focusable and its disabled/enabled state is conveyed (e.g., via `aria-disabled` while pending, removed once re-enabled).
3. Press Enter/Space to retry.

**Expected result**
- The button is keyboard-focusable, its state is correctly conveyed to assistive technology, and activating it retries the request.

**Pass/Fail criteria**: Fully keyboard-operable with correct state conveyance = PASS; otherwise FAIL.
**Cleanup**: Restore network/backend, reset state.
