# Unit Test & Coverage Evidence — Story 1.1 Upgrade CTA & Confirmation Modal

**Command run** (from `src/frontend`, the manifest root for this story's diff):
```bash
npx vitest run --coverage --reporter=verbose
```

**Test runner / coverage tool**: vitest 2.1.9 with the `@vitest/coverage-v8` provider (v8, lcov + json-summary + text reporters).

**Tests passing**: 20/20 (3 test files — `UpgradeModal.test.jsx` 6, `Billing.upgrade.test.jsx` 5, `proration.test.js` 9)

**Measured coverage on the story's new/changed code** (from `coverage-summary.json`):

| File | Status | Lines | Branches |
|---|---|---|---|
| `src/frontend/src/components/UpgradeModal.jsx` | new | 100% (50/50) | 100% (3/3) |
| `src/frontend/src/pages/Billing.jsx` | modified | 100% (178/178) | 95.83% (23/24) |
| `src/frontend/src/utils/proration.js` | new | 100% (14/14) | 100% (3/3) |
| **Total** | | **100% (242/242)** | **96.66% (29/30)** |

Both well above `unitTestCoverageMin` (90.0) from `tests/.evals/config.json`.

**Artifacts**:
- `unit-test-run.log` — raw stdout/stderr of the final passing run (verbose reporter)
- `coverage/lcov.info`, `coverage/coverage-summary.json`, `coverage/lcov-report/` — the v8 coverage provider's machine-readable reports

**Note on `Billing.jsx`'s pre-existing code**: the test mock data (`standardBillingData`) includes realistic `usages`/`included_usage` shapes (matching the Atlas Deep Dive's documented `GET /api/billing` response) so the file's pre-existing rendering paths (icon components, usage bars) are also exercised — this was a natural test-completeness choice while already testing this component, not a scope change to the story itself.
