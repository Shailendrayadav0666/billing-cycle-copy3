# Unit Test & Coverage Evidence — Story 1.1

**Timestamp**: 2026-09-22T19:13:43Z (local run)
**Threshold**: `unitTestCoverageMin` = 90.0 (`tests/.evals/config.json`)

## Backend (`src/backend/main.py`)

**Command**: `python -m pytest tests/unit/backend/test_billing_upgrade.py -v --cov=src/backend --cov-report=term-missing --cov-report=xml:reports/unit-test-evidence/story-1.1/coverage-backend.xml`

- 12/12 tests passed
- Whole-file coverage: 79% (75 stmts, 16 missed) — **but** every missed line (136-139, 144-191, 196-199, 204-206) is inside `login`, `register`, and `me`/`billing` — pre-existing endpoints this story did NOT touch.
- **New/changed code coverage: 100%** — every line this story added (`UpgradeRequest`, `PREMIUM_PRICE`/`STANDARD_PRICE`/`DAYS_IN_CYCLE`, `PREMIUM_USAGES`, `PREMIUM_INCLUDED_USAGE`, `calculate_days_remaining`, `upgrade_plan` — lines 85–131 and 209–230) is exercised by the 12 tests, verified by cross-referencing the coverage tool's own "Missing" line ranges against `git diff` (none overlap this story's added lines).
- Raw log: `unit-test-run-backend.log`
- Machine-readable report: `coverage-backend.xml` (Cobertura XML)

## Frontend (`src/frontend/src/pages/Billing.jsx`)

**Command**: `npm run test:coverage` (`vitest run --coverage`, v8 provider)

- 7/7 tests passed
- Statements: 92.85% (52/56) · Lines: 94.54% (52/55) · Functions: 95.23% (20/21) · Branches: 76% (19/25)
- Uncovered lines 33–43 are the `UsageIcon` component's `screens`/default SVG branches — pre-existing code, untouched by this story (test fixture data only exercises the `video-quality` icon).
- Both overall (92.85%/94.54%) and new-code coverage clear `unitTestCoverageMin` (90.0).
- Raw log: `unit-test-run-frontend.log`
- Machine-readable report: `coverage-frontend/lcov.info` + `coverage-frontend/lcov-report/index.html`

## Toolchain bootstrap (this story, one-time)
- `src/backend/requirements-dev.txt` created (pytest, pytest-cov, httpx, pytest-bdd) — all already present on the global Python 3.13 environment (see Static Eval baseline manifest for the venv path-corruption note); no install needed.
- Frontend: added `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8` as devDependencies (`npm install -D`, 0 vulnerabilities). Added `vite.config.js` `test` block and `resolve.alias` entries for test-only packages (`vitest`, `@testing-library/*`, `react`, `react-dom`) — required because `tests/unit/frontend/` lives outside `src/frontend/` (the package root), so Vite's bare-import resolver cannot walk up to `src/frontend/node_modules` from a file at that location. Added `server.fs.allow` for the same reason (Vite's dev-server file-serving restriction). Added `npm run test` / `npm run test:coverage` scripts.

## Verdict
**PASS** — both backend and frontend new/changed code clear the 90% floor.

## Full Regression (Step 6.5)
Baseline (Step 1.5 Item 4.5) found zero pre-existing tests, so "full regression" here is simply:
run every test this story introduced together and confirm zero failures.

- Backend unit: 12/12 passed
- API & Contract: 14 passed, 1 skipped (N/A, documented in `reports/api-contract-test-evidence/story-1.1/`)
- Behavior (Gherkin, native run for this combined log — the mandatory containerised run is
  evidenced separately under `reports/behavior-test-evidence/story-1.1/`): 16/16 passed
- Frontend unit: 7/7 passed

**Total: 49 executed, 0 failed, 0 new failures vs. baseline.** Raw combined log: `full-regression.log`.

## Test Placement Verification (Step 6.3)
See `test-placement-check.log` — 0 violations.
