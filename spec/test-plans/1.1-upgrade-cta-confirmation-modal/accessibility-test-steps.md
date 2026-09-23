# Accessibility Test Steps — Story 1.1 Upgrade CTA & Confirmation Modal

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/EPIC-LOCAL-1-self-serve-premium-upgrade` |
| This story's merged PR | TO CONFIRM: fill in once Story 1.1's PR merges |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs. This plan does not restate them. |
| Local base URL / port | TO CONFIRM: the frontend dev server port |
| Local services that must be up | Frontend dev server only |
| Test data / accounts to seed | tpg@example.com / password, Standard plan |

### TC-A11Y-01 — Keyboard-only access to the CTA and modal

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2, AC-4 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | On the Billing page, mouse disconnected/unused |
| **Test data** | tpg@example.com |

**Steps**
1. Using only Tab/Shift+Tab, navigate to the "Upgrade to Premium" button.
2. Press Enter/Space to activate it.
3. Once the modal opens, Tab through its focusable elements (Confirm, Cancel).
4. Press Escape (if supported) or Tab to Cancel and activate it.

**Expected result**
- The CTA is reachable and clearly focus-visible via keyboard alone.
- Focus moves into the modal when it opens (not left behind on the page).
- Both modal buttons are reachable and activatable via keyboard.

**Pass/Fail criteria**: Full keyboard operability with visible focus = PASS; any unreachable/invisible-focus control = FAIL.
**Cleanup**: Close the modal.

---

### TC-A11Y-02 — Modal is announced to assistive technology and traps focus

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Screen reader enabled (e.g. NVDA/VoiceOver), on the Billing page |
| **Test data** | tpg@example.com |

**Steps**
1. Activate "Upgrade to Premium" with the screen reader running.
2. Listen for the modal's title and content being announced.
3. Tab forward past the last focusable element inside the modal.

**Expected result**
- The modal's title ("Upgrade to Premium") is announced when it opens.
- Focus stays within the modal (does not leak back to page content behind it) until closed.

**Pass/Fail criteria**: Title announced and focus trapped = PASS; silent modal or focus escaping = FAIL.
**Cleanup**: Close the modal.

---

### TC-A11Y-03 — Sufficient color contrast on new elements

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-3, AC-4 |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | On the Billing page, modal open |
| **Test data** | tpg@example.com |

**Steps**
1. Using a contrast-checking tool (browser devtools or an extension), check the "Upgrade to Premium" button text/background, the modal body text, and the benefit bullet text.

**Expected result**
- All checked text/background pairs meet at least WCAG AA (4.5:1 for normal text, 3:1 for large text/UI components).

**Pass/Fail criteria**: All checked pairs meet AA = PASS; any pair below = FAIL (note the exact pair and ratio measured).
**Cleanup**: None.
