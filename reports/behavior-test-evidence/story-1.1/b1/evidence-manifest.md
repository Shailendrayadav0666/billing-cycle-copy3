# Behaviour Test Evidence — Tier B1 (Unit Scope) — Story 1.1

**Image**: `localhost/aire-behavior:local`
**Image ID (digest)**: `9073c98c4e03663f4fec99246328bf7f6b403d8050019eae1c29a6805dd9f7cc`
**Base image**: `mcr.microsoft.com/playwright/python:v1.56.0-noble` (Playwright 1.56.0 + Chromium preinstalled, pinned to match `src/backend/requirements-dev.txt`'s `playwright==1.56.0`)
**Containerised**: true
**Exact command**: `podman run --name aire-b1-final -e AIRE_STORY_KEY=story-1.1 aire-behavior:local "bash tests/.evals/behavior/run.sh b1"`
**Pod members**: none — a single container; the FastAPI app under test runs in-process (background thread) inside the SAME container as the test runner, so step definitions can seed exact fixture state (specific `renew_at` values, specific plans) directly on `main.users`/`main.billing_data` before Playwright's browser — also inside this container — drives the real, running HTTP server. No external datastore exists for this app (in-memory only), so no pod/sidecar is needed per `common/behavior-spec.md` Section 5.3 ("only a store the repo demonstrably needs").

## Feature file set (B1 = this unit only)
- `spec/behavior/story-1.1.feature` — 17 scenarios (11 ACs, `@AC-1` through `@AC-11`)

## Result
**16 passed** (pytest-bdd folds some multi-`@AC` scenario titles into 16 distinct test functions — see `behavior-test-report.xml`), **0 failed**, 6.76s.

Every `@AC-n` tag (AC-1 through AC-11) was executed at least once — verified via the scenario names in `behavior-test-run.log` and the JUnit `behavior-test-report.xml`.

## Files
- `behavior-test-run.log` — raw runner output
- `behavior-test-report.xml` — machine-readable JUnit XML report

## Provenance note — build environment
The Podman machine's WSL VM initially had zero outbound network connectivity (confirmed via
`podman machine ssh -- curl ...` timing out to both `mcr.microsoft.com` and `registry-1.docker.io`,
while the Windows host itself could reach both). Switched the machine to user-mode networking
(`podman machine set --user-mode-networking`), which resolved it — the image then pulled and built
successfully. Recorded here for reproducibility on another machine with the same symptom.
