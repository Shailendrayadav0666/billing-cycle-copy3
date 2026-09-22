# Accessibility Test Steps — Story 1.1 Self-Serve Premium Upgrade

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/self-serve-premium-upgrade` |
| This story's merged PR | 🔴 TO CONFIRM: [PR URL once Story 1.1's PR merges] |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | Frontend: `http://localhost:5173` |
| Local services that must be up | Backend (port 8000) and frontend (port 5173) |
| Test data / accounts to seed | `tpg@example.com` / `password` (Standard plan) |

---

### TC-A11Y-01 — Keyboard-only operation of the CTA and modal

| Field | Value |
|-------|-------|
| **Traces to** | AC-2, AC-3, AC-4 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Logged in as a Standard-plan user, on the Billing page; mouse disconnected or not used |
| **Test data** | Standard-plan test account |

**Steps**
1. Using only the Tab key, navigate to the "Upgrade to Premium" button.
2. Activate it with Enter or Space.
3. Once the modal is open, Tab through its contents.
4. Reach the "Confirm & pay" and "Cancel" buttons via Tab and activate "Cancel" with Enter/Space.
5. Re-open the modal and press Escape.

**Expected result**
- Step 1: the CTA receives a visible focus indicator and is reachable in a logical tab order.
- Step 2: the modal opens.
- Step 3: focus moves into the modal (focus trap) — Tab does not escape to background page content while the modal is open.
- Step 4: "Cancel" is reachable and activatable via keyboard; the modal closes.
- Step 5: Escape also closes the modal.

**Pass/Fail criteria**: PASS only if every interactive element is operable via keyboard alone with visible focus indicators, and focus is trapped inside the open modal. Any mouse-only control or focus escaping the modal is a FAIL.
**Cleanup**: None needed if Cancel was used (no mutation).

---

### TC-A11Y-02 — Screen reader announces the modal and success banner

| Field | Value |
|-------|-------|
| **Traces to** | AC-3, AC-9 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | A screen reader is available (NVDA, VoiceOver, or a browser accessibility inspector) |
| **Test data** | Standard-plan test account |

**Steps**
1. With the screen reader running, activate the "Upgrade to Premium" button.
2. Listen for the modal's announcement.
3. Complete the upgrade (Confirm).
4. Listen for the success banner's announcement.

**Expected result**
- Step 2: the screen reader announces that a dialog has opened and reads its title ("Upgrade to Premium") — the modal container has an appropriate role (e.g. `role="dialog"`) and accessible name.
- Step 4: the success banner's content is announced to the screen reader (e.g. via `aria-live` or by receiving focus) rather than appearing silently.

**Pass/Fail criteria**: PASS only if both the modal and the success banner are announced. Silent DOM changes with no screen-reader announcement are a FAIL.
**Cleanup**: Reset the test account's plan to Standard.

---

### TC-A11Y-03 — Color contrast of new UI elements

| Field | Value |
|-------|-------|
| **Traces to** | AC-2, AC-3, AC-9 (styling per REQ-NF-06) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Browser with an accessibility/contrast-checking tool (e.g. browser DevTools' contrast checker, or axe DevTools) |
| **Test data** | Standard-plan test account (for the CTA), and a Premium-plan test account (for the success banner, or trigger it via TC-E2E-01) |

**Steps**
1. Inspect the "Upgrade to Premium" button's text/background contrast ratio.
2. Inspect the confirmation modal's text/background contrast ratios (title, body text, stat panel, buttons).
3. Inspect the success banner's text/background contrast ratio.
4. Zoom the page to 200% and confirm all three elements remain legible and usable without horizontal scrolling.

**Expected result**
- All text/background pairs meet WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text/UI components).
- At 200% zoom, the CTA, modal, and banner remain fully legible, with no text clipped or overlapping.

**Pass/Fail criteria**: PASS only if every checked element meets AA contrast and remains usable at 200% zoom. Any element below the AA threshold or broken at zoom is a FAIL.
**Cleanup**: None needed.
