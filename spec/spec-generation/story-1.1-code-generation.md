# Code Generation Plan — Story 1.1: Self-Serve Premium Upgrade

**Generated**: 2026-09-22T13:31:20Z
**Grounded in**: `spec/plans/stories.md` (Story 1.1, 11 ACs), `spec/plans/requirements.md` (REQ-F-01..15, REQ-NF-01..06), `spec/plans/architecture.md` (Section 10 constraints ARCH-01..06), `spec/plans/epic-brief.md`

## Design Reference Grounding (DR-5 re-consult — automatic, no question)

Reconciliations table in `runtime-artifacts/aire-state.md` `## Design References` read FIRST — two points already settled there (Premium feature values follow the Epic's table not the mockup's; colors follow existing `App.css` teal, not the mockup's green). Re-opened `spec/context-project/new-references/StreamPlex Billing.html` for the unreconciled points (layout/structure/copy):

- **Upgrade CTA**: Design reference: `StreamPlex Billing.html` — grounded (top-right of header row, solid button, hidden when Premium)
- **Confirmation modal**: Design reference: `StreamPlex Billing.html` — grounded (title/subtitle copy, stat panel layout, bulleted highlights, button labels — feature values reconciled to Epic table)
- **Success banner**: Design reference: `StreamPlex Billing.html` — grounded (persistent bordered banner below plan/renew grid, copy pattern)
- **Backend endpoint contract, proration math, guards**: Design reference: none covers this component — built from `requirements.md` / `stories.md` only

## REQ/AC Trace Summary

| Plan Step | REQ-IDs | ACs |
|---|---|---|
| 1 | REQ-F-05, REQ-F-08, REQ-NF-01, REQ-NF-02 | AC-5 |
| 2 | REQ-F-04, REQ-F-06, REQ-F-07, REQ-NF-03 | AC-5, AC-6, AC-7 |
| 3 | REQ-F-14 | AC-1 |
| 4 | REQ-F-01, REQ-F-12 | AC-2 |
| 5 | REQ-F-02, REQ-F-03, REQ-F-09, REQ-F-15 | AC-3, AC-4, AC-8 |
| 6 | REQ-F-10 | AC-10 |
| 7 | REQ-F-13 | AC-9 |
| 8 | REQ-NF-06 | AC-2, AC-3, AC-9 (styling only) |
| 9 (regression) | REQ-F-11 | AC-11 |

Trace completeness self-check: every REQ-ID Story 1.1 `Covers` appears above (15/15 REQ-F, 3/3 applicable REQ-NF); every AC (1–11) appears in ≥1 step. PASS.

## Steps

- [ ] **Step 1 — Backend: proration helper + Premium plan data** (`src/backend/main.py`)
  - Add `calculate_days_remaining(renew_at: str) -> int` — parses `"%b %d, %Y"`, returns `max(0, min(30, (renew_date - today).days))` (ARCH constraint: clamp per REQ-F-02/05)
  - Add a `PREMIUM_USAGES` / `PREMIUM_INCLUDED_USAGE` constant matching the Epic's feature table (4K Ultra HD, 4 streams, 6 downloads, Dolby Vision) — no new file, same module as existing `billing_data`

- [ ] **Step 2 — Backend: `POST /api/billing/upgrade` endpoint** (`src/backend/main.py`)
  - `UpgradeRequest` Pydantic model (`email: str`)
  - Guard: unknown email → 401 `{"detail": "Not authenticated"}`
  - Guard: already Premium → 400 `{"detail": "Already on Premium plan"}`
  - Success: compute `days_remaining`, `prorated_charge = round((40-20)*(days_remaining/30), 2)`, mutate `users[email]` and `billing_data[email]`, return the full billing shape + `prorated_charge`
  - No new dependency added (ARCH-01), no new persistence (ARCH-02), no new auth mechanism (ARCH-03)

- [ ] **Step 3 — Frontend: dynamic plan-name rendering** (`src/frontend/src/pages/Billing.jsx`)
  - Replace hardcoded `"Standard"` literal in the plan badge and the "What's included with Standard" heading with `data.plan_name`

- [ ] **Step 4 — Frontend: Upgrade CTA** (`src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`)
  - Render "Upgrade to Premium" button top-right of the header row, only when `data.plan_name === "Standard"`

- [ ] **Step 5 — Frontend: confirmation modal** (`src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`)
  - Modal state (open/closed), client-side preview calc mirroring the backend formula for display only
  - Confirm → `POST /api/billing/upgrade`, on success `setData(response)` directly (no re-fetch)
  - Cancel → close modal, no API call

- [ ] **Step 6 — Frontend: modal failure handling** (`src/frontend/src/pages/Billing.jsx`)
  - On fetch rejection or non-2xx response, show inline error state in the modal with retry; existing `GET /api/billing` fetch left untouched

- [ ] **Step 7 — Frontend: persistent success banner** (`src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`)
  - Bordered banner below the plan/renew grid, shown once `data.plan_name === "Premium"` and a `justUpgraded` transient marker is set from the upgrade response (so it doesn't show for a user who was already Premium before this session)

- [ ] **Step 8 — Styling** (`src/frontend/src/App.css`)
  - New CSS classes for the CTA, modal, and banner using the existing teal accent tokens already in the file (no new hex values, no new dependency)

- [ ] **Step 9 — Unit Test & Coverage Gate** (mandatory, same run)
  - Backend: `tests/unit/backend/test_billing_upgrade.py` (pytest) — proration boundaries, guards, response shape
  - Frontend: `tests/unit/frontend/Billing.test.jsx` (vitest + Testing Library) — CTA visibility, modal open/confirm/cancel, banner, error state
  - Bootstrap test tooling first (Step 9a below) since none exists yet

- [ ] **Step 9a — Bootstrap test tooling** (one-time, this story)
  - Backend: `src/backend/requirements-dev.txt` (pytest, pytest-cov, httpx — httpx required by FastAPI's TestClient)
  - Frontend: add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` as devDependencies; `vite.config.js` test block

## Out of Scope (unchanged from requirements.md)
Downgrades, refunds, payment verification, enterprise plans, external payment processors, persistent DB, fixing the existing `GET /api/billing` silent-failure bug, broader auth remediation.
