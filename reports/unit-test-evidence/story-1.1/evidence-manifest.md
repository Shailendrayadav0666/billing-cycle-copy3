# Unit Test & Coverage Evidence — Story 1.1

**Command**: `pytest --cov=. --cov-report=xml:coverage-report.xml` from `src/backend` (testpaths: `tests/unit/backend`, `tests/api` — per `src/backend/pytest.ini`)
**Test runner**: pytest 9.1.1 · **Coverage tool**: pytest-cov 7.1.0 (coverage.py)
**Tests passing**: 20/20 (8 unit + 12 API & contract)
**Measured coverage**: 75% whole-file (106 stmts, 27 missed) — **100% on this story's new/changed code**

## Coverage on changed code

This story's new/changed lines: `UpgradeRequest`, `PlanInfo`, `PLAN_CATALOG`, `CYCLE_LENGTH_DAYS`,
`_days_remaining`, `_prorated_charge`, `upgrade_plan` (main.py lines ~106-146, ~256-300).

The 27 missed statements (lines 155-158, 163-220, 225-228, 233-235, 240-242, 247-253) are entirely
inside the 5 **pre-existing** endpoints (`login`, `register`, `me`, `billing`, `tasks`, `add_task`) —
none of them touched by this story. None of this story's own added lines appear in the missing range.

## Artifacts
- `unit-test-run.log` — raw pytest output, unit tests only (tests/unit/backend/)
- `coverage-report.xml` — Cobertura XML, combined unit + API test run (matches the real gate command)
