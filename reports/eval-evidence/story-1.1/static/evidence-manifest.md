# Evidence Manifest — Static Eval D1–D7 — story-1.1

| Field | Value |
|---|---|
| Work unit | Story 1.1 — Premium upgrade dialog on the Billing page |
| Branch / head | story/1.1-premium-upgrade-dialog-on-the-billing-page @ ce9c3c2 (uncommitted work-unit changes, staged for the scan) · base ce9c3c2 |
| Generated | 2026-09-25T14:32:22Z |
| AIRE version | 1.0 |
| Status | PASS |

## Commands run
| # | Command | Working directory | Exit code |
|---|---|---|---|
| 1 | `oxlint -c .oxlintrc.json --format json src` | src/frontend | 0 |
| 2 | `oxlint -c ../../tests/.evals/lint/oxlint-complexity.json --format json src` | src/frontend | 0 |
| 3 | `semgrep scan --config auto --json --quiet --output static/semgrep.json src/frontend/src` (+ summary run with `--metrics on`) | repo root | 0 |
| 4 | `npm audit --json` | src/frontend | 0 |
| 5 | `npx --yes license-checker-rseidelsohn@4.3.0 --start src/frontend --json --excludePrivatePackages` | repo root | 0 |
| 6 | `gitleaks git --pre-commit --staged --report-format json` (baseline: `gitleaks git` full history) | repo root | 0 |
| 7 | `python static_delta.py story-1.1 ce9c3c2` (match on rule + file + message, changed files only) | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| oxlint | 1.85.0 (repo devDependency) |
| semgrep | 1.127.0 (pip; the podman image rung failed 3/3 on VM DNS before the VM restart) |
| npm audit | npm bundled with Node 22.14.0 |
| license-checker-rseidelsohn | 4.3.0 (npx) |
| gitleaks | 8.21.2 (Windows release binary, ~/.aire-tools) |

## Result
| D-gate | Tool | Baseline findings | Post-change findings | NEW on changed files | Threshold | Status |
|---|---|---|---|---|---|---|
| D1 Lint | oxlint | 3 (AuthContext.jsx) | 3 | 0 | lintErrorsAllowedDelta 0 | PASS |
| D2 Type check | — | — | — | — | typeErrorsAllowed 0 | N/A — plain JavaScript/JSX; no type checker applies |
| D3 SAST | semgrep auto (200 rules) | 0 | 0 (11 files) | 0 | 0C / 0H / ≤5M | PASS |
| D4 Dependencies | npm audit | 0 | 0 | 0 | 0C / 0H | PASS |
| D5 Licences | license-checker | 132 packages, 0 disallowed | 132 packages, 0 disallowed | 0 | disallowedLicenses | PASS |
| D6 Complexity | oxlint eslint/complexity | 0 | 0 | 0 | maxCyclomaticComplexity 12 | PASS |
| D7 Secrets | gitleaks | 0 (history) | 0 (staged diff) | 0 | secretFindingsAllowed 0 | PASS |

## Artifacts
| File | What it is |
|---|---|
| oxlint.json, complexity.json, semgrep.json, semgrep-summary.log, npm-audit.json, license-report.json, gitleaks.json, gitleaks.log | post-change tool output |
| baseline/ (same file set) | pre-change tool output |
| delta-summary.json | the NEW-vs-baseline computation |

## Exceptions and notes
Repository `.oxlintrc.json` used as-is for D1. D6 uses a separate complexity-only config so the repository's lint config is not modified. semgrep scans only git-tracked files, so the change set was staged before the post-change scan (11 files vs 10 at baseline — the new UpgradeDialog.jsx included).
