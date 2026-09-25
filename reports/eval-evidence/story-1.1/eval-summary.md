### Eval Scorecard — Story 1.1 · **PASS**

| Gate | Result | Threshold | Status |
|---|---|---|---|
| D1 Lint | 0 new findings (3 pre-existing, AuthContext.jsx) | ≤ 0 delta | PASS |
| D2 Type check | N/A — plain JavaScript/JSX; no type checker applies | 0 | N/A |
| D3 Static security | 0C / 0H / 0M new (semgrep auto, 200 rules) | 0C / 0H / ≤5M | PASS |
| D4 Dependencies | 0C / 0H | 0C / 0H | PASS |
| D5 Licences | 0 violations (132 packages) | none disallowed | PASS |
| D6 Complexity | 0 new over threshold | ≤ 12 | PASS |
| D7 Secrets | 0 findings (staged diff) | 0 | PASS |
| Unit coverage | 100.0% lines · 100.0% branches (changed) · 18/18 tests | ≥ 90.0% | PASS |
| Behavioural B1 (this story) | 5/5 scenarios (7 runs, 44 steps) · 5/5 ACs · podman | 100.0% | PASS |
| Behavioural B2 (cumulative) | N/A — no other active feature file (1.2–1.9 Ready for Development) | 100% | N/A |
| Behavioural B3 (epic scope) | N/A — not the last story (1.2–1.9 have no merged PR) | last unit only | N/A |
| API & contract | N/A — no API layer in this story | all applicable | N/A |
| Playwright UI automation | 10/10 scenarios · headed · 0 fixme | 100% | PASS |
| Playwright E2E regression | N/A — no specs in tests/e2e/ at baseline | 0 new | N/A |
| Regression | 0 new failures (baseline 0 tests → 18/18) | 0 | PASS |
| J1 Architecture | 1.00 | ≥ 0.85 | PASS |
| J2 Security (OWASP 2025) | 1.00 | ≥ 0.85 | PASS |

**Verdict**: PASS · judge `claude-opus-5-5` · rubric v1.0.0 (from `architecture.md` v1.0.0)
**Self-healing**: SH-LOOP-12 1/3 (test-placement scan re-scoped to the staged change set) · all other loops 0/3
**Bootstrapped**: tests/.evals/lint/oxlint-complexity.json, .gitleaks.toml, src/frontend/vitest.config.js, src/frontend/vitest.behavior.config.js, tests/.evals/behavior/{Containerfile,run.sh,resolve-tiers.mjs}, playwright.config.ts, tests/e2e/seed.spec.ts

**J1 breakdown** (N/A criteria excluded, remaining weights renormalised)

| Criterion | Weight | Score | Note |
|---|---|---|---|
| ARCH-01 Single source of pricing math | 0.25 | 1.0 | No proration arithmetic or days-remaining computation anywhere in the diff; the dialog shows no charge (src/frontend/src/components/UpgradeDialog.jsx). |
| ARCH-02 Server decides plan, price and charge | 0.2 | N/A | The diff adds no upgrade request model and no endpoint — no server-side decision to judge. |
| ARCH-03 Renewal date is never modified by an upgrade | 0.15 | N/A | The diff contains no upgrade flow that could assign renew_at. |
| ARCH-04 Preview is read-only | 0.1 | N/A | The diff adds no preview handler. |
| ARCH-05 Plan data defined once | 0.15 | 1.0 | Frontend constants are limited to the dialog's static benefit list and Premium $40 copy; the current plan comes from the billing payload (src/frontend/src/pages/Billing.jsx:182). The API does not yet return Premium plan values, so nothing it returns is re-typed. |
| ARCH-06 No new runtime dependencies | 0.15 | 1.0 | Only devDependencies added (src/frontend/package.json devDependencies; root package.json devDependencies @playwright/test); requirements.txt and dependencies blocks unchanged. |

**J2 breakdown** (N/A criteria excluded, remaining weights renormalised)

| Criterion | Weight | Score | Note |
|---|---|---|---|
| SEC-01 A01:2025 Broken access control | 0.25 | N/A | No endpoint added or changed; the diff reads no user-owned data server-side. |
| SEC-02 A06:2025 Insecure design | 0.2 | N/A | No server-side upgrade flow in the diff. |
| SEC-03 A10:2025 Mishandling of exceptional conditions | 0.15 | N/A | The diff adds no error path — no new backend handler and no new fetch call (the existing Billing fetch is unchanged). |
| SEC-04 A09:2025 Security logging and alerting failures | 0.15 | N/A | No upgrade attempt exists in this story, so there is nothing to log; no log statement added. |
| SEC-05 A05:2025 Injection | 0.1 | 1.0 | API text (plan_name, price) is rendered through React JSX escaping (src/frontend/src/pages/Billing.jsx:182); no dangerouslySetInnerHTML or raw HTML insertion in the diff. |
| SEC-06 A03:2025 Software supply chain failures | 0.1 | 1.0 | Only JS devDependencies added (no Python requirements change, no runtime dependency); npm audit 0 vulnerabilities (static/npm-audit.json). |
| SEC-07 A02:2025 Security misconfiguration | 0.05 | 1.0 | No CORS, debug-mode or middleware change; new configs are test-tooling only (vitest configs, playwright.config.ts). |
