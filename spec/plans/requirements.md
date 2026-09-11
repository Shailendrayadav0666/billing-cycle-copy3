# Requirements: Mid-Cycle Subscription Upgrade (Standard → Premium)

**Parent Epic**: EPIC-LOCAL-1 — `spec/plans/epic-brief.md`
**Generated**: 2026-09-11T09:04:54Z

## Intent Analysis

- **User request**: "using aire and helix mcp fetch the solution document and start implementing the epic requirements" — the Epic itself (`spec/plans/epic-brief.md`, pulled from Helix) is the request's full content.
- **Request type**: New Feature (self-serve plan-upgrade flow added to an existing brownfield billing surface)
- **Scope estimate**: Multiple Components — one backend module (`backend/main.py`: 2 new endpoints, 1 new pure function, 1 new Pydantic model, 2 new constant blocks) + one frontend component (`frontend/src/pages/Billing.jsx`: CTA, modal, 2 new fetch calls)
- **Complexity estimate**: Simple — no new data stores, no auth changes, no external services; proration math and a deterministic dummy gateway are the only non-trivial logic
- **Depth applied**: **Minimal** — the Epic brief is exceptionally clear and complete (exact endpoint contracts, exact proration formula with a worked example, exact gateway signature and trigger rule, exact quota tables, exact file/line references already verified against the live code). No requirement-clarifying questions were needed; only the two framework-mandated extension opt-in questions were asked (both declined — see `## Extension Decisions` below).

## Existing-System Grounding (from `spec/plans/atlas-deep-dive.md`, Atlas via Helix MCP)

- Backend: FastAPI app, **in-memory dict store** (`users`, `billing_data`, `tasks_data` — no DB), CORS wide open (`allow_origins=["*"]`, pre-existing, out of scope to change).
- Auth: token **is** the user's email (`AuthContext.jsx` — `access_token` = email), stored in `localStorage`, sent as a query param (`?email=<token>`) — this repo's existing (non-ideal but established) convention; new endpoints must follow the same `email` query/body param pattern for consistency, not introduce a new auth scheme.
- `GET /api/billing` already returns the full `billing_data[email]` shape the frontend renders directly — the new endpoints extend this same shape, they don't replace it.
- `billing_data[email]["renew_at"]` and `users[email]["renew_at"]` are independently seeded from `(datetime.today() + timedelta(days=30)).strftime("%b %d, %Y")` at register/login time — confirmed the exact string format (`"%b %d, %Y"`, e.g. `"Sep 09, 2025"`) the Epic's proration formula must parse with `datetime.strptime`.
- Verified against live code: `Billing.jsx` line 128 is exactly `<span className="standard-badge">Standard</span>` (hardcoded) — confirms the Epic's file/line reference is accurate in this workspace.
- **Code Root note**: the Epic brief's paths (`backend/main.py`, `frontend/src/pages/Billing.jsx`) are relative to the recorded `## Code Root` (`src/`) in this workspace — i.e. `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`. No other discrepancy found between the Epic and the live codebase.

## Extension Decisions
- Resiliency Baseline: **Disabled** (user choice — POC, in-memory store, no HA/DR surface to apply it to)
- Property-Based Testing: **Disabled** (user choice — thin CRUD/UI layer; proration math is simple enough for standard unit tests)
- Security Baseline: **Always enforced** (mandatory, no opt-out) — applies to the 2 new endpoints (input validation on `email`, no secrets introduced, error responses don't leak internals)
- Playwright Test Automation: **Always enforced** (mandatory, no opt-out) — the CTA → modal → confirm/cancel UI flow is Playwright-automatable once the story's manual test plan exists

---

## Functional Requirements

### REQ-F-01 — Upgrade CTA visibility, driven by real plan data
The Billing page MUST show an "Upgrade to Premium" button only when the caller's current plan is Standard, and MUST replace the currently-hardcoded `"Standard"` badge (and the `"Active"` badge/price on the plan card) with values driven by the `GET /api/billing` response (`plan_name`, `price`). No CTA is shown for a Premium user.
*Source: Epic Story 1, Story 5 (guard half) · Files: `src/frontend/src/pages/Billing.jsx`*

### REQ-F-02 — Prorated upgrade preview endpoint
A new `GET /api/billing/upgrade-preview?email=<email>` endpoint MUST return, for a Standard subscriber: `current_plan`, `new_plan`, `days_remaining`, `prorated_charge`, `next_renewal_price`, `renew_at` — computed server-side per the proration formula (`REQ-F-04`). For a Premium subscriber it MUST return HTTP 409 `{"detail": "already_premium"}` instead (see REQ-F-06).
*Source: Epic Story 2, Story 5 · Files: `src/backend/main.py`*

### REQ-F-03 — Confirmation modal before charging
Clicking "Upgrade to Premium" MUST open an in-page modal (no navigation) that fetches and displays the `upgrade-preview` response: current plan + price, new plan + price, days remaining, the exact prorated charge, and the next renewal price/date. The modal MUST offer exactly two actions, "Confirm Upgrade" and "Cancel"; Cancel closes the modal with zero side effects. The frontend MUST NOT compute the prorated amount itself — it only displays what the backend returned.
*Source: Epic Story 2 · Files: `src/frontend/src/pages/Billing.jsx`*

### REQ-F-04 — Server-side proration formula
Given `renew_at` (format `"%b %d, %Y"`), `days_remaining = max(1, (parsed_renew_at - today).days)`, `days_in_cycle = 30` (fixed), `daily_delta = (40.0 - 20.0) / 30`, `prorated_charge = round(daily_delta * days_remaining, 2)`. This exact formula MUST be used by both `upgrade-preview` (display only) and `upgrade` (the actual charge amount), so the two never disagree.
*Source: Epic "Pricing & Proration Specification" + "Technical Design Notes" · Files: `src/backend/main.py`*

### REQ-F-05 — Execute upgrade via dummy gateway; happy path
On "Confirm Upgrade", `POST /api/billing/upgrade` with `{"email": <email>}` MUST: recompute the prorated charge (REQ-F-04) server-side, call `charge_card(email, prorated_charge)` (REQ-F-07), and on `{"status": "success"}`: set `users[email]["plan"] = "Premium"`, `users[email]["price"] = "$40/month"`, `billing_data[email]["plan_name"] = "Premium"`, `billing_data[email]["price"] = "$40/month"`, replace `billing_data[email]["usages"]` with the Premium quota values (REQ-F-08), update `on_demand_usage.notice` to the Premium message (REQ-F-08), and return `{"status": "success", "plan": "Premium", "charge": <amount>}`. `renew_at` MUST be left unchanged in both `users` and `billing_data`. The frontend MUST then re-fetch `GET /api/billing`, close the modal, hide the CTA (plan is now Premium), and show a success banner reporting the exact amount charged.
*Source: Epic Story 3 (happy path), Story 4 · Files: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`*

### REQ-F-06 — Execute upgrade via dummy gateway; decline path
On the same `POST /api/billing/upgrade`, if `charge_card` returns `{"status": "card_declined", "message": ...}`, the endpoint MUST return HTTP 402 with `{"detail": "card_declined", "message": "Your card was declined."}` and MUST NOT mutate `users` or `billing_data` in any way. The frontend MUST keep the modal open, show the error message inline ("Payment failed: Your card was declined. Your plan has not changed."), and leave Cancel available.
*Source: Epic Story 3 (failure path) · Files: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`*

### REQ-F-07 — Deterministic dummy payment gateway
A new pure function `def charge_card(email: str, amount: float) -> dict` MUST return `{"status": "card_declined", "message": "Your card was declined."}` when `email.startswith("fail")`, else `{"status": "success"}`. No network call, no external SDK, no environment/config toggle — the email prefix is the only branch condition.
*Source: Epic "Dummy Payment Gateway Specification" · Files: `src/backend/main.py`*

### REQ-F-08 — Premium quota values
On successful upgrade, `billing_data[email]["usages"]` MUST be replaced with: Chat credits `used:0, total:10000`; Chatbots `used:0, total:10`; Documents pages `used:0, total:5000` (labels/help text/ids unchanged from the Standard entries, only `total` and `used` change — `used` resets to 0 on upgrade per the Epic's `PREMIUM_QUOTAS` constant). `on_demand_usage.notice` MUST change to `"On-demand credit is available on your Premium plan."`.
*Source: Epic Story 4 + Technical Design Notes `PREMIUM_QUOTAS` · Files: `src/backend/main.py`*

### REQ-F-09 — Already-Premium guard on both new endpoints
`GET /api/billing/upgrade-preview` and `POST /api/billing/upgrade` MUST both return HTTP 409 `{"detail": "already_premium"}` when `billing_data[email]["plan_name"] == "Premium"`, without touching any data. The frontend MUST also suppress the CTA client-side once `plan_name === "Premium"` so this path is a defense-in-depth guard, not the primary UX gate.
*Source: Epic Story 5 · Files: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`*

### REQ-F-10 — Unauthenticated / unknown email guard (consistency with existing endpoints)
Both new endpoints MUST reject an `email` not present in `users` with HTTP 401 `{"detail": "Not authenticated"}`, matching the exact pattern already used by `GET /api/billing` and `GET /api/tasks` in this file. This was not stated as a separate story in the Epic but is required for consistency with every other endpoint in `backend/main.py` and to avoid a `KeyError` on an unknown email.
*Source: Derived from existing-code convention (Atlas deep dive) — flagged as an implicit requirement, not new scope · Files: `src/backend/main.py`*

---

## Non-Functional Requirements

### REQ-NF-01 — No new external dependencies
No new pip or npm package may be added; `charge_card` and the proration logic use only the Python standard library (`datetime`) already imported in `backend/main.py`.
*Source: Epic "Out of Scope" + Goals ("no external dependencies")*

### REQ-NF-02 — All money math is server-authoritative
The frontend never computes a price, a prorated amount, or a quota value — it only renders numbers returned by the API. This is testable: no arithmetic on `price`/`prorated_charge`/`days_remaining` may appear in `Billing.jsx`.
*Source: Epic Story 2 ("prorated amount is fetched from the backend, not computed in the frontend") + Acceptance Criteria — Epic Level*

### REQ-NF-03 — No regression to unrelated flows
Auth (login/register), the token=email pattern, `Tasks` page, routing (`App.jsx`), and CORS configuration are untouched. Only `backend/main.py` (additive: 1 constant block, 1 quota constant, 1 pure function, 1 Pydantic model, 2 endpoints) and `frontend/src/pages/Billing.jsx` (additive: CTA, modal, 2 fetch calls) change.
*Source: Epic Goals + Acceptance Criteria — Epic Level ("No changes to auth, tasks, login, or registration flows")*

### REQ-NF-04 — Idempotent-safe error responses (Security Baseline)
Error responses (`402`, `409`, `401`) MUST NOT leak internal state (no stack traces, no raw exception text) — only the documented `detail`/`message` shape. Input validation on `email` relies on FastAPI/Pydantic's built-in type coercion (string) plus the existing `users` membership check; no new injection surface is introduced (no raw SQL/shell/file-path use of `email`).
*Source: Security Baseline extension (always mandatory)*

### REQ-NF-05 — UI automatable via Playwright
The CTA → modal → Confirm/Cancel → success-banner-or-inline-error flow must be built with stable, selectable structure (e.g. discoverable button text/roles) so it is automatable by the Playwright Test Automation extension's Planner/Generator agents once the manual test plan exists — no `data-testid` mandated by the Epic, but no anti-patterns (e.g. dynamically-generated non-deterministic button text) that would block automation.
*Source: Playwright Test Automation extension (always mandatory)*

---

## Requirements Coverage Note
Coverage against these REQ-IDs is asserted by every story's `Covers` line and validated as a coverage matrix in `stories.md` (User Stories stage, Rule 3 of `common/requirements-traceability.md`) before GATE 1.

## Design references consulted
None — Context Opt-In (existing-knowledge / new-references) was declined; the Epic brief and the live codebase (read directly) are the sole and sufficient sources.
