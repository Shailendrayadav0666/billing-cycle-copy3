# Code Generation Plan — Story 1.1: Upgrade CTA & Confirmation Modal (Frontend)

**Story**: 1.1 (local — no external tracker)
**Covers**: REQ-F-01, REQ-F-02, REQ-F-09, REQ-F-11, REQ-NF-05 (`spec/plans/requirements.md`)
**Requires**: none — immediately startable
**Design reference**: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (exact copy, layout, button labels, 3-item benefit list, no Dolby Vision — see `## Design References` in `runtime-artifacts/aire-state.md`)
**Behaviour contract**: `spec/behavior/story-1.1.feature` (5 scenarios, @AC-1..5) — read, not authored here
**API Layer Generation**: N/A — this story calls the (not-yet-existent-in-this-branch) upgrade endpoint but does not define it; no endpoint is added or changed by this story

## Steps

- [x] **Step 1 — Frontend Components Generation: `UpgradeModal` component** (REQ-F-02, REQ-F-11, AC-2, AC-3, AC-4)
  Create `src/frontend/src/components/UpgradeModal.jsx` — a presentational modal component receiving the plan/pricing data as props, rendering the title, body copy, remaining-days/charge rows, the fixed 3-bullet benefit list (no Dolby Vision), and Confirm/Cancel buttons.

- [x] **Step 2 — Frontend Components Generation: Billing page wiring** (REQ-F-01, REQ-F-09, AC-1, AC-5)
  Modify `src/frontend/src/pages/Billing.jsx`: add the "Upgrade to Premium" CTA (Standard-plan only), modal open/close state, client-side proration preview calculation (same formula as the backend will use), the Confirm handler that disables the button immediately and calls `POST /api/billing/upgrade`, re-enabling on completion (success/failure branches are added by Stories 1.3/1.4 — this story's own ACs cover only the disable-on-click behavior, not the response handling).

- [x] **Step 2.5 — Frontend Components Summary**
  `UpgradeModal.jsx` (new) + `Billing.jsx` (modified) together implement AC-1 through AC-5.

- [x] **Step 3 — Styling** (REQ-NF-05)
  Add modal/CTA styles to `src/frontend/src/App.css`, matching the existing design language (colors, spacing, card/button conventions already used in the file).

- [x] **Step 4 — Unit Test & Coverage** (Step 11a, MANDATORY) — 20/20 passing, 100% lines / 96.66% branches.

- [x] **Step 5 — API & Contract Testing Gate**: N/A — this story's plan has no API Layer Generation step.

- [x] **Step 5.5 — Behavioural Gherkin Gate (B1/B2/B3)** — B1 5/5 scenarios PASS in Podman; B2/B3 N/A (recorded with reasons).

- [x] **Step 5.6 — Test Placement Verification Gate** — 0 violations.

- [x] **Step 6 — Full Regression vs Baseline** (Step 11b) — 20/20 pass, 0 NEW failures vs baseline.

- [x] **Step 7 — Static Eval Gate D1–D7** (Step 11c) — 0 NEW findings across D1-D7.

- [ ] **Step 8 — Test Plans + Playwright UI Automation Gate** (Step 11d):
  - Part A: `spec/test-plans/1.1-upgrade-cta-confirmation-modal/` already exists (written and approved at the STOP CHECKPOINT) — verify, do not regenerate.
  - Part B: this story's plan includes a Frontend Components Generation step (Steps 1–2 above) → Playwright UI Automation **applies**. Invoke `playwright-implement` in workflow mode.

- [ ] **Step 9 — Documentation Generation**: write `reports/ticket-summary/story-1.1-summary.md`.

- [ ] **Step 10 — Deployment Artifacts**: N/A — no infrastructure/deployment change.

## REQ/AC Trace Completeness Self-Check

| REQ/AC | Plan step(s) |
|---|---|
| REQ-F-01 / AC-1 | Step 2 |
| REQ-F-02 / AC-2 | Step 1, Step 2 |
| AC-3 | Step 1 |
| AC-4 | Step 1 |
| REQ-F-09 / AC-5 | Step 2 |
| REQ-F-11 | Step 1 |
| REQ-NF-05 | Step 3 |

All 5 ACs and all 5 Covers REQ-IDs (REQ-F-01, REQ-F-02, REQ-F-09, REQ-F-11, REQ-NF-05) appear in ≥1 tagged step above. No gap.
