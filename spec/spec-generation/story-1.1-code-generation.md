# Code Generation Plan — Story 1.1: Prorated Upgrade Endpoint

**Story**: `spec/plans/stories.md` Story 1.1 — Prorated Upgrade Endpoint
**Covers**: REQ-F-02, REQ-F-03, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-09, REQ-F-10, REQ-NF-02, REQ-NF-04, REQ-NF-05, REQ-NF-06, REQ-NF-07, REQ-NF-08
**Requires**: none (immediately startable)
**Design context**: `spec/plans/architecture.md` Section 5 (API contract), Section 6 (cross-cutting: authZ, idempotency), Section 10 ARCH-01..08 (verifiable constraints)
**Design reference**: none covers this component — built from ACs + architecture.md only (no `## Design References` registered; Context Project declined at Workspace Detection)

## Existing Code Being Modified (brownfield)

`src/backend/main.py` — single-file FastAPI app, 6 existing endpoints, in-memory dicts (`users`, `billing_data`, `tasks_data`), email-as-identity pattern (no separate auth token — every endpoint takes `email` directly and checks membership in `users`). This story ADDS to this file; no existing endpoint's body is modified (ARCH-08).

## Design Decisions Not Fully Specified by the Epic (stated explicitly, per Step 1.5)

- **Premium plan catalog values**: the Epic gives the Premium price ($40/month) and the worked proration example, but not Premium's usage limits. Introducing a `PLAN_CATALOG` lookup (Standard: 2000 chat-credits/3 chatbots/1000 doc-pages @ $20/mo — matching existing data; Premium: 5000/10/5000 @ $40/mo — a reasonable generous-tier assumption, documented here so it is traceable to a decision, not silently invented in code).
- **Cycle length**: `CYCLE_LENGTH_DAYS = 30`, a single named constant (ARCH-06) — the only place `30` appears in the proration path. Days remaining computed from the user's existing `renew_at` field.

## Implementation Steps

- [ ] **Step 1 — Business Logic: `PLAN_CATALOG` + proration helper** (REQ-F-07, REQ-NF-06)
  - Add `PLAN_CATALOG` dict (Standard/Premium: price, limits) and `CYCLE_LENGTH_DAYS = 30` constant to `src/backend/main.py`.
  - Add `_prorated_charge(current_plan: str, target_plan: str, renew_at: str) -> float` — parses `renew_at`, computes `days_remaining` (clamped `0..CYCLE_LENGTH_DAYS`), returns `round((PLAN_CATALOG[target_plan]["price"] - PLAN_CATALOG[current_plan]["price"]) * days_remaining / CYCLE_LENGTH_DAYS, 2)`.

- [ ] **Step 2 — API Layer: `UpgradeRequest` model + `POST /api/billing/upgrade`** (REQ-F-02, REQ-F-03, REQ-F-05, REQ-F-06, REQ-F-09, REQ-F-10, REQ-NF-02, REQ-NF-04)
  - `class UpgradeRequest(BaseModel): email: str` — Pydantic validates type/presence before any handler logic runs (REQ-F-10, ARCH-07).
  - `@app.post("/api/billing/upgrade")` handler, `dry_run: bool = False` query param:
    1. Validate `payload.email in users` → else `401` (same pattern as every existing endpoint — this IS the app's authentication/authorization check; there is no separate caller-vs-target identity to compare, so requiring membership is the full extent of ARCH-02/REQ-F-09 for this app's existing auth model, applied consistently).
    2. Idempotency guard (ARCH-01, REQ-F-05): if `billing_data[email]["plan_name"] == "Premium"` → `400` `{"detail": "Account is already on the Premium plan"}`, no mutation, regardless of `dry_run`.
    3. Compute `charge = _prorated_charge("Standard", "Premium", billing_data[email]["renew_at"])` (REQ-F-07).
    4. `dry_run=True` (ARCH-03, REQ-F-02): return `{"prorated_charge": charge, "current_plan": "Standard", "new_plan": "Premium", "days_remaining": <n>}` — **no mutation**.
    5. `dry_run=False` (REQ-F-03): mutate `users[email]["plan"]`, `users[email]["price"]`, `billing_data[email]["plan_name"]`, `billing_data[email]["price"]`, and each `usages[i]["total"]` to the Premium catalog values — **never touch `on_demand_usage`** (ARCH-04, REQ-F-06). Return `{"applied_charge": charge, "plan": "Premium", "billing": billing_data[email]}`.

- [ ] **Step 3 — Unit Test & Coverage** (Step 11a — MANDATORY, this story's new/changed code ≥ `unitTestCoverageMin`)
- [ ] **Step 4 — API & Contract Testing Gate** (Step 11a.5 — MANDATORY, this story adds an API endpoint): functional/happy path, response-code validation, authorization (401 unauthenticated; no separate role tier in this app so 403 is N/A — state why), error-response validation (400 idempotency), request validation (missing/wrong-type `email`), response contract validation (preview vs apply shapes).
- [ ] **Step 5 — Test Placement Verification** (Step 11a.6)
- [ ] **Step 6 — Full Regression vs Baseline** (Step 11b)
- [ ] **Step 7 — Static Eval Gate D1–D7** (Step 11c)
- [ ] **Step 8 — Test Plans + Playwright Gate** (Step 11d): Part A (`ve-implement`, workflow mode) always runs. Part B (`playwright-implement`) is **N/A — no Frontend Components Generation step in this story's plan** (backend-only story; UI is Story 1.2).

## REQ/AC → Plan Step Trace (self-check, Step 4)

| REQ-ID / AC | Plan Step |
|---|---|
| REQ-F-02 (preview) / AC-1 | Step 2.4 |
| REQ-F-03 (apply) / AC-2 | Step 2.5 |
| REQ-F-05 (idempotency) / AC-3 | Step 2.2 |
| REQ-F-06 (balance untouched) | Step 2.5 |
| REQ-F-07 (proration formula) | Step 1 |
| REQ-F-09 (authZ) / AC-4 | Step 2.1 |
| REQ-F-10 (input validation) / AC-4 | Step 2 (Pydantic model) |
| REQ-NF-02 (API error rate — design target, verified by gates) | Step 4 (API & Contract Gate) |
| REQ-NF-04 (Security Baseline diff scope) | Steps 2, 7 (Static Eval D3), Code Review Phase 2.5 |
| REQ-NF-05 (test coverage) / AC-5 | Step 3 |
| REQ-NF-06 (single cycle length) / AC-5 | Step 1 (`CYCLE_LENGTH_DAYS` constant) |
| REQ-NF-07 (Resiliency Baseline — disabled) | N/A — extension opted out |
| REQ-NF-08 (Property-Based Testing — disabled) | N/A — extension opted out |

All 13 Covers REQ-IDs and all 5 story ACs trace to ≥1 step. Trace complete.
