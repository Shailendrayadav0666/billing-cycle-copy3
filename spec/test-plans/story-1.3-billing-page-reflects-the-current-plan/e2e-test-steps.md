# E2E Test Steps — Story 1.3 Billing page reflects the current plan

**Purpose**: verify the Billing page names the subscriber's actual plan — the "Current plan:" badge, the "What's included with …" heading and the cards follow the billing data rather than a hardcoded "Standard" — and that the Standard display is unchanged.
**Scope**: AC-1, AC-2. REQ-F-07, REQ-F-14.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.3 `[STORY]` PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.3"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — the local frontend and backend URLs are not documented in the design artifacts |
| Local services that must be up | Backend API and frontend, both running locally from the branch above |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` (plan Standard, $20/month, renews Oct 30, 2026 — per Atlas) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-E2E-01 — A Premium subscriber's page names Premium

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-07 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; a subscriber whose billing data has plan "Premium" at "$40/month" with the Premium usages and perks |
| **Test data** | TO CONFIRM — no Premium account exists in the seed data. Once Story 1.5 is merged: log in as `tpg@example.com`, then send `POST <backend-url>/api/billing/upgrade` with `{"email":"tpg@example.com"}` and reload the Billing page. Before 1.5 merges, a dev-provided Premium fixture is needed |

**Steps**
1. Obtain the Premium state (see Test data).
2. Open the Billing page for that subscriber.
3. Read the badge, heading, monthly plan card, feature cards and Plan perks card.

**Expected result**
- "Current plan:" badge reads "Premium".
- Heading reads "What's included with Premium".
- Monthly plan card shows "$40/month"; renewal card shows "Oct 30, 2026".
- Feature cards show "4K Ultra HD", "Can watch on 4 devices at once", "Can download on 6 devices".
- Plan perks card lists "Ad-free streaming", "Spatial audio (select titles)", "Dolby Vision (select titles)".

**Pass/Fail criteria**: PASS if every value matches; FAIL otherwise.
**Cleanup**: Restart the backend to reset the in-memory store.

### TC-E2E-02 — A Premium page never shows the word "Standard" (negative)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-07 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | As TC-E2E-01 |
| **Test data** | As TC-E2E-01 |

**Steps**
1. On the Premium Billing page, use the browser's Find (Ctrl+F / Cmd+F) for "Standard".
2. Search also for "$20/month", "Full HD (1080p)" and "2 devices".

**Expected result**
- None of the searched strings appear anywhere on the page.

**Pass/Fail criteria**: PASS if there are zero matches; FAIL if any hardcoded Standard text remains.
**Cleanup**: Restart the backend.

### TC-E2E-03 — The seeded Standard subscriber's page is unchanged

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-14 |
| **Type** | E2E |
| **Priority** | P1 |
| **Preconditions** | System Under Test running; backend freshly started; browser with no stored session |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Open the local frontend URL and log in as `tpg@example.com` / `password`.
2. Read the Billing page.

**Expected result**
- Login succeeds and the Billing page loads.
- Badge "Standard"; heading "What's included with Standard"; "$20/month"; renewal "Oct 30, 2026".
- Feature cards "Full HD (1080p)", "Can watch on 2 devices at once", "Can download on 2 devices".
- Plan perks "Ad-free streaming" and "Spatial audio (select titles)", each "100% used".

**Pass/Fail criteria**: PASS if the page matches exactly; FAIL on any difference or a login regression.
**Cleanup**: Log out.

### TC-E2E-04 — A newly registered Standard subscriber sees their own plan and date (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-14 |
| **Type** | E2E |
| **Priority** | P2 |
| **Preconditions** | System Under Test running |
| **Test data** | Register name `Reg Test`, email `reg-test@example.com`, password `Passw0rd!` via the login/registration page |

**Steps**
1. Register the new account through the UI.
2. Open the Billing page for it.

**Expected result**
- Registration still works (no regression).
- Badge "Standard"; heading "What's included with Standard"; "$20/month".
- Renewal card shows the registration day + 30 days in "MMM DD, YYYY" form (for example "Oct 25, 2026" when registered on Sep 25, 2026).

**Pass/Fail criteria**: PASS if registration works and the page shows Standard with the correct renewal date; FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-E2E-05 — Logout and log back in keeps the correct plan name (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-F-07 |
| **Type** | E2E |
| **Priority** | P3 |
| **Preconditions** | As TC-E2E-01 (Premium state available for `tpg@example.com`) |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. On the Premium Billing page, click "Logout".
2. Log back in as `tpg@example.com` / `password`.

**Expected result**
- The Billing page again shows badge "Premium" and "What's included with Premium" (the label follows the data, not a cached default).

**Pass/Fail criteria**: PASS if the plan name is still Premium after re-login; FAIL if it reverts to Standard.
**Cleanup**: Restart the backend.
