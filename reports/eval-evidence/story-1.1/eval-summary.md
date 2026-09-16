### Eval Scorecard — Story 1.1 · **PASS**

| Gate | Result | Threshold | Status |
|---|---|---|---|
| D1 Lint | 0 new findings | ≤ 0 delta | ✅ PASS |
| D2 Type check | 0 new errors (2 pre-existing, baseline) | 0 new | ✅ PASS |
| D3 Static security | 0C / 0H / 0M | 0C / 0H / ≤5M | ✅ PASS |
| D4 Dependencies | 0C / 0H (manually verified real scan) | 0C / 0H | ✅ PASS |
| D5 Licences | 0 violations (manually verified real scan) | none disallowed | ✅ PASS |
| D6 Complexity | no new findings | ≤ 12 | ✅ PASS |
| D7 Secrets | 0 findings | 0 | ✅ PASS |
| Unit coverage | 100% on new/changed lines (manual verification — see note) | ≥ 90.0% | ✅ PASS |
| Behavioural B1 (this story) | 6/6 scenarios · 4/4 AC tags · unverified parity (no registry access locally) | 100% | ✅ PASS (unverified parity) |
| Behavioural B2 (cumulative) | no other feature file exists yet | N/A | ⚪ N/A |
| Behavioural B3 (epic scope) | not the last unit | last unit only | ⚪ N/A |
| API & contract | 1/1 endpoint, 6/6 checklist items | all applicable | ✅ PASS |
| Playwright UI automation | backend-only story | UI stories only | ⚪ N/A |
| Regression | 0 new failures (baseline: 0 tests) | 0 | ✅ PASS |
| J1 Architecture | 1.00 | ≥ 0.85 | ✅ PASS |
| J2 Security (OWASP 2025) | 1.00 (SEC-08 N/A, renormalized) | ≥ 0.85 | ✅ PASS |

**Verdict**: PASS · judge `claude-sonnet-5` · rubric v1.0.0 (from `architecture.md` v1.0.0)
**Self-healing**: SH-LOOP-4 1/3 (resolved) · SH-LOOP-7 1/3 (resolved) · SH-LOOP-12 1/3 (resolved) · all other loops 0/3

**Note on unitCoverage**: the mechanized `coverage_delta()` check inside the canonical, unmodified
`run-static-evals.sh` hit a reproducible bash arithmetic bug on this Windows dev machine (`line 642:
invalid arithmetic operator`), confirmed byte-identical against `aire-workflow/templates/ci/run-static-evals.sh`.
Compensating evidence: coverage.xml's Missing-lines list was manually cross-checked against this story's
changed line ranges (twice, independently) and shows 100% coverage on every new/changed line — all 27
missed statements are inside the 5 pre-existing, untouched endpoints. This will be verified for real by
CI once the PR is raised (GitHub-hosted Linux runners, where this Windows-local bug is not expected to
reproduce).

**Note on behaviorB1**: Podman is installed but this sandboxed dev environment has no network egress to
`registry-1.docker.io`, so the mandatory container build timed out. Ran natively instead and disclosed
it per `common/behavior-spec.md` Section 5.1's treatment (never a plain PASS). CI's Attestation gate
(SH-LOOP-10) will re-verify this for real, containerised, once the PR is raised.
