# Code Review - Story 1.1: Mid-Cycle Subscription Upgrade (Standard -> Premium)

**Date**: 2026-09-11
**Reviewed By**: REVIEWER (aire)
**Review Number**: 1
**Review Mode**: INITIAL_REVIEW
**Review Target**: Story 1.1
**Status**: ✅ APPROVED
**Tracker ID**: — (LOCAL)

## Review Summary
**Components Reviewed**: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`, `src/frontend/vite.config.js`, `tests/unit/backend/*`, `tests/unit/frontend/*`, `tests/behavior/*`, `spec/behavior/story-1.1.feature`
**Stories in Scope**: 1.1 (this epic's only story)
**Tests Reviewed**: Yes (statically; suite not re-run in this phase) — **Coverage**: 100% on changed/new lines, both backend and frontend (backend whole-file 83%, frontend whole-file 85.96% — the gap is entirely pre-existing, untouched code). 38/38 unit tests passing (28 backend + 10 frontend).
**Behaviour Gate (B1/B2/B3)**: 24/24 scenarios passing on every tier, 25/25 ACs exercised. Run natively — `PASS (unverified parity)` — Podman is installed but this machine's network to every container registry tested is verifiably blocked (see `runtime-artifacts/audit.md`); CI's containerised run remains authoritative. Evidence: `reports/behavior-test-evidence/story-1.1/{b1,b2,b3}/`.
**API & Contract Tests**: Applicable — 2/2 endpoints (`GET /api/billing/upgrade-preview`, `POST /api/billing/upgrade`), full 6-item checklist complete for both. See `reports/api-contract-test-evidence/story-1.1/evidence-manifest.md`.
**Static Eval Gate (D1–D7)**: PASS (7/7) — see `reports/eval-evidence/story-1.1/eval-summary.md`. Note: `D2_typecheck`'s raw script output shows a "2 new finding(s)" FAIL on `src/backend`; this is a verified false positive (CRLF-vs-LF baseline/head mismatch from the git-checkout-based baseline capture, confirmed via byte-level diff and a fresh independent `mypy .` run showing only the 2 pre-existing baseline findings) — reported as PASS with the full trace in `runtime-artifacts/audit.md`.
**Security Baseline (SECURITY-01…16, diff-scoped)**: 16/16 checked · 10 compliant · 6 N/A · Findings: 0 🔴 / 0 🟠 (blocking) · 1 🟡 (advisory) · 0 pre-existing-on-touched-lines → report: `reports/code-security-reviews/security-review-2026-09-11.md`
**Eval Scores (informational — NOT gates, NOT findings)**: Architecture 1.00 (ref 0.85) · Security 0.88 (ref 0.85)
**Overall Assessment**: All 25 acceptance criteria and all 15 mapped requirements are Met, verified independently by static unit/API-contract evidence AND by 24 real, passing end-to-end behaviour scenarios (backend via `httpx` against a live server, UI via a real Chromium browser via Playwright). Zero blocking findings. One non-blocking, pre-existing-pattern security advisory is carried forward as a recommended follow-up, not a defect in this story.

## AC & Requirements Verification

### Story 1.1: Mid-Cycle Subscription Upgrade (Standard -> Premium)
| # | AC / Requirement | Verdict | Evidence / Gap |
|---|------------------|---------|----------------|
| AC-1 | Billing page shows the real plan name, not a hardcoded label | ✅ Met | `src/frontend/src/pages/Billing.jsx:240` (`{data.plan_name}`); behaviour scenario `Billing page shows the real plan name...` PASS |
| AC-2 | Plan card shows the real price and Active badge | ✅ Met | `Billing.jsx:270,273`; behaviour scenario PASS |
| AC-3 | Upgrade CTA appears for Standard, absent for Premium | ✅ Met | `Billing.jsx:243-252` (conditional render); 2 behaviour scenarios PASS; `Billing.test.jsx` AC-1..4 |
| AC-4 | Upgrade CTA has stable, automation-friendly text | ✅ Met | `Billing.jsx:247` (`data-testid="billing-upgrade-cta-button"`, exact text "Upgrade to Premium"); behaviour scenario PASS |
| AC-5/AC-6 | Upgrade preview computes the correct prorated charge | ✅ Met | `src/backend/main.py:143-160,254-269`; `test_compute_prorated_charge_worked_example`; behaviour scenario (15 days -> $10.00) PASS |
| AC-7 | Upgrade preview blocked for already-Premium | ✅ Met | `main.py:259-260` (409 `already_premium`); `test_preview_already_premium_returns_409`; behaviour PASS |
| AC-8 | Upgrade preview rejects unknown email | ✅ Met | `main.py:256` (401); `test_preview_unknown_email_returns_401`; behaviour PASS |
| AC-9 | Clicking the CTA opens the modal and loads the preview | ✅ Met | `Billing.jsx:177-187` (`openUpgradeModal`); behaviour PASS |
| AC-10 | Confirmation modal displays every required field verbatim | ✅ Met | `Billing.jsx:108-125,153` — **a real defect was found and fixed here during this review's preparation**: the modal previously rendered `Standard ($20.00/mo)`/`Premium ($40.00/mo)` (decimals) against the AC's literal `Standard ($20/mo)`/`Premium ($40/mo)` (no decimals); fixed (`PLAN_PRICES` constant) and re-verified — behaviour scenario now asserts the exact literal strings and PASSes; `Billing.test.jsx` tightened to match |
| AC-11 | Cancel closes the modal with no side effects | ✅ Met | `Billing.jsx:189-193` (`closeModal`); `test_cancel_closes_the_modal_with_no_side_effects` — no upgrade request observed; `Billing.test.jsx` AC-11 |
| AC-12 | Displayed charge exactly matches the preview API, no client recalculation | ✅ Met | `Billing.jsx:120-122` (`preview.prorated_charge.toFixed(2)`, no arithmetic on the value); behaviour scenario cross-checks DOM against a live re-fetch of the same endpoint, PASS |
| AC-13/AC-14 | Confirming with a valid card flips the plan to Premium | ✅ Met | `main.py:272-296`; `test_upgrade_success_flips_plan_and_updates_quotas`; behaviour PASS (status 200, plan Premium, charge 10.00) |
| AC-15 | Successful upgrade sets Premium-tier quotas | ✅ Met | `main.py:17-41,293` (`PREMIUM_QUOTAS`); behaviour scenario PASS (10000/10/5000 + on-demand notice) |
| AC-16 | Confirming upgrade blocked for already-Premium, no charge attempted | ✅ Met | `main.py:278-279` (guard before `charge_card`); `test_upgrade_already_premium_returns_409_and_does_not_charge_again`; behaviour PASS |
| AC-17 | Confirming upgrade rejects unknown email | ✅ Met | `main.py:276` (401); `test_upgrade_unknown_email_returns_401`; behaviour PASS |
| AC-13/AC-18 | Confirming with a declined card returns a clear error | ✅ Met | `main.py:163-166,283-287`; `test_upgrade_declined_returns_402_with_message`; behaviour PASS (402, `card_declined`, message) |
| AC-19 | Declined card leaves the subscriber's data completely unchanged | ✅ Met | `main.py:282-287` (return before any mutation); `test_upgrade_declined_leaves_state_byte_for_byte_unchanged`; behaviour scenario asserts plan/price/usages byte-for-byte unchanged, PASS |
| AC-20 | Confirm Upgrade calls the upgrade endpoint with the subscriber's email | ✅ Met | `Billing.jsx:198-202`; behaviour scenario captures the real outgoing request and asserts its JSON body, PASS |
| AC-21 | Successful upgrade refreshes the Billing page and hides the CTA | ✅ Met | `Billing.jsx:205-208` (`fetchBilling()` + `setModalOpen(false)`); behaviour PASS |
| AC-22 | Successful upgrade shows the exact amount charged | ✅ Met | `Billing.jsx:209` (`success-banner`, `body.charge.toFixed(2)`); behaviour scenario asserts the exact banner text, PASS |
| AC-23 | Declined payment keeps the modal open | ✅ Met | `Billing.jsx:210-211` (no `setModalOpen(false)` on the 402 branch); behaviour PASS |
| AC-24 | Declined payment shows the inline error message | ✅ Met | `Billing.jsx:128,211`; behaviour scenario asserts the exact literal error text, PASS |
| AC-25 | Declined payment leaves Cancel available and the plan on Standard | ✅ Met | `Billing.jsx:139-146` (Cancel always rendered/enabled); behaviour PASS |

**ACs verified: 25/25 Met | 0 Partially Met | 0 Not Met.**

### Requirements coverage (Story 1.1 `Covers`, from `spec/plans/requirements.md`)
| Requirement | Verdict | Evidence |
|---|---|---|
| REQ-F-01 (dynamic plan badge/CTA) | ✅ Met | AC-1, AC-3 |
| REQ-F-02 (preview endpoint) | ✅ Met | AC-5/6, AC-7, AC-8 |
| REQ-F-03 (confirmation modal) | ✅ Met | AC-9, AC-10 |
| REQ-F-04 (single proration formula) | ✅ Met | `compute_prorated_charge`, also verified by ARCH-02 (J1, score 1.0) |
| REQ-F-05 (upgrade execution, renew_at unchanged) | ✅ Met | AC-13/14, AC-21 |
| REQ-F-06 (decline path, no mutation) | ✅ Met | AC-18, AC-19, also ARCH-03 (J1) |
| REQ-F-07 (dummy gateway `charge_card`) | ✅ Met | `main.py:163-166` |
| REQ-F-08 (Premium quotas on success) | ✅ Met | AC-15 |
| REQ-F-09 (already-Premium guard) | ✅ Met | AC-7, AC-16 |
| REQ-F-10 (unauthenticated guard) | ✅ Met | AC-8, AC-17 |
| REQ-NF-01 (no new production dependency) | ✅ Met | ARCH-05 (J1, score 1.0); `requirements.txt`/`package.json` production deps unchanged |
| REQ-NF-02 (frontend never computes money) | ✅ Met | ARCH-01 (J1, score 1.0); AC-12 |
| REQ-NF-03 (dynamic, not hardcoded, plan display) | ✅ Met | AC-1 |
| REQ-NF-04 (consistent error response shape) | ✅ Met | ARCH-04 (J1, score 1.0) |
| REQ-NF-05 (automation-friendly `data-testid`s) | ✅ Met | AC-4, AC-11 (cancel/confirm testids) |

**Requirements verified: 15/15 Met.**

**Genuine defects found and fixed during this review**: (1) AC-10 display defect (decimals in the modal's current/new-plan rows) — see AC-10 row above; (2) SECURITY-15 gap (unhandled `ValueError` on a malformed `renew_at`) — fixed during Phase 2.5, see `runtime-artifacts/audit.md`. Both are closed, re-verified, and reflected in the evidence above; neither is carried forward as an open issue.

## Issues Found

No issues — all acceptance criteria and requirements verified as Met; diff is clean against SECURITY-01…16.

## Security — Advisory (non-blocking)

**SEC-001** (🟡 Medium, SECURITY-08 — Application-Level Access Control): both new endpoints extend the app's pre-existing, whole-app "email-as-identity, no ownership proof" pattern to a mutating action. Not a new or worse pattern than every other endpoint in this file, and the Epic explicitly forbids auth-flow changes in this story's scope. Full detail: `reports/code-security-reviews/security-review-2026-09-11.md`. **Recommended follow-up**: raise `/raise-defect` for the whole application's authentication/session model — an app-wide initiative, not a Story-1.1-sized fix.

## Issue Summary
| # | ID | Severity | AC/Requirement or SECURITY rule | File | Status |
|---|-----|----------|----------------|------|--------|

**Counts**: Blockers: 0 | High: 0 — of which security: 0 🔴 / 0 🟠 · Advisory (non-blocking): 1 (SEC-001)

## Approval Status
**Decision**: APPROVED
**Reason**: All 25 acceptance criteria and all 15 mapped requirements are Met, with evidence from static unit tests (38/38), API & contract tests (2/2 endpoints, full checklist), and — completed during this review after discovering it had not yet run — 24/24 real, passing behaviour scenarios across all three tiers (B1/B2/B3), covering 25/25 ACs. Static eval gates (D1–D7) are clean (one documented tooling false positive on D2, independently re-verified). The Security Baseline review found zero blocking findings and one non-blocking, pre-existing-pattern advisory. Both blocking judge gates clear their minimums (J1 1.00 ≥ 0.85, J2 0.88 ≥ 0.85). Two genuine defects surfaced during this review (a modal display bug against AC-10, and a missing fail-closed error handler against SECURITY-15) were fixed and re-verified in the same pass, not carried forward as open issues.
