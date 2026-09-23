# Baseline Static Eval Evidence — Story 1.1 (src/frontend root only)

**Timestamp**: 2026-09-23T10:59:00Z (approx, captured before code generation)
**Root**: `src/frontend` (the only root Story 1.1's diff touches; `src/backend` is out of scope for this story per its Scope section and is not baselined here)
**Working directory for every command below**: `src/frontend` (cwd == root, per `common/eval-framework.md` Section 1.1)

## Tools and versions (bootstrapped/verified)
| Gate | Tool | Version | Bootstrap action |
|---|---|---|---|
| D1 Lint | oxlint | 1.85.0 | Already declared in `package.json` devDependencies; installed via `npm install` |
| D2 Type check | — | N/A | Project is plain JS/JSX, no TypeScript compiler configured — genuinely inapplicable to this stack |
| D3 SAST | semgrep | 1.127.0 | Already present on PATH (matches `tests/.evals/config.json` pin) |
| D4 SCA | npm audit | npm 10.9.2 (built-in) | No install needed |
| D5 License | license-checker (via npx) | latest via npx cache | Run via `npx license-checker` — no persistent install needed |
| D6 Complexity | eslint (`complexity` rule only) | 10.11.0 | oxlint has no complexity rule — bootstrapped a minimal `eslint.config.js` at `src/frontend/eslint.config.js` scoped ONLY to `complexity: ["error", 12]` (matches `maxCyclomaticComplexity` in `tests/.evals/config.json`); installed as a pinned devDependency (`npm i -D eslint@10.11.0`) |
| D7 Secrets | gitleaks | 8.21.2 | Already present on PATH (matches `tests/.evals/config.json` pin) |

## Commands run (baseline, on the freshly cut `story/1.1-upgrade-cta-confirmation-modal` branch, before any code changed)
```bash
cd src/frontend
npx oxlint src --format json > ../../reports/eval-evidence/story-1.1/static/baseline/d1-oxlint.json
semgrep --config auto src --json --output ../../reports/eval-evidence/story-1.1/static/baseline/d3-semgrep.json
npm audit --json > ../../reports/eval-evidence/story-1.1/static/baseline/d4-npm-audit.json
npx license-checker --json --production --excludePrivatePackages > ../../reports/eval-evidence/story-1.1/static/baseline/d5-licenses.json
npx eslint -c eslint.config.js src --format json > ../../reports/eval-evidence/story-1.1/static/baseline/d6-eslint-complexity.json
gitleaks detect --source src --no-git -f json -r ../../reports/eval-evidence/story-1.1/static/baseline/d7-gitleaks.json
```

## Baseline results (pre-existing debt — this story is NOT responsible for any of this; recorded to define "already broken")
| Gate | Result |
|---|---|
| D1 Lint | 1 pre-existing warning: `react/exhaustive-deps` in `src/context/AuthContext.jsx` (not touched by this story) |
| D2 Type check | N/A |
| D3 SAST | 0 findings |
| D4 SCA | 0 vulnerabilities (info/low/moderate/high/critical all 0) |
| D5 License | 0 disallowed licenses across 7 production packages |
| D6 Complexity | 0 violations (5 files linted, threshold 12) |
| D7 Secrets | 0 leaks found |

## Unit test / regression baseline
No test suite exists anywhere in this repository (`tests/unit/`, `tests/api/`, or colocated) prior to this story — verified by `find tests -type f` and a search for `test_*`/`*.test.*`/`*.spec.*` under `src/`. Recorded per `workflows/dev-implement.md` Step 1.5 Item 4.5: "If the repo has no test suite at all, record that explicitly — the post-implementation gate then covers only this story's new tests." `reports/unit-test-evidence/story-1.1/baseline-regression.log` records this explicitly (see that file).
