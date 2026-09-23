# Behaviour Test Evidence — Story 1.1 — Tier B3

**Tier**: B3 (epic scope — last work unit only)
**Result**: N/A (exit 3) — deferred, **not a failure**

**Reason**: Story 1.1 is not the last work unit of this cycle. Per `common/behavior-spec.md` Section 6.1, B3 runs only once every OTHER work unit's PR is confirmed merged. Stories 1.2, 1.3, and 1.4 have not started (no PRs exist yet), so this is correctly deferred rather than skipped-and-forgotten.

**Command**:
```bash
podman run --rm --name aire-b3-test -e AIRE_STORY_KEY=story-1.1 \
  -v "$PWD/reports:/work/reports:Z" -v "$PWD/runtime-artifacts:/work/runtime-artifacts:Z" \
  aire-behavior:local "bash tests/.evals/behavior/run.sh b3"
```

Will be re-attempted whenever a later story's `dev-implement` run determines it is the last unit (all other PRs merged).
