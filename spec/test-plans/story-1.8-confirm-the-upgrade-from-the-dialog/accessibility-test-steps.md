# Accessibility Test Steps — Story 1.8: Confirm the upgrade from the dialog

**Purpose**: verify a keyboard and screen-reader user can confirm the upgrade, knows it is in progress, and learns that it succeeded.
**Scope**: AC-1, AC-3 of Story 1.8.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.8 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.8"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-A11Y-01 — Upgrade can be confirmed with the keyboard only

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-02 (WCAG 2.1.1 Keyboard) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started; mouse not used |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in using the keyboard.
2. Tab to "Upgrade to Premium", press Enter; wait for the charge.
3. Tab to "Confirm & pay $X" and press Enter (or Space).

**Expected result**
- The upgrade completes and the page shows Premium.
- After the dialog closes, keyboard focus is on a sensible element on the page (not lost to the top of the document or on a removed element). TO CONFIRM: the intended focus target after success — the "Upgrade to Premium" button no longer exists (candidate: the "Upgraded to Premium" panel).

**Pass/Fail criteria**: PASS if the full flow works by keyboard and focus is not lost. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-A11Y-02 — Pending state is announced to screen readers

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 (WCAG 4.1.2 Name, Role, Value) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Backend freshly started; screen reader on; DevTools throttling set to very slow |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the dialog and activate "Confirm & pay $X" with the keyboard.
2. While the request is pending, move focus to the button again.

**Expected result**
- The screen reader reports the button as disabled/unavailable and conveys the pending state (for example "Processing").

**Pass/Fail criteria**: PASS if the disabled/pending state is announced. FAIL if the button is announced as an active button. TO CONFIRM: exact pending wording.
**Cleanup**: Remove throttling; restart the backend.

### TC-A11Y-03 — The success panel is perceivable

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-02 (WCAG 4.1.3 Status Messages, 1.4.3 Contrast) |
| **Type** | Accessibility |
| **Priority** | P3 |
| **Preconditions** | Backend freshly started; screen reader on |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Confirm the upgrade.
2. Listen to announcements as the page updates; then navigate to the panel with the screen reader.
3. Check the panel's text contrast.

**Expected result**
- The "Upgraded to Premium" message is announced or is reachable and read in full, including the charge and days.
- Panel text contrast is at least 4.5:1.

**Pass/Fail criteria**: PASS if the success message is perceivable by a screen-reader user and meets contrast. FAIL otherwise. TO CONFIRM: whether the panel should be announced automatically (status region) — the ACs do not say.
**Cleanup**: Restart the backend.
