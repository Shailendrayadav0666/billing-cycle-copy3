EPIC TICKET: Self-Serve Premium Upgrade (local — sourced from Atlas solution document 4039, see spec/plans/epic-brief.md)

# User Stories — Self-Serve Premium Upgrade

> **Generation note**: Per the user's explicit Step 9/10 clarification answer (`story-generation-clarification-questions.md`, Answer B), this story set was first drafted as ONE combined story, then immediately split by the mandatory Step 18.6 Story Granularity & Splitting Check because a single story would newly touch two architectural layers (backend + frontend) with real, independent logic in each — a hard ceiling violation (`planning/user-stories.md` Step 1.5). Split axis: **Interfaces (I)**. See `runtime-artifacts/audit.md` for the full before→after log.

---

## Story 1.1 — Prorated Upgrade Endpoint

**As a** Standard Subscriber (or the frontend acting on their behalf),
**I want** a backend endpoint that previews and applies a mid-cycle upgrade to Premium with correct proration,
**so that** the upgrade can be shown to and confirmed by the user with an accurate, trustworthy charge.

**Covers**: REQ-F-02, REQ-F-03, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-09, REQ-F-10, REQ-NF-02, REQ-NF-04, REQ-NF-05, REQ-NF-06, REQ-NF-07, REQ-NF-08

**Persona**: Standard Subscriber (primary)

**Requires**: none — no prerequisites, immediately startable

### Acceptance Criteria

1. **AC-1 (Preview)** — `POST /api/billing/upgrade?dry_run=true` for an authenticated Standard user returns the calculated prorated charge `(Premium price − Standard price) × (days remaining / 30)` without changing the user's plan. *(REQ-F-02, REQ-F-07)*
2. **AC-2 (Apply)** — `POST /api/billing/upgrade` (no `dry_run`) for the same user applies the upgrade — plan becomes Premium, on-demand balance is left unchanged — and returns the applied charge. *(REQ-F-03, REQ-F-06)*
3. **AC-3 (Idempotency guard)** — Calling either form of the endpoint for a user already on Premium returns `400` with a clear error body; no plan/balance mutation occurs. *(REQ-F-05)*
4. **AC-4 (Authorization & validation)** — The endpoint identifies the caller via the existing auth mechanism and only allows a user to upgrade their own account (object-level authorization); malformed/missing request fields are rejected by request validation before any proration logic runs. *(REQ-F-09, REQ-F-10, REQ-NF-04, REQ-NF-02)*
5. **AC-5 (Tested, single-cycle-length)** — Proration math and all endpoint branches (preview, apply, idempotent-reject, validation-reject) are covered by unit tests meeting `unitTestCoverageMin`; only the 30-day monthly cycle is supported — no annual-billing branch exists. *(REQ-NF-05, REQ-NF-06)*

### Notes
- **Resiliency Baseline (REQ-NF-07)**: extension disabled for this cycle — no additional resiliency design/test obligations apply to this story.
- **Property-Based Testing (REQ-NF-08)**: extension disabled for this cycle — standard example-based unit tests (AC-5) are sufficient; no PBT-specific test generation is required.
- **Integration seam owned here**: this story defines the exact request/response contract (`dry_run` query param, `400` on already-Premium, applied-charge shape) that Story 1.2's frontend calls against — Story 1.2 does not redefine it.

---

## Story 1.2 — Upgrade to Premium UI Flow

**As a** Standard Subscriber,
**I want** to see an upgrade option on the Billing page, review the prorated cost, and confirm in place,
**so that** I can move to Premium myself in under a minute, without contacting support.

**Covers**: REQ-F-01, REQ-F-02, REQ-F-03, REQ-F-04, REQ-F-05, REQ-F-08, REQ-NF-01, REQ-NF-03, REQ-NF-09

**Persona**: Standard Subscriber (primary)

**Requires**: 1.1 — needs Story 1.1's `POST /api/billing/upgrade` code to exist at runtime for its own tests to call the real endpoint (no separate integration story exists to justify dropping this edge under the R3 mock rule)

### Acceptance Criteria

1. **AC-1 (CTA visibility)** — The Billing page (`Billing.jsx`) shows an "Upgrade to Premium" CTA for users on the Standard plan; the CTA is not shown to users already on Premium. *(REQ-F-01)*
2. **AC-2 (Preview panel)** — Clicking the CTA opens an inline confirmation panel (no navigation) that calls Story 1.1's preview endpoint (`dry_run=true`) and displays the returned prorated charge. *(REQ-F-02)*
3. **AC-3 (Confirm & update)** — Confirming the panel calls Story 1.1's apply endpoint (no `dry_run`); on success the plan badge and usage limits update in place, with no full page reload. *(REQ-F-03, REQ-F-04)*
4. **AC-4 (Error states)** — If the apply call returns `400` (already Premium) or any other 4xx/5xx, the panel shows a generic error state — never a silent failure and never a false success state. *(REQ-F-05, REQ-F-08)*
5. **AC-5 (Performance, regression, automation)** — The full click → preview → confirm → updated-UI flow completes in under 60 seconds under normal conditions; the rest of the Billing page's existing behavior (usage views, other flows) shows zero regression; the UI-relevant manual test cases for this flow are automated via `/playwright-implement` once this story's and ve's PRs merge. *(REQ-NF-01, REQ-NF-03, REQ-NF-09)*

---

## Requirements Coverage Matrix

| REQ-ID | Covering Stories | Status |
|---|---|---|
| REQ-F-01 | 1.2 | Full |
| REQ-F-02 | 1.1, 1.2 | Full |
| REQ-F-03 | 1.1, 1.2 | Full |
| REQ-F-04 | 1.2 | Full |
| REQ-F-05 | 1.1, 1.2 | Full |
| REQ-F-06 | 1.1 | Full |
| REQ-F-07 | 1.1 | Full |
| REQ-F-08 | 1.2 | Full |
| REQ-F-09 | 1.1 | Full |
| REQ-F-10 | 1.1 | Full |
| REQ-NF-01 | 1.2 | Full |
| REQ-NF-02 | 1.1 | Full |
| REQ-NF-03 | 1.2 | Full |
| REQ-NF-04 | 1.1 | Full |
| REQ-NF-05 | 1.1 | Full |
| REQ-NF-06 | 1.1 | Full |
| REQ-NF-07 | 1.1 | Full |
| REQ-NF-08 | 1.1 | Full |
| REQ-NF-09 | 1.2 | Full |

**Coverage: 19/19 REQ-IDs fully covered by story ACs.** Cross-story seams (REQ-F-02/03/05, split across both stories) are explicitly owned: Story 1.1 defines the contract (its AC-1/AC-2/AC-3), Story 1.2 consumes it (its AC-2/AC-3/AC-4) — see Story 1.1's "Integration seam owned here" note.
