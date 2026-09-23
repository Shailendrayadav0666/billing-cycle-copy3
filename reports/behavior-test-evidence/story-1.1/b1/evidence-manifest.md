# Behaviour Test Evidence — Story 1.1 — Tier B1

**Tier**: B1 (this work unit's own contract)
**Feature file**: `spec/behavior/story-1.1.feature`
**Containerised**: true
**Image**: `localhost/aire-behavior:local` — id `32491e7a94e506ff1bd060c3b6270174769ddb58e5d81351288eb4c601a88eed`
**Exact command**:
```bash
podman build -t aire-behavior:local -f tests/.evals/behavior/Containerfile .
podman run --rm --name aire-b1-test -e AIRE_STORY_KEY=story-1.1 \
  -v "$PWD/reports:/work/reports:Z" \
  aire-behavior:local "bash tests/.evals/behavior/run.sh b1"
```
**Pod members**: single container (no datastore needed — this story has no backend/DB dependency)

## Result

5 scenarios (5 passed), 38 steps (38 passed).

| Scenario | Tag | Result |
|---|---|---|
| Upgrade CTA is visible for a Standard-plan user | @AC-1 | PASS |
| Clicking the CTA opens a confirmation modal with the correct prorated preview | @AC-2 | PASS |
| The modal lists exactly the 3 approved benefit bullets, no more | @AC-3 | PASS |
| The modal offers Confirm and Cancel actions | @AC-4 | PASS |
| The Confirm button disables immediately to prevent a duplicate submission | @AC-5 | PASS |

All 5 `@AC-n` tags executed. Full raw output: `behavior-test-run.log`. Machine-readable report: `behavior-test-report.json`.

## Step-definition binding

Steps are bound to `<Billing />`'s actual rendered DOM output (via `@testing-library/react` + jsdom, inside the container) — the application's real public surface — never to internals. The only substitution is the `AuthContext` module (via Node's `require.cache`, before `Billing.jsx` is first required), because this story's scope does not include real authentication; every other dependency (fetch mocked at the `Before`/`After` hook level for `GET /api/billing`, `POST /api/billing/upgrade`) mirrors what a real browser session would see.
