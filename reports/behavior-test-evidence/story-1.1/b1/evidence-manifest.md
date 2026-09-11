# Behaviour Gate Evidence — Story 1.1 — Tier B1 (this work unit)

**Date**: 2026-09-11
**Feature file(s) run**: `spec/behavior/story-1.1.feature` (24 scenarios, 25 ACs — AC-3 and AC-13 each span two scenarios, AC-5/AC-6 share one)
**Runner**: pytest-bdd 8.1.0 (Python), pytest 9.1.1
**Result**: **24/24 scenarios PASSED** — `reports/behavior-test-evidence/story-1.1/b1/behavior-test-run.log`, `behavior-test-report.xml` (JUnit)

## Containerisation

**`containerised: false`** — **not** the Section 5.1 "Podman not installed" exception (Podman 5.8.2 IS installed and its VM is running). Verified instead that this machine's Podman VM cannot reach any container registry over the network:
- `podman build` failed twice: first killed by this environment's own memory guard mid-pull, then (on retry) failed for real with `dial tcp ...: i/o timeout` pulling `python:3.13-slim`.
- Diagnosed inside `podman machine ssh podman-machine-default`: both `curl -4` and `curl -6` to `registry-1.docker.io:443` and to `ghcr.io:443` time out. DNS resolves fine (both A and AAAA records returned) — this is a blocked network path, not a DNS or registry-availability issue.
- Cross-checked the Windows **host** itself: `Invoke-WebRequest https://registry-1.docker.io/v2/` returns HTTP 401 (the expected, healthy anonymous-challenge response) — the host's own network is fine. No proxy is configured anywhere on the host that the VM could be missing (`netsh winhttp show proxy` = direct access).
- `podman images` shows zero images ever pulled on this machine — this is the first local Podman pull attempted in this project (earlier Podman/CI work in this cycle ran on GitHub-hosted Actions runners, not locally).

Full root-cause trail: `runtime-artifacts/audit.md`, entry "Behaviour Gate — Podman Containerisation Verified Unusable on This Machine (SH-LOOP-7)".

Per `common/behavior-spec.md` Section 5.1's own fallback ("run natively... mark PASS (unverified parity)"), applied on **verified**, not assumed, grounds. **Tier result: PASS (unverified parity).**

## Exact commands run

```bash
# Canonical entrypoint (proves tier resolution works, run once):
AIRE_STORY_KEY=story-1.1 bash tests/.evals/behavior/run.sh b1
# -> 24 passed in 63.97s

# Evidence capture (same resolved module, with a machine-readable report):
src/backend/venv/Scripts/python.exe -m pytest tests/behavior/test_story_1_1.py \
  -q -p no:warnings \
  --junitxml=reports/behavior-test-evidence/story-1.1/b1/behavior-test-report.xml
# -> 24 passed in 64.21s
```

## Environment

- **Venv reused** (`common/eval-framework.md` Section 2.3): `src/backend/venv` — already existed from the Unit Test gate. Added `pytest-bdd==8.1.0`, `playwright==1.49.1`.
- **Browser**: Chromium Headless Shell 131.0.6778.33 (Playwright build v1148), installed via `playwright install chromium` on this host.
- **Frontend**: real production build (`npm run build` in `src/frontend`, reusing the project's existing `node_modules` — native run, no container/host OS mismatch to isolate against), served by the backend's own existing static mount.
- **Backend**: a real `uvicorn.Server` per scenario, in-process on an ephemeral port, in-memory state reset to a clean baseline before every scenario (see `tests/behavior/conftest.py`).
- **Binding**: API-observable steps -> `httpx.Client` against the live server. Rendered-UI steps -> a real Chromium page via Playwright, against the same live server (both hit the exact same running app — no mocking, no TestClient shortcut for the UI-facing scenarios).

## Scenario results

All 24 `@AC-*` scenarios in `spec/behavior/story-1.1.feature`, in file order — every one **PASSED**:

| # | Tag(s) | Scenario | Result |
|---|---|---|---|
| 1 | @AC-1 | Billing page shows the real plan name, not a hardcoded label | PASS |
| 2 | @AC-2 | Plan card shows the real price and Active badge | PASS |
| 3 | @AC-3 | Upgrade CTA appears for a Standard subscriber | PASS |
| 4 | @AC-3 | Upgrade CTA is absent for a Premium subscriber | PASS |
| 5 | @AC-4 | Upgrade CTA has stable, automation-friendly text | PASS |
| 6 | @AC-5 @AC-6 | Upgrade preview computes the correct prorated charge for a Standard subscriber | PASS |
| 7 | @AC-7 | Upgrade preview is blocked for an already-Premium subscriber | PASS |
| 8 | @AC-8 | Upgrade preview rejects an unknown email | PASS |
| 9 | @AC-9 | Clicking the CTA opens the confirmation modal and loads the preview | PASS |
| 10 | @AC-10 | Confirmation modal displays every required field verbatim | PASS |
| 11 | @AC-11 | Cancel closes the modal with no side effects | PASS |
| 12 | @AC-12 | The displayed prorated charge matches the API response exactly | PASS |
| 13 | @AC-13 @AC-14 | Confirming the upgrade with a valid card flips the plan to Premium | PASS |
| 14 | @AC-15 | A successful upgrade sets Premium-tier quotas | PASS |
| 15 | @AC-16 | Confirming an upgrade is blocked for an already-Premium subscriber | PASS |
| 16 | @AC-17 | Confirming an upgrade rejects an unknown email | PASS |
| 17 | @AC-13 @AC-18 | Confirming the upgrade with a declined card returns a clear error | PASS |
| 18 | @AC-19 | A declined card leaves the subscriber's data completely unchanged | PASS |
| 19 | @AC-20 | Confirm Upgrade calls the upgrade endpoint with the subscriber's email | PASS |
| 20 | @AC-21 | A successful upgrade refreshes the Billing page and hides the CTA | PASS |
| 21 | @AC-22 | A successful upgrade shows the exact amount charged | PASS |
| 22 | @AC-23 | A declined payment keeps the modal open | PASS |
| 23 | @AC-24 | A declined payment shows the inline error message | PASS |
| 24 | @AC-25 | A declined payment leaves Cancel available and the plan on Standard | PASS |

**AC coverage**: every `@AC-1` .. `@AC-25` tag is exercised by at least one scenario — 25/25.

## A real defect found and fixed while building this gate

While writing these scenarios' bindings, found AC-10 was **not actually met**: the modal's current/new-plan rows rendered `Standard ($20.00/mo)` / `Premium ($40.00/mo)` (decimals), but AC-10 requires the literal `Standard ($20/mo)` / `Premium ($40/mo)` (no decimals — decimals ARE required on the separate renewal-price line, which was already correct). Fixed in `src/frontend/src/pages/Billing.jsx` (`PLAN_PRICES` constant) and tightened `tests/unit/frontend/Billing.test.jsx`'s loose regex assertion into an exact-text one. Full trace: `runtime-artifacts/audit.md`.
