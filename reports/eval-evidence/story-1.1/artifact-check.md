# Artifact Completeness Check — story-1.1

Result of common/work-unit-artifacts.md Section 5 (SH-LOOP-16 attempt 0).

| File | Required because | Present | Format OK | Consistent | Action taken |
|---|---|---|---|---|---|
| reports/unit-test-evidence/story-1.1/baseline-regression.log | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/unit-test-run.log | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/coverage/lcov.info | E1 machine-readable coverage | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/coverage/coverage-summary.json | E1 coverage summary | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/coverage/changed-lines-coverage.json | E1 gate metric | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/full-regression.log | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/test-placement-check.log | E1 unit changed test files | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/evidence-manifest.md | E1 always | yes | yes | yes | none |
| reports/behavior-test-evidence/story-1.1/b1/behavior-test-run.log | E2 b1 always | yes | yes | yes | none |
| reports/behavior-test-evidence/story-1.1/b1/behavior-test-report.json | E2 b1 always | yes | yes | yes | none |
| reports/behavior-test-evidence/story-1.1/b1/evidence-manifest.md | E2 b1 always | yes | yes | yes | none |
| reports/playwright-test-evidence/story-1.1/playwright-test-run.log | E4 playwright PASS | yes | yes | yes | none |
| reports/playwright-test-evidence/story-1.1/playwright-test-report.json | E4 playwright PASS | yes | yes | yes | none |
| reports/playwright-test-evidence/story-1.1/evidence-manifest.md | E4 playwright PASS | yes | yes | yes | none |
| tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page | E4 generated specs | yes | yes | yes | none |
| spec/playwright-specs/story-1.1-premium-upgrade-dialog-on-the-billing-page.md | E4 planner plan | yes | yes | yes | none |
| spec/test-plans/story-1.1-premium-upgrade-dialog-on-the-billing-page/automation-summary.md | E4 automation summary | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/eval.json | E6 always | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/eval-summary.md | E6 always | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/static/evidence-manifest.md | E6 static | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/static/delta-summary.json | E6 static deltas | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/static/baseline | E6 static baseline | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/judge/architecture-score.json | E6 J1 PASS | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/judge/security-score.json | E6 J2 always | yes | yes | yes | none |
| reports/reviews/story-1.1-code-review-v1.md | E7 always | yes | yes | yes | none |
| reports/code-security-reviews/story-1.1-security-review-v1.md | E8 always | yes | yes | yes | none |
| runtime-artifacts/stories/story-1.1/audit.md | E10 always | yes | yes | yes | none |
| runtime-artifacts/stories/story-1.1/state.md | E10 always | yes | yes | yes | none |

## N/A gates — no evidence folder may exist
| Gate | Reason | Folder | Absent |
|---|---|---|---|
| behaviorB2 | active set empty: every other feature file (story-1.2 to story-1.9) belongs to a Ready for Development unit (behavior-spec.md Section 6.0; run.sh exit 3) | reports/behavior-test-evidence/story-1.1/b2 | yes |
| behaviorB3 | not the last work unit â€” stories 1.2 to 1.9 have no merged PR (none raised) | reports/behavior-test-evidence/story-1.1/b3 | yes |
| apiContract | the code-generation plan has no API Layer Generation step (no endpoint added or changed) | reports/api-contract-test-evidence/story-1.1 | yes |
| playwrightRegression | tests/e2e/ held no spec files at baseline | reports/playwright-test-evidence/story-1.1/regression | yes |

## Consistency
- eval-summary.md has one row per eval.json gate (17), statuses identical; manifest Status lines match eval.json (unitCoverage PASS, behaviorB1 PASS, playwright PASS, static D-gates PASS/N/A).
- Figures agree: 18/18 tests, 100.0% changed lines / 100.0% branches, B1 5/5 scenarios 44/44 steps 5/5 ACs, Playwright 10/10, J1 1.00, J2 1.00.
- Code review v1 names security review v1; its J1/J2 values equal judge/*.json and eval.json.
- static/baseline holds 6 JSON tool outputs for the 6 D-gates that ran.

**Verdict**: CLEAN
