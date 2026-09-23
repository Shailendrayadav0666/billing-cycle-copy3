# Accessibility Test Steps — Story 1.3 Successful Upgrade — Immediate Plan Update

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

### TC-A11Y-01 — Success banner is announced to assistive technology

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Screen reader running, modal open, ready to confirm |
| **Test data** | tpg@example.com |

**Steps**
1. With the screen reader running, click "Confirm & pay $10.00" and let the upgrade complete.
2. Listen for whether the appearance of the success banner is announced.

**Expected result**
- The success banner's content is announced automatically (e.g., via an `aria-live` region or equivalent) without requiring the user to manually navigate to find it.

**Pass/Fail criteria**: Banner announced automatically = PASS; silent appearance requiring manual discovery = FAIL.
**Cleanup**: Reset state.

---

### TC-A11Y-02 — Focus lands somewhere sensible after the modal closes

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Keyboard-only navigation, modal open |
| **Test data** | tpg@example.com |

**Steps**
1. Using only the keyboard, activate "Confirm & pay $10.00" and let the modal close on success.
2. Press Tab and observe where focus is.

**Expected result**
- Focus is not lost (e.g., stuck on a removed/hidden element) — it moves to a sensible location on the page (e.g., the success banner or the page heading).

**Pass/Fail criteria**: Focus recoverable and sensible = PASS; focus lost/stuck = FAIL.
**Cleanup**: Reset state.
