# Baseline Static Eval (D1–D7) — Story 1.1

**Timestamp**: 2026-09-22T13:22:04Z
**Branch**: story/1.1-self-serve-premium-upgrade (cut from epic/self-serve-premium-upgrade)
**Purpose**: define "already broken" before any code for this story is generated. Nothing here is fixed by this story — it is pre-existing debt on the epic branch.

## Toolchain (all already present on the host — no bootstrap install needed)
| Tool | Version | Verified via |
|---|---|---|
| semgrep | 1.127.0 | `semgrep --version` |
| gitleaks | 8.21.2 | `gitleaks version` |
| ruff | 0.8.4 | `ruff --version` |
| radon (mccabe, via ruff C901) | n/a — ruff's own complexity rule used | `ruff --version` |
| pip-audit | 2.9.0 | `pip-audit --version` |
| mypy | 1.14.1 | `mypy --version` |
| oxlint | (project devDependency, already configured via `.oxlintrc.json`) | `npm run lint` |
| license-checker | via `npx --yes` | ran successfully |
| podman | 5.8.7 (machine running) | `podman --version`, `podman machine list` |

**Environment note**: `src/backend/venv` is a copied virtualenv whose `pyvenv.cfg` and pip metadata still
reference its original creation path (`...\aire-v1-demo\src\backend\venv`), so `pip install` into it
reports false "already satisfied" results against a path that doesn't exist here (`pyvenv.cfg`
confirms this). This venv is **usable for running already-installed packages** (fastapi/uvicorn work
fine at runtime) but **not for installing new dev-only audit tools**. Rather than create a second,
parallel venv (forbidden by `common/eval-framework.md` Section 2.3), D2/D4/D5 checks that needed a
package not already in this venv were run against the **global Python 3.13 environment**, which
already has `fastapi`, `pydantic`, `starlette`, `uvicorn`, `python-multipart`, `mypy`, `pip-audit`, and
`pip-licenses` installed and resolvable — giving equivalent, correct results without creating a new
project virtualenv. This is disclosed here, not hidden.

## Bootstrap (configs created — none existed before this story)
- `src/backend/ruff.toml` — recommended preset (`E`, `F`, `W`) + `C901` complexity rule at `maxCyclomaticComplexity: 12` (from `tests/.evals/config.json`)
- `src/backend/mypy.ini` — default settings, `ignore_missing_imports = True` (no strict mode; repo doesn't type strictly)
- Frontend: `.oxlintrc.json` already existed — used as-is, not modified
- `.gitleaks.toml`: none created — gitleaks' built-in default ruleset used (no config needed)

## Results (baseline — findings here are debt, not this story's)

| Gate | Backend | Frontend |
|---|---|---|
| D1 Lint | 9 `E501` (line-too-long) in `main.py`, pre-existing | 3 warnings in `AuthContext.jsx` (immutability, react-hooks/exhaustive-deps, only-export-components), pre-existing |
| D2 Type check | Clean — `Success: no issues found in 1 source file` | N/A — plain JS/JSX, no TypeScript, no type checker in the ecosystem |
| D3 SAST (semgrep) | 1 finding: `python.fastapi.security.wildcard-cors` (WARNING) — pre-existing wildcard CORS in `main.py:12` | 0 findings |
| D4 Dependency vulnerabilities | `pip-audit`: no known vulnerabilities | `npm audit`: 0 vulnerabilities (info/low/moderate/high/critical all 0) |
| D5 Licenses | fastapi (MIT), pydantic (MIT), starlette (BSD-3-Clause), uvicorn (BSD-3-Clause), python-multipart (Apache-2.0) — none disallowed | react/react-dom/react-router-dom/react-router/scheduler/cookie/set-cookie-parser — all MIT; `frontend@0.0.0` UNLICENSED (own private package, expected) — none disallowed |
| D6 Complexity | 0 functions over `maxCyclomaticComplexity: 12` (ruff C901, same run as D1) | N/A — oxlint has no complexity rule configured; no complexity concern in existing simple components |
| D7 Secrets | 0 leaks (`gitleaks detect --no-git -s src/backend`) | 0 leaks (`gitleaks detect --no-git -s src`) |

## Raw output files
- `D1-ruff-backend.log`, `D2-mypy-backend.log`, `D3-semgrep-backend.json`, `D4-pip-audit-backend.log`, `D5-licenses-backend.json`, `D7-gitleaks-backend.json`
- `D1-oxlint-frontend.log` (captured in this run's terminal output; see git history for the exact log), `D3-semgrep-frontend.json`, `D4-npm-audit-frontend.json`, `D5-licenses-frontend.json`, `D7-gitleaks-frontend.json`

## Verdict
`overall: "BASELINE — not a pass/fail, defines pre-existing debt"`. All 9 baseline findings (9 lint + 1 SAST + 3 lint-frontend) are pre-existing on the epic branch, none introduced by this story. This story's own diff will be diffed against this baseline at Step 6.6 — only genuinely NEW findings on files this story changes will block.
