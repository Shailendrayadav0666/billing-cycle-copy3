# Requirements — Self-Serve Premium Upgrade

## Intent Analysis Summary

- **User Request**: "using aire and helix mcp, fetch the epic and deep dive documents and start the workflow" — Epic sourced from Atlas via Helix MCP: *Self-Serve Premium Upgrade* (`spec/plans/epic-brief.md`)
- **Request Type**: New Feature (brownfield addition to an existing FastAPI + React billing POC)
- **Scope Estimate**: Multiple Components — one new backend endpoint (`src/backend/main.py`), one frontend page's UI (`src/frontend/src/pages/Billing.jsx`), styling (`src/frontend/src/App.css`)
- **Complexity Estimate**: Moderate — proration math and a confirmation/success UI flow, but no external payment provider, no database, no auth overhaul; the existing in-memory POC architecture and its known "email-as-token" auth pattern are reused as-is by explicit decision (Question 1)

## Sources Consulted

- **Epic**: `spec/plans/epic-brief.md` (Atlas via Helix MCP, document_id 4702)
- **Atlas Deep Dive**: `spec/plans/atlas-deep-dive.md` (Atlas via Helix MCP, document_id 4699) — existing architecture, auth pattern, data model, flows
- **Context Project artifacts**: none (Existing Knowledge: No)
- **Design references consulted**: `spec/context-project/new-references/StreamPlex Billing.html` — see `## Design References` in `runtime-artifacts/aire-state.md` for the full extraction (Standard-plan state, upgrade confirmation modal, post-upgrade Premium state, exact copy/labels/button text). This prototype is the authoritative source for pixel-level UI/copy; the Epic's plan-comparison table is the authoritative source for plan *data* (prices, quotas).

## Clarifying Questions & Answers

(Full question text in `spec/spec-generation/requirement-verification-questions.md`)

| # | Topic | Answer |
|---|---|---|
| 1 | Upgrade endpoint authorization | **A** — match existing email-as-token pattern; reject unknown email with 404; no new auth mechanism |
| 2 | Defensive validation | **A** — reject (4xx, no state change) if email unknown OR current plan already "Premium" |
| 3 | Double-submit protection | **A** — disable "Confirm & pay" on click until the API call resolves, backed by Q2's idempotency guard |
| 4 | Error-state UI | **A** — keep modal open, show inline error, re-enable Confirm, no plan change |
| 5 | Dolby Vision in UI | **A** — follow the prototype exactly; no dedicated Dolby Vision UI element; backend-only plan-data attribute |
| — | Resiliency Baseline extension | **No** |
| — | Property-Based Testing extension | **No** |

## Functional Requirements

| ID | Requirement |
|---|---|
| REQ-F-01 | A Standard-plan user sees an **"Upgrade to Premium"** CTA button on the Billing page (`src/frontend/src/pages/Billing.jsx`), positioned top-right of the "Plan & Billing" heading, matching the design reference. |
| REQ-F-02 | Clicking the CTA opens a confirmation modal titled "Upgrade to Premium" showing: the Premium price ($40/month), a "Remaining days" value, a "Charge today" prorated amount, and exactly 3 benefit bullets gained ("Stream on 4 devices at once", "Download on 4 devices", "4K + HDR video quality") — no Dolby Vision bullet (REQ-F-11). |
| REQ-F-03 | The prorated charge is computed as `(premium_price - standard_price) × (days_remaining / days_in_cycle)`, rounded to 2 decimal places, and MUST be computed server-side — the frontend only displays the value the backend returns. |
| REQ-F-04 | A new backend endpoint `POST /api/billing/upgrade` accepts the identifying `email` and applies the Standard→Premium upgrade, returning the new plan state (plan name, price, unchanged `renew_at`, updated feature quotas) and the prorated charge applied. |
| REQ-F-05 | On a successful response, the Billing page updates immediately, with no page reload: "Current plan" pill → "Premium"; plan card → "$40/month"; a success banner appears ("Upgraded to Premium" / "Charged $X.XX for the remaining N days of this billing cycle. From \<renew date\> you will be billed $40/month."); the "What's included" section re-labels to "with Premium" and its 3 feature cards update to the Premium values (4K + HDR / 4 devices / 4 devices); the "Upgrade to Premium" CTA is removed entirely. |
| REQ-F-06 | The `renew_at` date does NOT change on upgrade. The next full billing cycle bills at the Premium price ($40/month). |
| REQ-F-07 | The upgrade endpoint identifies the caller the same way existing endpoints do (`email` parameter, matching `GET /api/billing?email=<token>`) and returns 404 if the email does not match a known user record — no new auth mechanism is introduced (Question 1 = A). |
| REQ-F-08 | The upgrade endpoint rejects the request (4xx, no state mutation) if: (a) the email does not match a known user, or (b) the user's current plan is already "Premium" — idempotent no-op protection against a stale or duplicate confirm (Question 2 = A). |
| REQ-F-09 | The frontend disables the "Confirm & pay $X.XX" button immediately on click and keeps it disabled until the API call resolves (success or failure), preventing an accidental double-charge from a double-click (Question 3 = A). |
| REQ-F-10 | If the `POST /api/billing/upgrade` call fails (network error or non-2xx response), the modal stays open, shows an inline error message (e.g., "Something went wrong — please try again"), re-enables the Confirm button, and the displayed plan does not change (Question 4 = A). |
| REQ-F-11 | Dolby Vision is retained as a Premium plan-data attribute in the backend data structure only (per the Epic's comparison table) but is NOT surfaced as its own UI element anywhere (feature cards or modal) — the rendered design reference is authoritative for UI surface, and it never shows Dolby Vision (Question 5 = A). |
| REQ-F-12 | Out of scope (per Epic and unchanged by this requirements pass): Premium→Standard downgrades, refunds/credits, payment verification/decline handling, enterprise/multi-tier billing, external payment processors, persistent storage/database migration. |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| REQ-NF-01 | No external payment provider or SDK is introduced; all pricing/proration logic is implemented in the existing backend (`src/backend/main.py`). |
| REQ-NF-02 | The upgrade is stored via an in-memory update to the existing `users` / `billing_data` Python dicts — consistent with the current POC architecture; no database or persistent store is introduced. |
| REQ-NF-03 | No regression to the existing login, registration, or billing-display (`GET /api/billing`, `GET /api/users/me`) flows. |
| REQ-NF-04 | The new endpoint satisfies the Security Baseline rules that apply to it within the explicitly agreed POC constraints (see Security Compliance below) — it must not introduce a NEW vulnerability class beyond the already-documented, pre-existing email-as-token weakness that Question 1 explicitly chose to keep consistent with. |
| REQ-NF-05 | UI additions (CTA, modal, success banner) reuse the existing frontend's visual language (colors, spacing, card/button styles) — new CSS lives in `src/frontend/src/App.css` alongside existing styles, not a separate stylesheet. |
| REQ-NF-06 | The prorated-charge calculation must be deterministic and testable in isolation (pure function of `standard_price`, `premium_price`, `days_remaining`, `days_in_cycle`) to support unit testing to the project's `unitTestCoverageMin` threshold. |

## Security Compliance (AIRE Security Baseline — always enforced)

Assessed for the scope of this feature (one new mutating REST endpoint, no new data store, no new external integration, no new UI framework):

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 (Encryption at rest/transit) | N/A | No new persistence store introduced; existing in-memory store unchanged |
| SECURITY-03 (App logging) | Compliant (by design decision) | Reuses existing logging posture; no new sensitive data logged (email only, already logged by existing endpoints) |
| SECURITY-05 (Input validation) | Compliant (by design decision) | Email format checked against known-user lookup (404 on miss); no free-text/HTML input on this endpoint |
| SECURITY-08 (App-level access control) | **Compliant by explicit, recorded decision (Question 1/2)** | Object-level check: email must match an existing user (404 otherwise) and the mutation only ever applies to that user's own record; function-level check: idempotent guard against re-upgrading an already-Premium user. Does **not** add real authentication (still email-as-token) — this is a deliberate, user-approved continuation of a documented pre-existing pattern (Atlas Deep Dive), not a new gap introduced by this endpoint. |
| SECURITY-09 (Hardening) | N/A | No new deployment/container surface |
| SECURITY-11 (Secure design — rate limiting, misuse cases) | N/A (POC scope) | No rate limiting on any existing endpoint either; not introduced here, consistent with existing posture |
| SECURITY-15 (Exception handling, fail-safe defaults) | Compliant (by design decision) | Failure path (REQ-F-10) fails closed — no plan change on error, generic user-facing error message, no internal details exposed |
| All other SECURITY rules | N/A | No cryptography, no file uploads, no XML parsing, no CI/CD change, no new dependencies introduced by this feature |

This compliance summary intentionally does not silently "fix" the underlying email-as-token weakness — that is documented, pre-existing debt (Atlas Deep Dive) outside this Epic's stated scope (Epic's "Out of Scope" does not mention auth), and Question 1 recorded the user's explicit choice to keep the new endpoint consistent with it rather than introduce a partial, inconsistent security model. No blocking finding is raised on this specific point because it was surfaced as a question and explicitly decided, not silently assumed.

## Summary

This Epic adds a self-serve Standard→Premium upgrade flow to the existing StreamPlex billing POC: a CTA and confirmation modal on the Billing page, a new `POST /api/billing/upgrade` backend endpoint computing a server-side prorated charge, and an immediate, no-reload UI update on success. The design reference prototype (`StreamPlex Billing.html`) was rendered and interacted with directly to ground every piece of UI copy, layout, and interaction behavior exactly. Five requirements-clarification decisions close the gaps the Epic and prototype left open (endpoint authorization, defensive validation, double-submit protection, error handling, and the Dolby Vision UI discrepancy) — all resolved toward minimal, POC-consistent choices per the user's answers. Both optional extensions (Resiliency Baseline, Property-Based Testing) were declined.
