# Behaviour Test Evidence — Tier B2 (Cumulative Scope) — Story 1.1

**Image**: `localhost/aire-behavior:local`
**Image ID (digest)**: `dbd48db7b134754eb308d904e77f402864828806061066d9bd14584bca24f041` (pre-B3-fix image; B2's outcome is unaffected by the later `test_cycle_behavior.py` fix since B2 never touches that file)
**Exact command**: `podman run --name aire-b2-run -e AIRE_STORY_KEY=story-1.1 aire-behavior:local "bash tests/.evals/behavior/run.sh b2"`

## Result
**N/A** (exit code 3) — `run.sh` counted feature files in `spec/behavior/` other than `story-1.1.feature` and found zero. Per `common/behavior-spec.md` Section 6: "B2 is N/A only when the repo genuinely contains no other feature file" — true here, this being the first and only story of the cycle.

## Files
- `behavior-test-run.log` — raw output (the single N/A announcement line from `run.sh`)
