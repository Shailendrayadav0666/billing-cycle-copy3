# Behaviour Gate Evidence — Story 1.1 — Tier B3 (epic scope: B1 ∪ B2 + cross-story journeys)

**Date**: 2026-09-11
**Feature file(s) run**: `spec/behavior/story-1.1.feature` (24 scenarios) **+** `spec/behavior.feature` (0 scenarios — by design, see below)
**Runner**: pytest-bdd 8.1.0 (Python), pytest 9.1.1
**Result**: **24/24 scenarios PASSED**, 0 deselected/errored — `reports/behavior-test-evidence/story-1.1/b3/behavior-test-run.log`, `behavior-test-report.xml` (JUnit)

## Why B3 runs now (single-unit cycle)

Per `common/behavior-spec.md` Section 6.1: "Single-unit cycles (bug, enhancement, or a one-story epic): there are no other units, so the condition is satisfied immediately and B3 runs on that unit." Story 1.1 is this epic's only story (consolidated at the user's explicit request at GATE 1) — B3 runs, recorded as running on a single-unit cycle, not skipped.

```bash
AIRE_STORY_KEY=story-1.1 bash tests/.evals/behavior/run.sh b3
# -> 24 passed in 64.44s
```

## `spec/behavior.feature` — zero scenarios, by design, not a gap

`spec/behavior.feature` holds cross-story journeys that span multiple work units. With only one story in this epic, there is no second unit for a genuine cross-story seam to span — this is recorded explicitly in the file's own header, per `common/behavior-spec.md` Section 3's instruction to "record that explicitly" rather than invent a journey that would just restate story 1.1's own scenarios. Collecting this file added a `Feature:` header (previously missing — see below) so pytest-bdd's loader can resolve it as valid, empty Gherkin; `tests/behavior/test_behavior.py` guards the `scenarios()` call so a zero-scenario feature file collects as **zero tests**, not a collection error. Confirmed: `pytest tests/behavior/test_behavior.py` on its own reports "no tests ran" (not an error) — the earned, correct outcome.

**Minor fix along the way**: `spec/behavior.feature` previously had only comment lines and no `Feature:` keyword, which is not valid Gherkin (a `Feature:` block with zero `Scenario:`s is valid; a file with no `Feature:` at all is not). Added the header line; no scenario content was added or implied.

## Containerisation

**`containerised: false`** — same verified reason as B1/B2 (Podman installed but this machine's network to container registries is blocked; see `runtime-artifacts/audit.md`, entry "Behaviour Gate — Podman Containerisation Verified Unusable on This Machine"). **Tier result: PASS (unverified parity).**

## Environment

Identical to B1/B2 — see `reports/behavior-test-evidence/story-1.1/b1/evidence-manifest.md` for full detail.

## Scenario results

The 24 `@AC-*` scenarios from `spec/behavior/story-1.1.feature` — identical to B1's table, all **PASSED** (see `reports/behavior-test-evidence/story-1.1/b1/evidence-manifest.md`) — plus `spec/behavior.feature`, which contributed 0 scenarios (by design, see above).

**REQ-ID coverage** (`@REQ-<id>` tags in `spec/behavior.feature`): N/A — the file carries no scenarios and therefore no `@REQ-<id>` tags to cover.
