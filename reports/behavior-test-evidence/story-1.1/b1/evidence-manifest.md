# Behaviour Test Evidence — Tier B1 — Story 1.1

**Command**: `AIRE_STORY_KEY=story-1.1 python -m pytest tests/behavior/test_story_1_1.py -v --junitxml=behavior-test-report.xml`
**Runner**: pytest-bdd 8.1.0 (`tests/behavior/steps/billing_upgrade_steps.py`, bound to the real app via `fastapi.testclient.TestClient` — the public HTTP surface, never internals)
**Feature file**: `spec/behavior/story-1.1.feature`
**Result**: 6/6 scenarios PASS. Every `@AC-n` tag executed: AC-1, AC-2 (x2), AC-3, AC-4 (x2).

## Containerisation — NOT satisfied, exception recorded

`"containerised": false`
`"reason": "podman is installed (podman.exe present, Podman Desktop running) but this sandboxed dev environment has no network egress to registry-1.docker.io — podman build on tests/.evals/behavior/Containerfile (FROM docker.io/library/python:3.13-slim) times out at the image pull step (confirmed: 'dial tcp ...:443: i/o timeout'). Build was left running in the background for several minutes with no progress."`

Per `common/behavior-spec.md` Section 5.1, the only NAMED exception is "Podman not installed" — this is
a narrower case (installed, but no registry access) not literally that one. Recording it as the
closest honest equivalent rather than silently working around it: **tier marked `PASS (unverified
parity)`**, never a plain `PASS`. This is a local-machine limitation, not a stack/behavior defect —
GitHub-hosted CI runners have registry access, so this exception should not reproduce there; the CI
Attestation gate (SH-LOOP-10) is what will actually re-verify this tier for real once the PR is raised.

## Artifacts
- `behavior-test-run.log` — raw pytest output
- `behavior-test-report.xml` — JUnit XML
