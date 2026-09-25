# Accessibility Test Steps — Story 1.3 Billing page reflects the current plan

**Purpose**: verify the plan name the page now derives from data is exposed to assistive technology correctly, not only visually.
**Scope**: AC-1, AC-2 (UI text changes). WCAG 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.3 `[STORY]` PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.3"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — the local frontend URL is not documented in the design artifacts |
| Local services that must be up | Backend API and frontend, both running locally from the branch above |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` (plan Standard, $20/month, renews Oct 30, 2026 — per Atlas) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

Tools: screen reader (NVDA on Windows or VoiceOver on macOS).

---

### TC-ACC-01 — Screen reader announces the Standard plan name and heading

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-07 (WCAG 1.3.1, 4.1.2) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Logged in as `tpg@example.com` on the Billing page; screen reader running |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Read the page from the top with the screen reader's reading command.
2. Use heading navigation (H key in NVDA / VO+Cmd+H) to reach the features heading.

**Expected result**
- "Current plan: Standard" is read as one phrase (the badge text is not skipped or read as an unlabelled image).
- "What's included with Standard" is reachable as a heading.

**Pass/Fail criteria**: PASS if both are announced correctly; FAIL if the plan name is silent or the heading is not navigable.
**Cleanup**: Log out.

### TC-ACC-02 — Screen reader announces Premium, never Standard, for a Premium subscriber (negative)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-07 (WCAG 1.3.1, 4.1.2) |
| **Type** | Accessibility |
| **Priority** | P2 |
| **Preconditions** | Premium state available (see `e2e-test-steps.md` TC-E2E-01 — TO CONFIRM before Story 1.5 merges); screen reader running |
| **Test data** | As e2e TC-E2E-01 |

**Steps**
1. Read the Premium Billing page from the top.
2. Navigate to the features heading.

**Expected result**
- "Current plan: Premium" and the heading "What's included with Premium" are announced; the word "Standard" is never announced (including hidden text).

**Pass/Fail criteria**: PASS if only Premium is announced; FAIL if any hidden or visible "Standard" text is read.
**Cleanup**: Restart the backend.
