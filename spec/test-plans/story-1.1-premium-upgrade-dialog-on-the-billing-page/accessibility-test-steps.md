# Accessibility Test Steps — Story 1.1 Premium upgrade dialog on the Billing page

**Purpose**: verify the upgrade dialog is a proper accessible modal: keyboard-operable, correctly announced, with focus moved in and returned on close.
**Scope**: AC-5 (and the keyboard paths of AC-4). REQ-NF-02.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.1 `[STORY]` PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — the local frontend URL is not documented in the design artifacts |
| Local services that must be up | Backend API and frontend, both running locally from the branch above |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` (plan Standard, $20/month, renews Oct 30, 2026 — per Atlas) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

Tools: keyboard only (no mouse) and a screen reader (NVDA on Windows or VoiceOver on macOS); browser developer tools Elements/Accessibility pane.

---

### TC-ACC-01 — Dialog opens from the keyboard and receives focus

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-02 (WCAG 2.1.1 Keyboard, 2.4.3 Focus Order) |
| **Type** | Accessibility |
| **Priority** | P1 |
| **Preconditions** | Logged in as `tpg@example.com` on the Billing page |
| **Test data** | — |

**Steps**
1. Using only Tab, move focus to "Upgrade to Premium".
2. Press Enter. Repeat the test once using Space instead of Enter.
3. Note where keyboard focus is.

**Expected result**
- The button has a visible focus indicator.
- Enter and Space each open the dialog.
- Focus is inside the dialog (on the dialog itself or its first focusable control), not left on the page behind.

**Pass/Fail criteria**: PASS if both keys open the dialog and focus moves into it; FAIL otherwise.
**Cleanup**: Press Escape.

### TC-ACC-02 — Dialog is announced as a labelled modal dialog

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-02 (WCAG 4.1.2 Name, Role, Value) |
| **Type** | Accessibility |
| **Priority** | P1 |
| **Preconditions** | As TC-ACC-01; screen reader running |
| **Test data** | — |

**Steps**
1. Open the dialog from the keyboard.
2. Listen to the screen reader announcement.
3. In the developer tools accessibility pane, inspect the dialog element.

**Expected result**
- The screen reader announces a dialog named "Upgrade to Premium".
- The element has role `dialog`, `aria-modal="true"`, and its accessible name comes from the "Upgrade to Premium" title.

**Pass/Fail criteria**: PASS if role, modal state and name are all correct; FAIL if any is missing.
**Cleanup**: Press Escape.

### TC-ACC-03 — Focus returns to the Upgrade button on close

| Field | Value |
|-------|-------|
| **Traces to** | AC-5, AC-4 / REQ-NF-02 (WCAG 2.4.3 Focus Order) |
| **Type** | Accessibility |
| **Priority** | P1 |
| **Preconditions** | Logged in as `tpg@example.com`; keyboard only |
| **Test data** | — |

**Steps**
1. Open the dialog with the keyboard; press Escape; note the focused element.
2. Open it again; Tab to "Cancel"; press Enter; note the focused element.

**Expected result**
- After each close, focus is on the "Upgrade to Premium" button.

**Pass/Fail criteria**: PASS if focus returns to the button both times; FAIL if focus is lost to the page top or `body`.
**Cleanup**: None.

### TC-ACC-04 — Focus stays within the open dialog (negative)

| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-02 (WCAG 2.4.3 Focus Order) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Dialog open via keyboard |
| **Test data** | — |

**Steps**
1. Press Tab repeatedly (at least 10 times), then Shift+Tab repeatedly.

**Expected result**
- Focus cycles only among the dialog's focusable controls; it never reaches the header, "Logout", or other Billing page controls behind the backdrop.
- TO CONFIRM: the AC does not name an explicit focus trap; if focus escapes to the page, record it as an observation for the BA/dev rather than a FAIL.

**Pass/Fail criteria**: PASS if focus never leaves the dialog while it is open.
**Cleanup**: Press Escape.

### TC-ACC-05 — Dialog is readable at 200% zoom and with sufficient contrast

| Field | Value |
|-------|-------|
| **Traces to** | AC-5, AC-3 / REQ-NF-02, REQ-NF-04 (WCAG 1.4.4 Resize Text, 1.4.3 Contrast) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Dialog open |
| **Test data** | — |

**Steps**
1. Zoom the browser to 200%.
2. Read all dialog text and reach "Cancel".
3. Check text/button contrast with a contrast checker (for example the browser's colour picker).

**Expected result**
- All dialog text is visible without horizontal scrolling of the dialog content; "Cancel" is reachable.
- Body text and button labels meet at least 4.5:1 contrast.

**Pass/Fail criteria**: PASS if both hold; FAIL if content is clipped/unreachable or contrast is below 4.5:1.
**Cleanup**: Reset zoom to 100%; press Escape.
