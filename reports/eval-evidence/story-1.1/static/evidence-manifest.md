# Static Eval Gate (D1–D7) — Post-Change — Story 1.1

Diffed against `../static/baseline/evidence-manifest.md`. Only findings NEW versus baseline, on
files this story changed, count against the gate.

| Gate | Backend | Frontend |
|---|---|---|
| D1 Lint | 9 findings — **identical set to baseline** (verified by rule/file/line) after fixing 1 genuinely new `E501` this story introduced (line-wrapped) | 3 warnings — identical to baseline, all in untouched `AuthContext.jsx` |
| D2 Type check | **1 new finding fixed**: `record: dict = ...` type annotation added to resolve a false narrow-type inference on the heterogeneous `billing_data` dict literal (mypy couldn't infer `record["renew_at"]` as `str`). Now clean — `Success: no issues found` | N/A (unchanged — plain JS/JSX) |
| D3 SAST (semgrep) | 1 finding — **identical** (`python.fastapi.security.wildcard-cors`, `main.py:12`, pre-existing, untouched by this diff) | 0 findings — unchanged |
| D4 Dependency vulnerabilities | `pip-audit`: no known vulnerabilities (unchanged; no new runtime dependency) | `npm audit`: 0 vulnerabilities across all 6 new devDependencies (vitest, @testing-library/*, jsdom, @vitest/coverage-v8) |
| D5 Licenses | Unchanged — `requirements.txt` has zero new lines (diffed against the epic-branch HEAD copy) | 124 packages checked (was 8 at baseline) — the new dev-only test tooling adds no disallowed license; 0 matches against the disallowed list |
| D6 Complexity | 0 functions over `maxCyclomaticComplexity: 12` (ruff C901, same run as D1) — the new `upgrade_plan` handler and `calculate_days_remaining` helper are both simple, well under the limit | N/A — unchanged |
| D7 Secrets | 0 leaks (unchanged) | 0 leaks (unchanged) |

## New findings fixed in this run (SH-LOOP-4, attempt 1 of 3 — resolved, loop exits successfully)
1. **D1** — `main.py:215` (as originally written) — `E501` line-too-long on the new already-Premium guard's `raise HTTPException(...)` line. Fixed by wrapping the call across three lines. Re-verified: `ruff check .` back to 9 findings (baseline count), all pre-existing.
2. **D2** — `main.py:220` — mypy inferred `record["renew_at"]` as `Collection[Collection[str]]` instead of `str` due to `billing_data`'s heterogeneous dict-literal value types (the dict has `usages: list`, `included_usage: dict`, and `renew_at: str` keys, and mypy's literal-dict inference doesn't narrow per-key). Fixed with an explicit `record: dict` annotation. Re-verified: `mypy .` → `Success: no issues found`.

## Files
- `D1-ruff-backend.log`, `D2-mypy-backend.log`, `D3-semgrep-backend.json`, `D4-pip-audit-backend.log`, `D5-licenses-backend.json`, `D7-gitleaks-backend.json`
- `D1-oxlint-frontend.log`, `D3-semgrep-frontend.json`, `D4-npm-audit-frontend.json`, `D5-licenses-frontend.json`, `D7-gitleaks-frontend.json`

## Verdict
**PASS — 0 new findings outstanding.** Both genuinely new findings this story introduced were fixed in the same run, never suppressed.
