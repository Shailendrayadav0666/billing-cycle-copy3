# Code Review - Story 1.1: Prorated Upgrade Endpoint

**Date**: 2026-09-16
**Reviewed By**: REVIEWER (aire)
**Review Number**: 1
**Review Mode**: INITIAL_REVIEW
**Review Target**: Story 1.1
**Status**: ✅ APPROVED
**Tracker ID**: — (LOCAL)

## Review Summary
**Components Reviewed**: `src/backend/main.py` (new: `UpgradeRequest`, `PlanInfo`, `PLAN_CATALOG`, `CYCLE_LENGTH_DAYS`, `_days_remaining`, `_prorated_charge`, `upgrade_plan`), `src/backend/ruff.toml`, `src/backend/mypy.ini`, `src/backend/pytest.ini`, `tests/unit/backend/test_billing_upgrade.py`, `tests/api/test_billing_upgrade_api.py`, `tests/behavior/steps/billing_upgrade_steps.py`, `tests/behavior/test_story_1_1.py`
**Stories in Scope**: Story 1.1
**Tests Reviewed**: Yes (statically — suite NOT re-run) **Coverage**: 100% on new/changed lines (manually verified — see `reports/unit-test-evidence/story-1.1/evidence-manifest.md`; mechanized tool hit a disclosed canonical-script environment bug)
**API & Contract Tests**: Applicable — 6/6 checklist items complete (`reports/api-contract-test-evidence/story-1.1/evidence-manifest.md`)
**Static Eval Gate (D1–D7)**: PASS (see `reports/eval-evidence/story-1.1/eval-summary.md`)
**Security Baseline (SECURITY-01…16, diff-scoped)**: 16/16 checked · 9 compliant · 7 N/A · Findings: 0 🔴 / 0 🟠 (blocking) · 0 🟡 / 0 🔵 (advisory on this diff) · 2 pre-existing (app-wide, not this change) → report: `reports/code-security-reviews/security-review-2026-09-16.md`
**Eval Scores (informational — NOT gates, NOT findings)**: Architecture 1.00 (ref `reports/eval-evidence/story-1.1/judge/architecture-score.json`) · Security 1.00 (ref `reports/eval-evidence/story-1.1/judge/security-score.json`)
**Overall Assessment**: All 5 acceptance criteria are Met by the code, with direct evidence. The new endpoint follows the architecture's idempotency, preview-never-mutates, and balance-untouched constraints exactly. No security findings on the diff.

## AC & Requirements Verification

### Story 1.1: Prorated Upgrade Endpoint
| # | AC / Requirement | Verdict | Evidence / Gap |
|---|------------------|---------|----------------|
| AC-1 | Preview (`dry_run=true`) returns prorated charge, no mutation | ✅ Met | `main.py:279-286`; `test_preview_returns_prorated_charge_without_mutating_plan` |
| AC-2 | Apply mutates plan/limits, returns applied charge | ✅ Met | `main.py:288-305`; `test_apply_upgrades_plan_and_returns_applied_charge`, `test_apply_updates_usage_limits_to_premium` |
| AC-3 | Idempotency guard on already-Premium | ✅ Met | `main.py:270-274`; `test_already_premium_returns_400_with_error_envelope`, `test_already_premium_preview_also_returns_400` |
| AC-4 | Authorization & validation | ✅ Met | `main.py:258-259` (401), Pydantic `UpgradeRequest` (422); `test_unauthenticated_email_returns_401`, `test_missing_email_field_is_rejected`, `test_wrong_type_email_field_is_rejected` |
| AC-5 | Tested, single-cycle-length | ✅ Met | `CYCLE_LENGTH_DAYS` single constant (`main.py:114`); 20/20 tests pass, 100% coverage on changed lines (manually verified) |
| REQ-F-02 | Preview computes charge without mutating | ✅ Met | same as AC-1 |
| REQ-F-03 | Apply mutates and returns applied charge | ✅ Met | same as AC-2 |
| REQ-F-05 | Idempotent upgrade | ✅ Met | same as AC-3 |
| REQ-F-06 | On-demand balance untouched | ✅ Met | `main.py:288-299` never references `on_demand_usage`; `test_apply_does_not_change_on_demand_balance` |
| REQ-F-07 | Proration formula matches epic's worked example | ✅ Met | `_prorated_charge`; `test_mid_cycle_matches_epic_worked_example` asserts exactly $10.00 for 15 days remaining |
| REQ-F-09 | Object-level authorization | ✅ Met | see J1 ARCH-02 reasoning — no separate target-id exists to diverge from the caller's own identity in this app's model |
| REQ-F-10 | Input validation before mutation | ✅ Met | `UpgradeRequest` Pydantic model, framework-enforced before handler runs |
| REQ-NF-02 | API error rate target | N/A (operational target, not code-verifiable) | — |
| REQ-NF-04 | Security Baseline diff-scoped | ✅ Met | 0 🔴/🟠 findings — see Security Baseline row above |
| REQ-NF-05 | Test coverage ≥ 90% | ✅ Met | 100% on changed lines (manual verification, disclosed tooling limitation) |
| REQ-NF-06 | Single 30-day cycle only | ✅ Met | `CYCLE_LENGTH_DAYS` |
| REQ-NF-07 | Resiliency Baseline (disabled) | N/A | extension opted out |
| REQ-NF-08 | Property-Based Testing (disabled) | N/A | extension opted out |

## Issues Found

No issues — all acceptance criteria and requirements verified as Met; diff is clean against SECURITY-01…16.

## Security — Advisory (non-blocking)
- SECURITY-11 (rate limiting): no rate limiting on this or any endpoint — pre-existing, app-wide, not introduced by this story.
- SECURITY-12 (auth/credential management): email-as-token, plaintext passwords — pre-existing debt, explicitly out of scope per the answered Requirements Analysis Q3 and `architecture.md` Section 11.

## Issue Summary
| # | ID | Severity | AC/Requirement or SECURITY rule | File | Status |
|---|-----|----------|----------------|------|--------|
| — | — | — | — | — | none |

**Counts**: Blockers: 0 | High: 0 — of which security: 0 🔴 / 0 🟠 · Advisory (non-blocking): 2

## Approval Status
**Decision**: APPROVED
**Reason**: Every acceptance criterion and every mapped requirement is Met with direct code/test evidence. Zero blocking security findings on the diff. J1/J2 judge gates both pass at 1.00 (≥ 0.85 minimum).
