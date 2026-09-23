# E2E Test Steps — Story 1.3 Successful Upgrade — Immediate Plan Update

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.3's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.3"` |
| How to build & run it | Follow the project's own build docs. Requires both Story 1.1 (modal) and Story 1.2 (endpoint) merged into this branch. |
| Local base URL / port | TO CONFIRM: frontend + backend local ports |
| Local services that must be up | Frontend dev server AND backend (this story wires to the real endpoint) |
| Test data / accounts to seed | tpg@example.com / password, Standard plan, 15 days remaining in a 30-day cycle |

### TC-E2E-01 — Plan pill and price update immediately on success, no reload

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Logged in as tpg@example.com, Standard plan, upgrade modal open |
| **Test data** | tpg@example.com |

**Steps**
1. Click "Confirm & pay $10.00" and wait for the request to complete.
2. Observe the modal, the "Current plan" pill, and the plan card, without refreshing the browser.

**Expected result**
- Modal closes.
- "Current plan" pill reads "Premium".
- Plan card reads "$40/month".
- No full-page reload occurred (e.g., other unrelated page state, like scroll position, is preserved).

**Pass/Fail criteria**: All three UI changes occur without a reload = PASS; any missing update or a full reload = FAIL.
**Cleanup**: Reset backend state (restart) before the next test that assumes a fresh Standard-plan user.

---

### TC-E2E-02 — Success banner reports the exact charged amount and future billing date

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Same as TC-E2E-01 |
| **Test data** | tpg@example.com |

**Steps**
1. Complete the upgrade (as in TC-E2E-01).
2. Read the success banner's heading and body text.

**Expected result**
- Banner heading: "Upgraded to Premium".
- Banner body: "Charged $10.00 for the remaining 15 days of this billing cycle. From Oct 30, 2026 you will be billed $40/month." — values must come from the backend's actual response, not be recomputed/guessed by the frontend.

**Pass/Fail criteria**: Exact text with correct values = PASS; any wording or value mismatch = FAIL.
**Cleanup**: Reset state.

---

### TC-E2E-03 — Feature cards update to Premium values with no Dolby Vision element

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Same as TC-E2E-01 |
| **Test data** | tpg@example.com |

**Steps**
1. Complete the upgrade.
2. Read the "What's included" section heading and all three feature cards.

**Expected result**
- Section heading reads "What's included with Premium".
- Video quality card: "4K + HDR".
- "Watch at the same time" card: "Can watch on 4 devices at once".
- "Download on devices" card: "Can download on 4 devices".
- No Dolby Vision card, badge, or text appears anywhere on the page.

**Pass/Fail criteria**: All three cards show the exact Premium values and no Dolby Vision element exists = PASS; otherwise FAIL.
**Cleanup**: Reset state.

---

### TC-E2E-04 — Upgrade CTA disappears once on Premium

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Same as TC-E2E-01 |
| **Test data** | tpg@example.com |

**Steps**
1. Complete the upgrade.
2. Search the entire Billing page for an "Upgrade to Premium" button.

**Expected result**
- No "Upgrade to Premium" button is rendered anywhere on the page.

**Pass/Fail criteria**: CTA absent = PASS; CTA still present or a downgrade option shown instead = FAIL.
**Cleanup**: Reset state.
