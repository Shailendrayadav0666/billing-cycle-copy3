# Playwright Automation Summary — Story 1.1 Self-Serve Premium Upgrade — End-to-End Mid-Cycle Upgrade Flow

**Plan**: tests/playwright-specs/story-1.1-self-serve-premium-upgrade.md (auto-approved 2026-09-22, workflow mode)
**Generated tests**: tests/e2e/story-1.1-self-serve-premium-upgrade/
**Generated**: 2026-09-22T15:41:54Z   **AIRE VERSION**: 1.0

## UI Test Cases Automated

| Manual TC | Generated spec | Result |
|-----------|-----------------|--------|
| TC-E2E-01 | tests/e2e/story-1.1-self-serve-premium-upgrade/tc-e2e-01-full-happy-path-upgrade.spec.ts | Passed |

## Manual Cases Excluded (backend/API-only — out of scope for this extension)

| Manual TC | Reason |
|-----------|--------|
| TC-API-01 … TC-API-06 | Backend/API-only manual test cases (covered by tests/api/, not this extension) |
| TC-SEC-01 … TC-SEC-03 | Security manual test cases — no UI-driven scenario, out of scope |
| TC-A11Y-01 … TC-A11Y-03 | Accessibility manual test cases — out of scope for this extension (not UI-flow automation) |

## Consistency Pass (Step 3.5)

Nothing needed fixing — this story has exactly one generated spec (TC-E2E-01), so there is no
cross-spec locator/selector divergence to reconcile.

## Route-Interceptor Pre-Check (Step 3.6)

0 `page.route(` calls found in the generated spec — nothing to fix.

## Healer Outcomes

| Spec | Outcome | Notes |
|------|---------|-------|
| tc-e2e-01-full-happy-path-upgrade.spec.ts | Passed without Healer invocation | First `--headed` run failed on `.plan-badge` = "Premium" (expected "Standard") — root cause was the Generator's own live exploration having already called the real upgrade endpoint against the app's in-memory backend store, not a test or app defect. Fixed by restarting the backend process (resets in-memory state) before the evidence run; re-ran headed, 2/2 passed. See reports/playwright-test-evidence/story-1.1/evidence-manifest.md for detail. |

## AC Coverage (automated UI + remaining manual combined)

11/11 acceptance criteria have >=1 automated OR manual test case (AC-1, AC-2, AC-3, AC-8, AC-9 covered by
the automated TC-E2E-01; all 11 ACs already covered by the approved manual test plan at
spec/test-plans/story-1.1-self-serve-premium-upgrade/).
