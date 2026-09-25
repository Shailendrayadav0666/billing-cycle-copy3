EPIC TICKET: Atlas Epic 4702 "Epic: Self-Serve Premium Upgrade" (Helix solution 951 "Billing-Cycle-Helix-Workshop"; tracker LOCAL)

# User Stories — Self-Serve Premium Upgrade

**AIRE Framework**: v1.0
**Requirements**: `spec/plans/requirements.md` (REQ-F-01..14, REQ-NF-01..08)
**Personas**: `spec/plans/personas.md`
**Approach**: hybrid — feature/rule-based backend stories, journey-based frontend stories; SPIDR-sliced (`spec/spec-generation/story-generation.md`)
**Ordering constraint (user)**: Story 1.1 is purely frontend and visible on its own.

Every AC is written Given / When / Then and maps one-to-one onto a scenario in the story's `.feature` contract later. `Requires` comes from the Dependency Graph stage (`spec/plans/dependency-graph.yml`).

---

## Story 1.1: Premium upgrade dialog on the Billing page

**Persona**: Sam, the Standard subscriber (primary) · Priya, the Premium subscriber (secondary)
**Requires**: none
**Layer**: Frontend only (`Billing.jsx`, `App.css`) — no backend change
**Covers**: REQ-F-08, REQ-F-09, REQ-F-13, REQ-NF-02, REQ-NF-04, REQ-NF-06, REQ-NF-07
**Design reference**: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (title-row CTA, dialog overlay/card, title, explainer line, summary box, benefit list, Cancel button, palette and typography)

> As a Standard subscriber, I want an "Upgrade to Premium" button that opens a clear summary of what Premium gives me, so that I can decide whether to upgrade, and back out if I'm not ready.

**Scope note**: this story ships the dialog **shell**. It shows the plan comparison and Premium benefits, and it can be dismissed. The server-computed charge rows and the "Confirm & pay" button arrive in Story 1.7, so no upgrade can be triggered yet. The one-scenario-class ceiling is deliberately relaxed here (open + dismiss in one story) so the dialog is usable after 1.1 alone. This story also sets up the frontend test tooling: Vitest + React Testing Library, and the Playwright E2E setup.

### Acceptance Criteria
- **AC-1 — CTA for Standard users.** Given a logged-in user whose billing data has `plan_name` "Standard", when the Billing page loads, then a primary "Upgrade to Premium" button appears at the right of the "Plan & Billing" title row, styled as in the design reference.
- **AC-2 — No CTA for Premium users.** Given billing data with `plan_name` "Premium", when the Billing page loads, then no "Upgrade to Premium" button is rendered.
- **AC-3 — Dialog content.** Given a Standard user on the Billing page, when they click "Upgrade to Premium", then a dialog opens over a dark translucent backdrop showing the title "Upgrade to Premium", the line "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.", a summary box with "Current plan — Standard ($20/mo)" and "New plan — Premium ($40/mo)", the benefit list (4K Ultra HD video quality; Stream on 4 devices at once; Download on 6 devices; Dolby Vision (select titles)), and a "Cancel" button. No network request is made by opening it.
- **AC-4 — Dismiss without changes.** Given the dialog is open, when the user clicks "Cancel", presses Escape, or clicks the backdrop, then the dialog closes, the Billing page content is unchanged, and no request is sent to any upgrade endpoint.
- **AC-5 — Accessible dialog.** Given the user opens the dialog from the keyboard, when it appears, then it has `role="dialog"`, `aria-modal="true"` and is labelled by its title, focus moves into the dialog, and on close focus returns to the "Upgrade to Premium" button.

---

## Story 1.2: Prorated charge calculation

**Persona**: Sam, the Standard subscriber
**Requires**: none
**Layer**: Backend only (`main.py`) — pure function, no endpoint
**Covers**: REQ-F-02, REQ-NF-01, REQ-NF-06, REQ-NF-07

> As a Standard subscriber, I want the upgrade charge worked out fairly from the days left in my cycle, so that I never pay for days I've already paid for.

**Scope note**: one pure function (with an injectable "today") used by Stories 1.4 and 1.5. This story sets up the backend test tooling (pytest, FastAPI TestClient, pytest-bdd; test-only dependencies pinned).

### Acceptance Criteria
- **AC-1 — Mid-cycle charge.** Given a renewal date 15 days after today, when the charge is calculated, then days remaining is 15 and the charge is $10.00; and for 29 days it is $19.33.
- **AC-2 — Renewal today or past.** Given a renewal date equal to today or earlier, when the charge is calculated, then days remaining is 0 and the charge is $0.00.
- **AC-3 — Cap at a full cycle.** Given a renewal date 30 or more days after today (for example 30 or 35), when the charge is calculated, then billable days are capped at 30 and the charge is $20.00.
- **AC-4 — Stored date format.** Given `renew_at` in the stored "MMM DD, YYYY" format (for example "Oct 30, 2026"), when it is parsed, then it is read as that calendar date; and with today pinned to Sep 25, 2026 the result is 30 billable days and $20.00.

---

## Story 1.3: Billing page reflects the current plan

**Persona**: Priya, the Premium subscriber (primary) · Sam, the Standard subscriber
**Requires**: 1.1
**Layer**: Frontend only (`Billing.jsx`)
**Covers**: REQ-F-07, REQ-F-14, REQ-NF-06
**Design reference**: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (`{{ planName }}` in the "Current plan:" badge and the "What's included with {{ planName }}" heading)

> As a subscriber, I want the Billing page to name my actual plan, so that what I see matches what I pay for.

### Acceptance Criteria
- **AC-1 — Plan name from data.** Given billing data with `plan_name` "Premium", price "$40/month" and Premium usages, when the Billing page renders, then the "Current plan:" badge reads "Premium", the heading reads "What's included with Premium", and the cards show the Premium values from the data.
- **AC-2 — Standard unchanged.** Given the seeded Standard user logs in, when the Billing page renders, then it shows "Standard", "$20/month", the renewal date and the Standard features exactly as before (no regression to login or the Standard display).

---

## Story 1.4: Upgrade preview endpoint

**Persona**: Sam, the Standard subscriber
**Requires**: 1.2
**Layer**: Backend only (`main.py`)
**Covers**: REQ-F-03, REQ-NF-01, REQ-NF-05, REQ-NF-08

> As a Standard subscriber, I want to see exactly what I'll be charged before I commit, so that there are no surprises.

### Acceptance Criteria
- **AC-1 — Preview for a Standard user.** Given a Standard user who renews 15 days from today, when `GET /api/billing/upgrade-preview?email=<their email>` is called, then it returns 200 with `current_plan` "Standard", `current_price` "$20/month", `new_plan` "Premium", `new_price` "$40/month", `days_remaining` 15, `days_in_cycle` 30 and `prorated_charge` 10.0, computed by the Story 1.2 function.
- **AC-2 — Read-only.** Given any preview call, when it completes, then the user's plan, price and `renew_at` in both stores and in `GET /api/billing` are unchanged.
- **AC-3 — Input validated.** Given a malformed or missing `email` parameter, when the preview is called, then the request is rejected with a 4xx validation error and no stack trace or internal detail is returned.

---

## Story 1.5: Upgrade endpoint switches the user to Premium

**Persona**: Sam, the Standard subscriber
**Requires**: 1.2
**Layer**: Backend only (`main.py`)
**Covers**: REQ-F-01, REQ-F-04, REQ-F-05, REQ-F-06, REQ-NF-01, REQ-NF-05, REQ-NF-08

> As a Standard subscriber, I want my confirmed upgrade to take effect immediately, so that I get Premium features straight away without my renewal date moving.

**Security note**: the user is identified by the email "token", like every existing endpoint. This is the accepted pre-existing risk from Q3 A. Expect the Security Baseline review to raise SECURITY-08 on this endpoint (see REQ-NF-05).

### Acceptance Criteria
- **AC-1 — Upgrade applied.** Given a Standard user, when `POST /api/billing/upgrade` is called with `{ "email": "<their email>" }`, then it returns 200 with `plan_name` "Premium", `price` "$40/month", the unchanged `renew_at`, the Premium `usages` (4K Ultra HD; Can watch on 4 devices at once; Can download on 6 devices) and `included_usage` (Ad-free streaming, Spatial audio, Dolby Vision), plus `prorated_charge` and `days_remaining` computed server-side by the Story 1.2 function.
- **AC-2 — State persisted.** Given a user has just upgraded, when `GET /api/billing` and `GET /api/users/me` are called for them, then both report Premium / "$40/month", and another user's data is unchanged.
- **AC-3 — Renewal date kept.** Given a user whose `renew_at` is "Oct 30, 2026", when they upgrade, then `renew_at` is still "Oct 30, 2026" in `users`, `billing_data` and every response.
- **AC-4 — Only the email is accepted.** Given a request body that also carries fields such as `plan`, `price` or `prorated_charge`, when the upgrade is called, then those fields have no effect: the plan, price and charge are decided by the server alone. Each attempt and its outcome is logged without any password.

---

## Story 1.6: Upgrade requests rejected for ineligible users

**Persona**: Priya, the Premium subscriber
**Requires**: 1.4, 1.5
**Layer**: Backend only (`main.py`)
**Covers**: REQ-F-03, REQ-F-04, REQ-NF-05

> As a Premium subscriber, I want the system to refuse a second upgrade, so that I can never be charged for a plan I already have.

### Acceptance Criteria
- **AC-1 — Already Premium.** Given a user already on Premium, when `GET /api/billing/upgrade-preview` or `POST /api/billing/upgrade` is called for them, then each returns 400 with `{"detail": "Already on Premium plan"}` and their data is unchanged.
- **AC-2 — Unknown user.** Given an email with no account, when either endpoint is called, then each returns 401 with `{"detail": "Not authenticated"}` and neither store changes.
- **AC-3 — Safe unexpected errors.** Given an unexpected server error during either endpoint, when it occurs, then the response is a generic 500 carrying no stack trace, and the error is logged server-side.

---

## Story 1.7: Dialog shows the server-computed prorated charge

**Persona**: Sam, the Standard subscriber
**Requires**: 1.1, 1.4
**Layer**: Frontend only (`Billing.jsx`, `App.css`) — consumes the Story 1.4 endpoint
**Covers**: REQ-F-09, REQ-NF-01, REQ-NF-04
**Design reference**: `spec/context-project/new-references/StreamPlex Billing.html` — grounded ("Remaining days — {n} days" and "Charge today — {prorated}" rows, "Confirm & pay {prorated}" primary button)

> As a Standard subscriber, I want the dialog to show the exact charge for the days left in my cycle, so that I know what I'm paying before I agree.

### Acceptance Criteria
- **AC-1 — Preview requested on open.** Given a Standard user, when they open the upgrade dialog, then the page requests `GET /api/billing/upgrade-preview` for them, and while it loads a loading state is shown in the summary box.
- **AC-2 — Charge shown.** Given the preview returns `days_remaining` 15 and `prorated_charge` 10.0, when it arrives, then the summary box adds "Remaining days — 15 days" and "Charge today — $10.00", and a primary "Confirm & pay $10.00" button appears beside "Cancel".
- **AC-3 — Display only.** Given any preview response, when the dialog renders it, then the displayed days and charge are exactly the values returned by the API (the page does no charge calculation of its own), formatted to 2 decimal places.

---

## Story 1.8: Confirm the upgrade from the dialog

**Persona**: Sam, the Standard subscriber
**Requires**: 1.3, 1.5, 1.7
**Layer**: Frontend only (`Billing.jsx`, `App.css`) — consumes the Story 1.5 endpoint
**Covers**: REQ-F-10, REQ-F-11, REQ-F-14, REQ-NF-03, REQ-NF-04
**Design reference**: `spec/context-project/new-references/StreamPlex Billing.html` — grounded ("Upgraded to Premium" confirmation panel and its text; CTA removed once Premium)

> As a Standard subscriber, I want to confirm the upgrade and see my page switch to Premium right away, so that I know it worked.

**Cross-story seam**: this story owns the full end-to-end journey (log in → open dialog → see charge → confirm → Premium shown) as a Playwright E2E test against the real backend.

### Acceptance Criteria
- **AC-1 — Upgrade sent once.** Given the dialog shows "Confirm & pay $X", when the user clicks it, then exactly one `POST /api/billing/upgrade` is sent with `{ email: <token> }`, and while it is in flight the button is disabled and shows a pending state (a double click sends no second request).
- **AC-2 — Page switches without reload.** Given the upgrade succeeds, when the response arrives, then the dialog closes and, without a page reload, the page shows the "Premium" badge, "$40/month", the unchanged renewal date, "What's included with Premium", the Premium feature cards and perks, and no "Upgrade to Premium" button.
- **AC-3 — Confirmation panel.** Given the upgrade succeeded with `prorated_charge` 10.0 and `days_remaining` 15, when the page updates, then a panel shows "Upgraded to Premium" and "Charged $10.00 for the remaining 15 days of this billing cycle. From <renew_at> you will be billed $40/month." for the rest of the page session.
- **AC-4 — After reload.** Given a user who upgraded, when they reload the Billing page, then it shows the Premium state from the API, with no CTA and no confirmation panel.

---

## Story 1.9: Upgrade failures shown in the dialog

**Persona**: Sam, the Standard subscriber
**Requires**: 1.6, 1.8
**Layer**: Frontend only (`Billing.jsx`, `App.css`)
**Covers**: REQ-F-12, REQ-NF-02
**Design reference**: none covers this component — built from ACs only (the prototype shows no error state)

> As a Standard subscriber, I want to be told clearly when the upgrade didn't go through, so that I can try again without wondering whether I was charged.

### Acceptance Criteria
- **AC-1 — Upgrade rejected.** Given the upgrade request returns 400 `{"detail": "Already on Premium plan"}`, when the response arrives, then the dialog stays open, shows "Already on Premium plan" as an inline error announced to screen readers (`role="alert"`), re-enables "Confirm & pay", and the Billing page data is unchanged.
- **AC-2 — Network or server failure.** Given the upgrade request fails with a 401, a 500, or a network error, when it fails, then the dialog stays open with a generic inline error ("We couldn't complete your upgrade. Please try again."), "Confirm & pay" is re-enabled, and the page data is unchanged.
- **AC-3 — Preview failure.** Given the preview request fails, when the dialog is open, then it shows an inline error in place of the charge rows, and "Confirm & pay" is not available.

---

## Requirements Coverage Matrix

| REQ-ID | Covering stories | Status |
|---|---|---|
| REQ-F-01 Premium plan definition | 1.5 (AC-1) | Covered |
| REQ-F-02 Proration calculation | 1.2 (AC-1..4) | Covered |
| REQ-F-03 Preview endpoint | 1.4 (AC-1..3), 1.6 (AC-1, AC-2) | Covered |
| REQ-F-04 Upgrade endpoint | 1.5 (AC-1, AC-4), 1.6 (AC-1, AC-2) | Covered |
| REQ-F-05 Persisted plan state | 1.5 (AC-2) | Covered |
| REQ-F-06 Renewal date unchanged | 1.5 (AC-3), 1.8 (AC-2) | Covered |
| REQ-F-07 Plan-driven page | 1.3 (AC-1), 1.8 (AC-2) | Covered |
| REQ-F-08 Upgrade CTA | 1.1 (AC-1, AC-2) | Covered |
| REQ-F-09 Confirmation dialog | 1.1 (AC-3), 1.7 (AC-1..3), 1.9 (AC-3) | Covered — static shell in 1.1, charge rows and Confirm in 1.7 |
| REQ-F-10 Confirm without reload | 1.8 (AC-1, AC-2) | Covered |
| REQ-F-11 Confirmation panel | 1.8 (AC-3, AC-4) | Covered |
| REQ-F-12 Failure handling | 1.9 (AC-1..3) | Covered |
| REQ-F-13 Cancel does nothing | 1.1 (AC-4) | Covered |
| REQ-F-14 No regressions | 1.3 (AC-2), 1.8 (E2E journey) | Covered |
| REQ-NF-01 Single source of pricing math | 1.2, 1.4 (AC-1), 1.5 (AC-1), 1.7 (AC-3) | Covered |
| REQ-NF-02 Accessible dialog | 1.1 (AC-4, AC-5), 1.9 (AC-1) | Covered |
| REQ-NF-03 Double-submit protection | 1.8 (AC-1) | Covered |
| REQ-NF-04 Visual fidelity | 1.1, 1.7, 1.8 (design-reference grounding lines) | Covered |
| REQ-NF-05 Security | 1.4 (AC-3), 1.5 (AC-4), 1.6 (AC-1..3) | Covered (accepted pre-existing email-token risk noted on 1.5) |
| REQ-NF-06 Architecture constraints | 1.1, 1.2, 1.3 (no new runtime deps; in-memory store) | Covered |
| REQ-NF-07 Test stack and deterministic time | 1.1 (Vitest/RTL, Playwright setup), 1.2 (pytest/pytest-bdd, injectable today) | Covered |
| REQ-NF-08 Performance | 1.4, 1.5 (in-memory O(1)) | Covered |

**Result**: 22 of 22 REQ-IDs covered.
