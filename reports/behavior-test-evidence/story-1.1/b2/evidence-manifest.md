# Behaviour Test Evidence — Story 1.1 — Tier B2

**Tier**: B2 (cumulative — every other ACTIVE feature file)
**Result**: N/A (exit 3) — **not a failure**

**Reason**: Story 1.1 is the first story picked in this cycle. Per `common/behavior-spec.md` Section 6.0, a feature file is ACTIVE for B2/B3 only once its work unit has been started (`🔵 In Development` or beyond). At the time this gate ran, Stories 1.2, 1.3, and 1.4 were all still `🟢 Ready for Development` in the Story Tracker — none are ACTIVE — so there are no other feature files to run B2 against.

**Command**:
```bash
podman run --rm --name aire-b2-test -e AIRE_STORY_KEY=story-1.1 \
  -v "$PWD/reports:/work/reports:Z" -v "$PWD/runtime-artifacts:/work/runtime-artifacts:Z" \
  aire-behavior:local "bash tests/.evals/behavior/run.sh b2"
```
Resolved via `tests/.evals/scripts/resolve-active-features.cjs story-1.1 b2`, which read `## Story Tracker` in `runtime-artifacts/aire-state.md` and found zero other ACTIVE units.

This exclusion is named explicitly here (not silent) per the activation rule's requirement.
