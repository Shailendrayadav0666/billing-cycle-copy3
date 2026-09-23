### Eval Scorecard — Story 1.1 · PASS

| Gate | Result | Threshold | Status |
|---|---|---|---|
| D1 Lint | 0 new findings | ≤ 0 delta | ✅ PASS |
| D2 Type check | plain JS, no type checker configured | — | ⚪ N/A |
| D3 Static security | 0C / 0H / 0M | 0C / 0H / ≤5M | ✅ PASS |
| D4 Dependencies | 0C / 0H (production deps) | 0C / 0H | ✅ PASS |
| D5 Licences | 0 violations | none disallowed | ✅ PASS |
| D6 Complexity | 0 new findings | ≤ 12 | ✅ PASS |
| D7 Secrets | 0 findings | 0 | ✅ PASS |
| Unit coverage | 100% line / 96.66% branch · 20/20 tests | ≥ 90.0% | ✅ PASS |
| Behavioural B1 (this story) | 5/5 scenarios · 38/38 steps · 5/5 ACs · podman | 100% | ✅ PASS |
| Behavioural B2 (cumulative) | no other feature file yet (first work unit) | 100% | ⚪ N/A |
| Behavioural B3 (epic scope) | deferred — Stories 1.2/1.3/1.4 not yet merged | last unit only | ⚪ N/A |
| Test placement | 0 violations | 0 | ✅ PASS |
| API & contract | no API Layer Generation step in this story's plan | all applicable | ⚪ N/A |
| Playwright UI automation | 6/6 scenarios · headed · 4 healed | 100% | ✅ PASS |
| Regression | 0 new failures (27 total tests) | 0 | ✅ PASS |
| J1 Architecture | 1.0 (ARCH-01/02/03 N/A — target Story 1.2's endpoint) | ≥ 0.85 | ✅ PASS |
| J2 Security (OWASP) | 1.0 (SEC-01/02 N/A — target Story 1.2's endpoint) | ≥ 0.85 | ✅ PASS |

**J1 breakdown**: ARCH-04 (No new persistence) 1.0/1.0 · ARCH-05 (Fail-closed frontend state) 1.0/1.0 — renormalized to weight 0.5/0.5 after ARCH-01/02/03 excluded as N/A
**J2 breakdown**: SEC-03 (A07:2025 Auth failures) 1.0/1.0 · SEC-04 (A10:2025 Exceptional conditions) 1.0/1.0 · SEC-05 (A05:2025 Injection) 1.0/1.0 — renormalized to weight 0.4/0.3/0.3 after SEC-01/02 excluded as N/A

**Verdict**: PASS · judge `claude-sonnet-5` · rubric v1.0.0 (from `architecture.md` v1.0.0)
**Self-healing**: SH-LOOP-11 (Playwright) 1/3 · all other loops 0/3
**Bootstrapped**: `src/frontend/eslint.config.js` (eslint, complexity-only preset) · vitest + testing-library toolchain
