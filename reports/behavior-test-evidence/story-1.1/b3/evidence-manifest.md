# Behaviour Test Evidence — Tier B3 (Epic Scope) — Story 1.1

**Image**: `localhost/aire-behavior:local`
**Image ID (digest)**: `9073c98c4e03663f4fec99246328bf7f6b403d8050019eae1c29a6805dd9f7cc`
**Exact command**: `podman run --name aire-b3-run -e AIRE_STORY_KEY=story-1.1 aire-behavior:local "bash tests/.evals/behavior/run.sh b3"`
**Containerised**: true (same image/setup as B1 — see `../b1/evidence-manifest.md` for the pod/environment details, shared here)

## Last-work-unit determination
This is a **single-story cycle** (Story 1.1 is the only story) — the "all OTHER work units' PRs merged" condition for running B3 is vacuously true (there are no other units), per `common/behavior-spec.md` Section 6.1's explicit "single-unit cycles" rule: "there are no other units, so the condition is satisfied immediately and B3 runs on that unit." Recorded here that B3 ran on a single-unit cycle — not presented as skipped.

## Feature file set (B1 ∪ B2 ∪ spec/behavior.feature)
- B1: `spec/behavior/story-1.1.feature` (17 scenarios)
- B2: empty (N/A, see `../b2/evidence-manifest.md`)
- `spec/behavior.feature`: 0 scenarios — explicitly recorded in the file's own header as "single-unit cycle, no cross-story journeys" (see `common/behavior-spec.md` Section 3: "write the genuine cross-unit journeys, or record explicitly that the requirement has none")

## Result
**16 passed**, 0 failed, 6.76s — identical scenario set to B1 (as expected: B2 contributed nothing, and the cycle-level feature file contributed zero additional scenarios).

## Files
- `behavior-test-run.log` — raw runner output
- `behavior-test-report.xml` — machine-readable JUnit XML report

## Note — a real defect found and fixed during this gate
`pytest_bdd.scenarios()` raises `NoScenariosFound` for a feature file with zero `Scenario:` blocks
rather than collecting zero tests silently. `tests/behavior/test_cycle_behavior.py` was updated to
check the feature file's content for a `Scenario:` line before calling `scenarios()` on it, so a
cycle-level file with no cross-unit journeys yet (the normal, expected state for most of a cycle's
life) doesn't break the B3 tier. This is a test-harness fix, not a scenario or application change.
