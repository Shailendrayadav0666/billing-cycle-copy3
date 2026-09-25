# Accessibility Test Steps — Story 1.7: Dialog shows the server-computed prorated charge

**Purpose**: verify the new charge rows, loading state and "Confirm & pay" button are usable with a keyboard and a screen reader.
**Scope**: AC-1, AC-2 of Story 1.7 (the dialog shell's own accessibility is Story 1.1).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.7 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.7"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-A11Y-01 — Charge rows and Confirm button are reachable and announced

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-NF-02 (WCAG 2.1.1 Keyboard, 4.1.2 Name, Role, Value) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | System Under Test running; a screen reader (for example NVDA or VoiceOver) enabled |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in; using only the keyboard, Tab to "Upgrade to Premium" and press Enter.
2. Wait for the charge to load, then Tab through the dialog.
3. Listen to what the screen reader announces for the summary rows and buttons.

**Expected result**
- "Remaining days" and "Charge today" are read with their values (for example "Charge today, $20.00").
- Tab reaches "Confirm & pay $20.00" and "Cancel"; the Confirm button is announced as a button with its full amount.
- Focus stays within the dialog.

**Pass/Fail criteria**: PASS if both rows are announced with values and both buttons are keyboard-reachable with correct names. FAIL otherwise.
**Cleanup**: Press Escape or activate "Cancel".

### TC-A11Y-02 — Loading state is perceivable and Confirm is not operable while loading

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-02 (WCAG 4.1.3 Status Messages) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | As TC-A11Y-01, plus DevTools network throttling set to a very slow profile |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. With throttling on, open the dialog with the keyboard.
2. Before the preview loads, press Tab repeatedly and listen to announcements.
3. Remove throttling.

**Expected result**
- The loading state is visible and is announced by the screen reader (for example "Loading" or equivalent).
- Tab does not reach an operable "Confirm & pay" control while loading.

**Pass/Fail criteria**: PASS if loading is perceivable to a screen-reader user and Confirm cannot be activated before the charge is shown. FAIL otherwise. TO CONFIRM: the exact loading wording is not specified by the ACs.
**Cleanup**: Close the dialog; remove throttling.

### TC-A11Y-03 — Charge text meets contrast and zoom requirements

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-NF-04 (WCAG 1.4.3 Contrast, 1.4.4 Resize Text) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | System Under Test running; a contrast checker (for example DevTools accessibility pane) |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog and let the charge load.
2. Check the contrast of the "Remaining days" / "Charge today" labels and values, and the "Confirm & pay" button text.
3. Zoom the browser to 200%.

**Expected result**
- Text contrast is at least 4.5:1 (3:1 for large bold text).
- At 200% zoom, the rows and both buttons remain visible and usable without horizontal scrolling inside the dialog.

**Pass/Fail criteria**: PASS if contrast and zoom checks hold. FAIL otherwise.
**Cleanup**: Reset zoom; close the dialog.
