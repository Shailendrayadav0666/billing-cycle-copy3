### Eval Scorecard — Story 1.1 · **PASS**

| Gate | Result | Threshold | Status |
|---|---|---|---|
| D1 Lint | 0 new findings | ≤ 0 delta | ✅ PASS |
| D2 Type check | 0 errors | 0 | ✅ PASS |
| D3 Static security | 0C / 0H / 0M | 0C / 0H / ≤5M | ✅ PASS |
| D4 Dependencies | 0C / 0H | 0C / 0H | ✅ PASS |
| D5 Licences | 0 violations | none disallowed | ✅ PASS |
| D6 Complexity | within threshold | ≤ 12 | ✅ PASS |
| D7 Secrets | 0 findings | 0 | ✅ PASS |
| Unit coverage | 100% (backend + frontend, changed-files scope) | ≥ 90.0% | ✅ PASS |
| Behavioural B1 (this story) | 24/24 scenarios · 25/25 ACs · native (unverified parity — Podman network-blocked) | 100% | ✅ PASS (unverified parity) |
| Behavioural B2 (cumulative) | 24/24 scenarios · 1 feature file (only one exists yet) · native (unverified parity) | 100% | ✅ PASS (unverified parity) |
| Behavioural B3 (epic scope) | 24/24 scenarios · single-unit cycle · native (unverified parity) | 100% | ✅ PASS (unverified parity) |
| API & contract | 2/2 endpoints | all applicable | ✅ PASS |
| Regression | 0 new failures | 0 | ✅ PASS |
| J1 Architecture | 1.00 | ≥ 0.85 | ✅ PASS |
| J2 Security (OWASP 2025) | 0.88 | ≥ 0.85 | ✅ PASS |

**Verdict**: PASS · judge `claude-sonnet-5` · rubric v1.0.0 (from `architecture.md` v1.0.0)
**Self-healing**: SH-LOOP-1 1/3 (proration date bug) · SH-LOOP-4 1/3 (mypy annotations) · SH-LOOP-6 1/3 (J2 recalibration) · SH-LOOP-7 2/3 (Behaviour Gate containerisation, verified infeasible on this machine — see below) · all others 0/3

**Bootstrapped**: `tests/.evals/eslint-complexity.config.json` (D6 complexity rule for `src/frontend`, since oxlint has none).

**Behaviour Gate containerisation note**: Podman 5.8.2 is installed and running on this machine, but its outbound network to every container registry tested (`registry-1.docker.io`, `ghcr.io`) is verifiably blocked — confirmed via direct TCP/TLS tests from inside the Podman VM, while the Windows host itself reaches the same registries successfully. This is a real, host-level network-policy restriction (most likely the corporate endpoint-security agent on this managed laptop), not a code defect, not a missing dependency, and not a convenience shortcut. Per `common/behavior-spec.md` Section 5.1's own fallback, all three tiers ran natively (real uvicorn server, real Playwright Chromium, real network calls — no mocking) and are marked `PASS (unverified parity)` rather than a plain PASS. CI (GitHub-hosted runners, unaffected by this machine's network) remains the authoritative containerised run of this gate. Full root-cause trail: `runtime-artifacts/audit.md`.
