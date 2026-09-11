# Behaviour Gate Evidence — Story 1.1 — Tier B2 (every other feature file)

**Date**: 2026-09-11
**Feature file(s) run**: `spec/behavior/story-1.1.feature` — see note below on why this is B2's own file too.
**Runner**: pytest-bdd 8.1.0 (Python), pytest 9.1.1
**Result**: **24/24 scenarios PASSED** — `reports/behavior-test-evidence/story-1.1/b2/behavior-test-run.log`, `behavior-test-report.xml` (JUnit; identical run to B1 — see note)

## Note: B2 currently resolves to the same file as B1

`common/behavior-spec.md` Section 6 describes B2 as "every **OTHER** `.feature` file in `spec/behavior/`". This is a **single-story epic** (consolidated at the user's explicit request at GATE 1) — no other work unit, and therefore no other feature file, exists yet. The canonical `tests/.evals/behavior/run.sh` script's `b2` case lists **every** `*.feature` file under `spec/behavior/` (it does not itself exclude the current unit's own file via `AIRE_STORY_KEY`), so on a single-file repo it resolves to the same `story-1.1.feature` and re-runs the same 24 scenarios:

```bash
AIRE_STORY_KEY=story-1.1 bash tests/.evals/behavior/run.sh b2
# -> 24 passed in 64.64s (identical result to b1)
```

This is harmless, real execution (not a stub, not skipped) — the same class of intentional, documented tolerance the spec already grants elsewhere ("two developers finishing together may both see all others merged and both run B3... harmless — the same suite runs twice", Section 6.1). It genuinely proves what B2 exists to prove ("I broke nobody else's behaviour") **vacuously true**, because there is nobody else's behaviour yet. Once a second story exists in this epic, its own feature file will make B2 exercise real, distinct cross-unit content for the first time.

## Containerisation

**`containerised: false`** — same verified reason as B1 (Podman installed but this machine's network to container registries is blocked; see B1's `evidence-manifest.md` and `runtime-artifacts/audit.md`). **Tier result: PASS (unverified parity).**

## Environment

Identical to B1 (same venv, same browser, same live-server fixtures) — see `reports/behavior-test-evidence/story-1.1/b1/evidence-manifest.md` for full detail.

## Scenario results

Identical to B1's table (same 24 `@AC-*` scenarios, same file) — all **PASSED**. See `reports/behavior-test-evidence/story-1.1/b1/evidence-manifest.md` for the full per-scenario list.
