# Evidence Manifest — Behavioural B1 (Gherkin) — story-1.1

| Field | Value |
|---|---|
| Work unit | Story 1.1 — Premium upgrade dialog on the Billing page |
| Branch / head | story/1.1-premium-upgrade-dialog-on-the-billing-page @ ce9c3c2 (uncommitted work-unit changes) · base ce9c3c2 |
| Generated | 2026-09-25T12:58:23Z |
| AIRE version | 1.0 |
| Status | PASS |

## Commands run
| # | Command | Working directory | Exit code |
|---|---|---|---|
| 1 | `podman build -t aire-behavior:local -f tests/.evals/behavior/Containerfile .` | repo root | 0 |
| 2 | `podman run --rm -v "<repo>:/work:Z" -v /work/src/frontend/node_modules -e AIRE_STORY_KEY=story-1.1 aire-behavior:local "sh tests/.evals/behavior/run.sh b1"` | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| Podman | 5.8.7 |
| Base image | docker.io/library/node:22.14.0-bookworm-slim (node v22.14.0, linux-x64) |
| Vitest | 5.0.2 |
| @amiceli/vitest-cucumber | 8.0.0 |
| @testing-library/react | 16.3.3 |
| jsdom | 29.1.1 |

## Result
| Item | Value |
|---|---|
| Tier | B1 — this work unit's own contract |
| Feature files in scope | spec/behavior/story-1.1.feature |
| Scenarios passed | 5/5 (7/7 scenario runs — the Scenario Outline has 3 Examples rows); 44/44 steps |
| @AC tags executed | 5/5 (@AC-1, @AC-2, @AC-3, @AC-4, @AC-5) |
| Containerised | yes |
| Image ref + digest | localhost/aire-behavior:local · image 11a76a5b0cad · sha256:0463ec00334f43b993db42726bbdbc7eb95888337c2317ecb911ac0ba7ed468f |

| Scenario | Tag | Result |
|---|---|---|
| A Standard subscriber sees the Upgrade to Premium button | @AC-1 | Pass |
| A Premium subscriber is not offered an upgrade | @AC-2 | Pass |
| Opening the dialog shows the plan comparison and Premium benefits | @AC-3 | Pass |
| Dismissing the dialog leaves the page unchanged (clicking "Cancel" / pressing Escape / clicking the backdrop) | @AC-4 | Pass (3/3 examples) |
| The dialog is accessible from the keyboard | @AC-5 | Pass |

## Artifacts
| File | What it is |
|---|---|
| behavior-test-run.log | raw run.sh + Vitest verbose output from the container |
| behavior-test-report.json | Vitest JSON report (44 assertions, success true) |

## Exceptions and notes
Runner: Vitest + @amiceli/vitest-cucumber, which loads the feature by explicit path (`loadFeature(path.resolve(import.meta.dirname, '../../../spec/behavior/story-1.1.feature'))`) — the behaviour-spec rule 4.1 requirement — and reuses the app's own Vite JSX/CSS transform. Step definitions bind through the rendered Billing page with the Billing API stubbed at the fetch boundary (tests/behavior/support/billing-api.js). Tier membership from tests/.evals/behavior/resolve-tiers.mjs: 8 other feature files excluded (their units are Ready for Development).
