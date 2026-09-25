# Accessibility Test Steps — Story 1.9: Upgrade failures shown in the dialog

**Purpose**: verify error messages in the dialog are announced to screen-reader users and that the dialog remains keyboard-operable after a failure.
**Scope**: AC-1, AC-2, AC-3 of Story 1.9 (REQ-NF-02: inline errors announced with `role="alert"`).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.9 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.9"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-A11Y-01 — Rejection message is announced as an alert

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-02 (WCAG 4.1.3 Status Messages) |
| **Type** | Accessibility |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; screen reader on; two tabs |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Tab A: open the dialog with the keyboard and wait for "Confirm & pay $X".
2. Tab B: upgrade the account.
3. Tab A: activate "Confirm & pay $X" with the keyboard.
4. Listen, then inspect the error element in DevTools (Elements / Accessibility pane).

**Expected result**
- The screen reader announces "Already on Premium plan" without the user moving focus.
- The error element has `role="alert"` (or an equivalent live region).

**Pass/Fail criteria**: PASS if the message is announced automatically and exposed as an alert. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-A11Y-02 — Generic failure message is announced and the dialog stays operable

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-NF-02 (WCAG 4.1.3, 2.1.1 Keyboard) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started; screen reader on; DevTools request blocking available |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog with the keyboard; wait for the charge.
2. Block `*/api/billing/upgrade` in DevTools.
3. Activate "Confirm & pay $X" with the keyboard.
4. After the announcement, press Tab and Shift+Tab, then press Escape.

**Expected result**
- "We couldn't complete your upgrade. Please try again." is announced automatically.
- Focus stays inside the dialog; "Confirm & pay $X" and "Cancel" are reachable and announced as enabled.
- Escape closes the dialog and returns focus to "Upgrade to Premium".

**Pass/Fail criteria**: PASS if the message is announced and the dialog stays fully keyboard-operable. FAIL otherwise.
**Cleanup**: Remove the block.

### TC-A11Y-03 — Preview error is announced and no inactive control traps the user

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-02 (WCAG 4.1.3, 2.4.3 Focus Order) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Backend running; screen reader on; `*/api/billing/upgrade-preview` blocked in DevTools |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog with the keyboard.
2. Listen for the error; press Tab through the dialog.

**Expected result**
- The preview error is announced automatically.
- Tab moves only between available controls (for example "Cancel"); there is no focusable "Confirm & pay" control.

**Pass/Fail criteria**: PASS if the error is announced and no unusable Confirm control is reachable. FAIL otherwise.
**Cleanup**: Remove the block; close the dialog.

### TC-A11Y-04 — Error text contrast and visibility

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-NF-02 (WCAG 1.4.3 Contrast, 1.4.1 Use of Color) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | An error is currently shown in the dialog (from TC-A11Y-01 or TC-A11Y-02) |
| **Test data** | — |

**Steps**
1. Check the error text contrast with a contrast checker.
2. View the dialog in greyscale (DevTools rendering emulation "achromatopsia").

**Expected result**
- Error text contrast is at least 4.5:1.
- The error is recognisable without colour (its text is shown, not only a red border).

**Pass/Fail criteria**: PASS if both hold. FAIL otherwise.
**Cleanup**: Turn off emulation.
