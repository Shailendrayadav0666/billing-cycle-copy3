# E2E Test Steps — Story 1.1 Upgrade CTA & Confirmation Modal

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.1's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the frontend dev server port (see `src/frontend/package.json` scripts / `vite.config.js`) |
| Local services that must be up | Frontend dev server; backend not required for this story's scope (client-computed preview only) |
| Test data / accounts to seed | User "tpg@example.com" / password "password" (pre-seeded per the Atlas Deep Dive), on the Standard plan with 15 days remaining in its cycle |

> If the build or local run fails, that is a blocker on the dev team — report it and do not log functional failures against a system that never started.

### TC-E2E-01 — Upgrade CTA is visible on the Billing page

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Logged in as "tpg@example.com" on the Standard plan; viewing `/billing` |
| **Test data** | tpg@example.com / password |

**Steps**
1. Log in and navigate to the Billing page.
2. Observe the top-right area next to the "Plan & Billing" heading.

**Expected result**
- An "Upgrade to Premium" button is visible, positioned top-right of the heading.

**Pass/Fail criteria**: Button visible and correctly positioned = PASS; absent or mispositioned = FAIL.
**Cleanup**: None.

---

### TC-E2E-02 — Clicking the CTA opens the confirmation modal with correct copy and amounts

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | On the Billing page, Standard plan, 15 days remaining in a 30-day cycle |
| **Test data** | tpg@example.com |

**Steps**
1. Click "Upgrade to Premium".
2. Read the modal title, body copy, and the two info rows.

**Expected result**
- Modal titled "Upgrade to Premium" opens.
- Body copy reads "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
- "Remaining days" shows "15 days".
- "Charge today" shows "$10.00" (computed as (40-20) x 15/30).

**Pass/Fail criteria**: All four elements match exactly = PASS; any mismatch = FAIL.
**Cleanup**: Close the modal.

---

### TC-E2E-03 — Modal lists exactly the 3 approved benefits, never Dolby Vision

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Confirmation modal open |
| **Test data** | tpg@example.com |

**Steps**
1. With the modal open, read every bullet in the benefits list.
2. Count the bullets.

**Expected result**
- Exactly 3 bullets present: "Stream on 4 devices at once", "Download on 4 devices", "4K + HDR video quality".
- No 4th bullet, and specifically no "Dolby Vision" bullet anywhere in the modal.

**Pass/Fail criteria**: Exactly these 3, no more/fewer = PASS; any addition, omission, or Dolby Vision mention = FAIL.
**Cleanup**: Close the modal.

---

### TC-E2E-04 — Cancel closes the modal with no changes

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | Confirmation modal open |
| **Test data** | tpg@example.com |

**Steps**
1. Click "Cancel".
2. Observe the Billing page.

**Expected result**
- Modal closes.
- "Current plan" still shows "Standard" at "$20/month" — no state changed.

**Pass/Fail criteria**: Plan unchanged and modal closed = PASS; otherwise FAIL.
**Cleanup**: None.

---

### TC-E2E-05 — Confirm button labels the exact amount and is present alongside Cancel

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Confirmation modal open |
| **Test data** | tpg@example.com |

**Steps**
1. With the modal open, read the two buttons.

**Expected result**
- A primary button labeled exactly "Confirm & pay $10.00" is present.
- A secondary "Cancel" button is present alongside it.

**Pass/Fail criteria**: Both buttons present with exact labels = PASS; otherwise FAIL.
**Cleanup**: Close the modal.

---

### TC-E2E-06 — Confirm button disables immediately to block a duplicate submission

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Confirmation modal open |
| **Test data** | tpg@example.com |

**Steps**
1. Click "Confirm & pay $10.00".
2. Immediately (before any response arrives) attempt to click the same button again.

**Expected result**
- The button becomes visually disabled the instant it is first clicked.
- The second click has no effect (no second request is observably triggered — e.g. no second loading indicator/flicker).

**Pass/Fail criteria**: Button disables on first click and a rapid second click has no effect = PASS; otherwise FAIL.
**Cleanup**: Wait for the in-flight request to resolve, then reset state as needed for the next test.
