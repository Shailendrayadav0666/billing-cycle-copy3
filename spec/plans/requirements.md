# Requirements — Self-Serve Premium Upgrade

## Intent Analysis Summary

- **User Request**: "using aire and helix mcp fetch the epic and start the workflow" — the actual WHAT-to-build comes from the Atlas Epic (`spec/plans/epic-brief.md`): enable Standard-plan users to self-serve upgrade to Premium mid-cycle from the Billing page, with a prorated-charge preview and confirmation.
- **Request Type**: New Feature
- **Scope Estimate**: Multiple Components — frontend (`Billing.jsx`, `App.css`) and backend (`main.py`, one new endpoint)
- **Complexity Estimate**: Moderate — proration math, new endpoint, multiple UI states (loading/success/error), object-level authorization, and a currently zero-test-coverage codebase that this feature must not make worse
- **Depth**: Standard

## Existing-System Context (from Atlas)

Source: `spec/plans/atlas-deep-dive.md` (Atlas via Helix MCP, solution 951, repo Billing-Cycle @ main).

- Full-stack POC: React 19 + Vite frontend, FastAPI backend, **no database** — all state (users, billing, tasks) lives in in-memory Python dicts. Data is lost on restart; single-process only.
- Auth: the frontend's `AuthContext.jsx` uses the user's raw email as the bearer "token" — no JWT, no signature, no expiry. Passwords are stored and compared in plaintext. Both are flagged **Critical** in the deep dive's Top 10 Findings. Per Question 3 (below), fixing this is explicitly OUT OF SCOPE for this epic.
- `backend/main.py` is a 213-line "God Module": data store + Pydantic models + business logic + all 6 route handlers + CORS + static file serving in one file. The new upgrade endpoint adds to this file per the Epic's own "Files to Change" table — no refactor of the module is in scope.
- Zero test coverage anywhere in the codebase (deep dive Testing finding #3, Critical). This directly informs REQ-NF-05 below: this epic must not add more untested business logic (proration math) to a codebase that already has none.
- 6 existing REST endpoints, none of which currently implement authorization beyond "is a token present" — there is no existing object-level-authorization pattern to reuse verbatim; the new endpoint must implement its own ownership check (Q3).

No `## Context Project` artifacts were supplied (existing-knowledge / new-references both declined at Workspace Detection). No `## Design References` were named in any answer.

## Clarifying Questions & Answers

(Full detail: `spec/spec-generation/requirement-verification-questions.md`)

| # | Question | Answer |
|---|---|---|
| Q1 | Proration preview mechanism | **A** — `POST /api/billing/upgrade?dry_run=true` returns the calculated charge without applying the upgrade; the same endpoint without the flag applies it |
| Q2 | On-demand balance on upgrade | **A** — carries over unchanged; upgrade only changes plan tier and its limits |
| Q3 | Security scope for the new endpoint | **A** — new endpoint reuses the existing (email-as-token) auth pattern for consistency with this POC; the pre-existing auth mechanism itself is out of scope for this epic and stays as pre-existing debt (Security Baseline is diff-scoped); the new endpoint still enforces object-level authorization (caller can only upgrade their own account) and input validation |
| Q4 | Annual billing | **A** — fully out of scope; no design accommodation needed this cycle |
| Q5 | Payment-declined handling | **A** — no real decline path; mocked payment always succeeds once confirmed; only genuine application errors (network/5xx, validation/4xx, already-Premium 400) are handled |
| Resiliency Baseline (opt-in) | Apply resiliency baseline? | **No** — skipped for this cycle |
| Property-Based Testing (opt-in) | Enforce PBT rules? | **No** — skipped for this cycle |

## Functional Requirements

| ID | Requirement |
|---|---|
| REQ-F-01 | The Billing page (`Billing.jsx`) displays an "Upgrade to Premium" CTA for users currently on the Standard plan. The CTA is not shown to users already on Premium. |
| REQ-F-02 | Clicking the CTA opens an inline confirmation panel (no page navigation) showing the prorated charge, computed via `POST /api/billing/upgrade?dry_run=true`. |
| REQ-F-03 | Confirming the panel calls `POST /api/billing/upgrade` (no `dry_run` flag), which computes the same proration server-side, applies the upgrade (plan tier change), and returns the applied charge. |
| REQ-F-04 | On a successful upgrade response, the UI updates the plan badge and usage limits in place, without a full page reload. |
| REQ-F-05 | The upgrade endpoint is idempotent: calling it for a user already on Premium returns `400` with a clear error body; the confirmation panel surfaces this as an error state rather than a silent no-op. |
| REQ-F-06 | The user's existing on-demand credit balance is unchanged by the upgrade — it is neither reset nor recalculated as part of this flow (Q2). |
| REQ-F-07 | Proration is calculated as `(Premium monthly price − Standard monthly price) × (days remaining in the current 30-day cycle / 30)`, consistent with the Epic's worked example ($20/month price delta, 15 days remaining → $10.00 prorated charge). |
| REQ-F-08 | Payment is mocked: once confirmed, the upgrade always succeeds — there is no simulated decline path (Q5). The endpoint still returns and the UI still handles: validation errors (4xx) for malformed requests, `400` for the idempotency case (REQ-F-05), and `5xx`/network failures as generic error states. |
| REQ-F-09 | The upgrade endpoint enforces object-level authorization: the authenticated caller may only upgrade their own account. The endpoint reuses the existing email-based auth mechanism to identify the caller (Q3) — no new auth scheme is introduced by this epic. |
| REQ-F-10 | The `UpgradeRequest` Pydantic model and endpoint validate all inputs (type, presence) before any proration or plan-mutation logic runs. |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| REQ-NF-01 | The end-to-end upgrade flow (click CTA → confirm → see updated plan) completes in under 60 seconds under normal conditions (Epic success metric). |
| REQ-NF-02 | API error rate for the upgrade endpoint stays under 1% in normal operation (Epic success metric — a target, not a load-tested SLA for this POC). |
| REQ-NF-03 | Zero functional regression on the existing Billing page's current behavior (viewing billing/usage, existing endpoints) — enforced by the mandatory full regression gate during implementation. |
| REQ-NF-04 | **Security Baseline** (always-mandatory extension) applies to every line this epic's diff touches: input validation (SECURITY-05) and object-level authorization (SECURITY-08) on the new endpoint are in scope and blocking. The pre-existing email-as-token auth mechanism and plaintext password storage (SECURITY-08/SECURITY-12 violations) are explicitly pre-existing debt, out of this epic's diff per Q3, and are NOT blocking findings for this cycle — they are not touched, extended, or relied on more than the existing endpoints already do. |
| REQ-NF-05 | Proration calculation logic and the new endpoint's request/response handling MUST have unit test coverage meeting `unitTestCoverageMin` (`tests/.evals/config.json`, default 90%) on changed files — this is the first tested business logic in a codebase the deep dive found at 0% coverage; it must not repeat that gap. |
| REQ-NF-06 | Annual billing is fully out of scope for this cycle (Q4) — no design accommodation for it is required; the 30-day monthly cycle is the only billing period this epic supports. |
| REQ-NF-07 | **Resiliency Baseline extension: disabled** for this cycle (opted out) — no resiliency-specific design constraints (retry/circuit-breaker/observability patterns from that extension) apply. |
| REQ-NF-08 | **Property-Based Testing extension: disabled** for this cycle (opted out) — no PBT-specific test-generation rules apply; standard example-based unit tests (REQ-NF-05) are sufficient. |
| REQ-NF-09 | **Playwright Test Automation extension: enabled** (always-mandatory) — the UI-relevant manual test cases for this feature (CTA visibility, confirmation panel, success/error states) are automated via `/playwright-implement` once the story's manual test plan is approved. |

## Requirements Traceability

All requirement IDs above are permanent per `common/requirements-traceability.md` Rule 1. Downstream artifacts (user stories' `Covers`, the coverage matrix, code-generation plans, code reviews) reference requirements by these IDs only.
