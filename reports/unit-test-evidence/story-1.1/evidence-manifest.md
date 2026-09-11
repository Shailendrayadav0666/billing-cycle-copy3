# Unit Test & Coverage Evidence — Story 1.1

## Backend

**Command**: `src/backend/venv/Scripts/python.exe -m pytest tests/unit/backend/ -v --cov=src/backend --cov-report=term-missing --cov-report=xml:reports/unit-test-evidence/story-1.1/coverage-report.xml`
**Test runner**: pytest 9.1.1 · **Coverage tool**: pytest-cov 7.1.0 / coverage.py 7.16.0

**Result**: 28/28 tests passing (0 failures).

**Coverage**:
- Whole-file (`src/backend/main.py`): 83% (109 stmts, 18 missed) — the 18 missed lines are all **pre-existing** code this story did not touch: the `login`/`register`/`me`/`billing` 401-branch lines, the `/api/tasks` + `/api/tasks` POST endpoints, and the static-file mount at the bottom of the file.
- **This story's new/changed code (the actual gate scope)**: **100%** covered. New code = lines 11-40 (`PLANS`, `DAYS_IN_CYCLE`, `PREMIUM_QUOTAS`), 138-159 (`UpgradeRequest`, `compute_prorated_charge`, `charge_card`), 247-289 (`GET /api/billing/upgrade-preview`, `POST /api/billing/upgrade`) — none of these line ranges appear in coverage's `Missing` list (`164-167, 173, 236, 243, 294-296, 301-307, 313`).
- Exceeds `unitTestCoverageMin` (90%, `tests/.evals/config.json`).

**Artifacts**:
- `unit-test-run.log` — raw pytest output (this run, 28 passed)
- `coverage-report.xml` — Cobertura XML from `coverage.py`

**Test files**:
- `tests/unit/backend/test_billing_upgrade.py` — business logic (proration formula worked example + boundary clamp, `charge_card` both branches) and endpoint behavior (happy path, guards, decline, no-mutation assertion)
- `tests/unit/backend/test_billing_upgrade_api.py` — API & Contract Testing Gate (see `reports/api-contract-test-evidence/story-1.1/`)

**Note — a real defect found and fixed during this gate**: the first `compute_prorated_charge` implementation diffed `datetime.strptime(renew_at, ...)` (midnight) against `datetime.today()` (current time-of-day), undercounting `days_remaining` by one for any time after midnight and producing $19.33 instead of the epic's worked example of $20.00 for a fresh 30-day cycle. Fixed by comparing `.date()` on both sides. Caught by `test_compute_prorated_charge_worked_example` / `test_compute_prorated_charge_full_cycle` failing on the first run.

**Note — a second fix during the automated Code Review's security pass (SECURITY-15)**: `compute_prorated_charge` had no error handling around `datetime.strptime`; added a `try/except ValueError` that fails closed with a clean 500 instead of letting a malformed date propagate as a raw exception. Covered by `test_compute_prorated_charge_fails_closed_on_malformed_renew_at` (test count: 28 backend, up from 27).

## Frontend

**Command**: `npx vitest run --coverage` (run from `src/frontend/`)
**Test runner / coverage tool**: vitest 5.0.0 + `@vitest/coverage-v8` (V8 native coverage) · `@testing-library/react` + `@testing-library/user-event` · jsdom environment

**Result**: 10/10 tests passing (0 failures).

**Coverage**:
- Whole-file (`src/frontend/src/pages/Billing.jsx`): 85.96% stmts/lines, 81.25% branches, 85% funcs — the uncovered lines (`24-42, 59, 288`) are all **pre-existing** code this story did not change: the `UsageIcon` SVG branches, the `IncludedUsageCard` item map, and the (unchanged, just line-shifted) usage-grid map.
- **This story's new/changed code**: `UpgradeModal` (lines 100-153) and the rewritten `Billing` component's new state/handlers (`fetchBilling`, `openUpgradeModal`, `closeModal`, `confirmUpgrade`, the CTA button, the modal render, the success banner) are **100% covered**, including both network-failure `.catch()` branches and the non-402 error-status branch.
- Exceeds `unitTestCoverageMin` (90%, `tests/.evals/config.json`).

**Artifacts**:
- `frontend-unit-test-run.log` — raw vitest output (this run, 10 passed)
- `frontend-coverage/lcov.info` + `frontend-coverage/lcov-report/` — v8/lcov coverage report

**Test file**: `tests/unit/frontend/Billing.test.jsx` — CTA visibility by plan (AC-1..AC-4), modal open/display/cancel (AC-9..AC-12), confirm success (AC-13/14/20/21/22), confirm decline (AC-13/18/23/24/25), and both network-failure error paths.

## Full Regression vs Baseline (code-generation.md Step 11b)

**Baseline** (captured at the Story Branch checkpoint, Step 1.5 Item 4.5): no test suite existed at all.
**Full regression run** (`full-regression.log`): 28 backend + 10 frontend = **38/38 passing**, exit 0.
**Diff vs baseline**: 37 NEW tests, 0 pre-existing failures (there were none to break) — nothing to fix. Clean.

**Generation-time infra note**: `tests/unit/frontend/` lives at the repo root (outside the Vite root `src/frontend/`), per `common/directory-structure.md`. This requires `server.fs.allow` plus a small `resolve.alias` map in `vite.config.js` so Vite's node_modules resolution (which walks up from the *importing file's* own ancestors, never sideways into `src/frontend/node_modules`) can find the test-only packages — the same class of fix `common/behavior-spec.md` Section 4.1a prescribes for cucumber-js step files via `NODE_PATH` (Vite's resolver doesn't honour `NODE_PATH`, so `resolve.alias` is the equivalent here). Added `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8` as devDependencies (`src/frontend/package.json`) — test-only, not shipped in the production build.
