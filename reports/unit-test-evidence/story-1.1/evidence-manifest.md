# Evidence Manifest — Unit Tests + Coverage — story-1.1

| Field | Value |
|---|---|
| Work unit | Story 1.1 — Premium upgrade dialog on the Billing page |
| Branch / head | story/1.1-premium-upgrade-dialog-on-the-billing-page @ ce9c3c2 (uncommitted work-unit changes) · base ce9c3c2 |
| Generated | 2026-09-25T14:32:22Z |
| AIRE version | 1.0 |
| Status | PASS |

## Commands run
| # | Command | Working directory | Exit code |
|---|---|---|---|
| 1 | `npx vitest run --config vitest.config.js --passWithNoTests` (baseline, before any code) | src/frontend | 0 |
| 2 | `npx vitest run --config vitest.config.js --coverage --coverage.reportsDirectory=../../reports/unit-test-evidence/story-1.1/coverage --reporter=verbose` | src/frontend | 0 |
| 3 | `python changed_lines_cov.py story-1.1 ce9c3c2 reports/unit-test-evidence/story-1.1/coverage/lcov.info src/frontend 90 …/changed-lines-coverage.json` (git diff --unified=0 against ce9c3c2 ∩ lcov DA/BRDA) | repo root | 0 |
| 4 | `npx vitest run --config vitest.config.js --reporter=verbose` (full regression) | src/frontend | 0 |
| 5 | placement check on `git diff --cached --name-only --diff-filter=ACMR ce9c3c2` | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| Node | 22.14.0 |
| Vitest | 5.0.2 |
| @vitest/coverage-v8 | 5.0.2 |
| @testing-library/react | 16.3.3 |
| jsdom | 29.1.1 |

## Result
| Item | Value |
|---|---|
| Tests passed | 18/18 (2 files: UpgradeDialog.test.jsx 9, Billing.test.jsx 9) |
| Changed executable lines covered | 16/16 (100.0%) — UpgradeDialog.jsx 11/11, Billing.jsx 5/5 |
| Changed branches covered | 8/8 (100.0%) — UpgradeDialog.jsx 4/4, Billing.jsx 4/4 |
| Threshold | unitTestCoverageMin 90.0% |
| Whole-file coverage (transparency, not the gate metric) | 37.36% lines, 30.76% branches (App.jsx, main.jsx, AuthContext.jsx, Login.jsx untested and untouched) |
| Baseline pass/fail | 0 / 0 (no tests existed) |
| Post-change pass/fail | 18 / 0 |
| New failures | 0 |
| Test placement verdict | PASS — 0 violations (SH-LOOP-12 attempt 1: scan re-scoped from "diff + every untracked file" to the staged change set; no file moved) |

## Artifacts
| File | What it is |
|---|---|
| baseline-regression.log | whole-repo suite before any change |
| unit-test-run.log | raw output of the final passing coverage run |
| coverage/lcov.info, coverage/coverage-final.json, coverage/coverage-summary.json, coverage/lcov-report/ | v8 coverage reports from the same run |
| coverage/changed-lines-coverage.json | the gate metric |
| full-regression.log | whole-repo suite after the change |
| test-placement-check.log | placement check output |

## Exceptions and notes
Environment: `src/frontend/node_modules` created by `npm install` (none existed; the frontend deliberately ignores `package-lock.json`). Only `src/frontend` is covered by this unit; the backend root has no tests and no changes.
