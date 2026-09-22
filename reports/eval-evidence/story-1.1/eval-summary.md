# Eval Summary — Story 1.1 (Self-Serve Premium Upgrade)

**Eval framework version**: 1.0.0   **Scope**: changed-files   **Generated**: 2026-09-22T15:52:00Z

| Gate | Status | Detail |
|---|---|---|
| D1 Lint | PASS | backend 9 / frontend 3 findings, all pre-existing (baseline-matched) |
| D2 Types | PASS | backend 0 findings (1 new finding fixed this run); frontend N/A (plain JS/JSX) |
| D3 SAST | PASS | backend 1 finding, pre-existing (baseline-matched); frontend 0 |
| D4 Dependency audit | PASS | 0 vulnerabilities, backend + frontend |
| D5 Licenses | PASS | 0 disallowed, backend + frontend |
| D6 Complexity | PASS | backend 0 over threshold; frontend N/A (no rule configured) |
| D7 Secrets | PASS | 0 leaks, backend + frontend |
| Unit coverage | PASS | backend 100% new/changed lines; frontend 92.85%/94.54% (≥90% min) |
| Behavior B1 | PASS | 16/16 scenarios, containerised |
| Behavior B2 | N/A | no other feature file exists yet (single-story cycle) |
| Behavior B3 | PASS | 16/16 scenarios, containerised (single-unit cycle, ran per Section 6.1) |
| API & Contract | PASS | 14/14 applicable checklist items, 1 N/A (no RBAC in app) |
| Playwright | PASS | 2/2 (seed + TC-E2E-01), headed |
| **J1 Architecture** | **PASS** | **1.0 / 0.85 min** — 6/6 criteria at 1.0, rubricVersion 1.0.0 |
| **J2 Security** | **PASS** | **1.0 / 0.85 min** — 6/6 criteria at 1.0, rubricVersion 1.0.0 |

**Overall**: PASS — all 15 applicable gates green (2 N/A, both explicitly reasoned). Judge model: claude-sonnet-5.

See `reports/eval-evidence/story-1.1/judge/{architecture-score,security-score}.json` for the full
per-criterion breakdown, and `reports/code-security-reviews/security-review-2026-09-22.md` for the
diff-scoped Security Baseline (SECURITY-01…16) pass.
