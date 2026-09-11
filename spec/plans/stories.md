EPIC TICKET: EPIC-LOCAL-1 — Mid-Cycle Subscription Upgrade (Standard → Premium) — local description, spec/plans/epic-brief.md (no external tracker; Type: LOCAL)

# User Stories — Mid-Cycle Subscription Upgrade

**team_size**: 2 (fixed default) · **story_creation_mode**: all-at-once (fixed default)

> **Sizing note**: this was originally SPIDR-sliced into 7 single-purpose stories (1.1–1.7, preserved below in `## Original SPIDR Slicing (superseded)` for traceability). At GATE 1 the user explicitly requested **"single story"** — collapsing all 7 into one. This is a deliberate, logged override of the Step 1.5 hard sizing ceilings (a single story here exceeds 5 ACs, touches both the backend and frontend layers, and spans multiple scenario classes) — recorded per `common/requirements-traceability.md`/`planning/user-stories.md` Step 21 rather than silently re-split. Requirements coverage is unaffected: all 15 REQ-IDs remain fully covered by this one story's ACs (the union of the original 7 stories' ACs, unchanged in substance). Because there is only one story, the Dependency Graph stage resolves to a single node with no parallelism — the `team_size: 2` target is not met, by explicit user choice.

---

## Story 1.1 — Mid-Cycle Subscription Upgrade (Standard → Premium)

**As** Sam (Standard Subscriber), **I want** a self-serve "Upgrade to Premium" flow on the Billing page — CTA, prorated-charge confirmation, and immediate plan flip on successful payment — **so that** I can move to Premium mid-cycle without contacting support, paying only for the days remaining in my current cycle.

**Covers**: REQ-F-01, REQ-F-02, REQ-F-03, REQ-F-04, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-08, REQ-F-09, REQ-F-10, REQ-NF-01, REQ-NF-02, REQ-NF-03, REQ-NF-04, REQ-NF-05

**Layer**: Backend (`src/backend/main.py`) + Frontend (`src/frontend/src/pages/Billing.jsx`) — both layers, single story by explicit user request
**Scenario classes covered**: display/conditional-render, read-only computation, modal open/display/cancel, happy-path mutation, failure-path (zero mutation), success-path UI reaction, failure-path UI reaction

**Acceptance Criteria** (union of the original 1.1–1.7 slice, unchanged in substance):

*Plan badge & CTA (AC-1 → AC-4, REQ-F-01, REQ-NF-03, REQ-NF-05)*
- AC-1: The hardcoded `<span className="standard-badge">Standard</span>` (Billing.jsx line 128) is replaced with `data.plan_name` from the `GET /api/billing` response.
- AC-2: The plan card's price (`data.price`) and "Active" badge continue to render from `data` (already correct — verified, not hardcoded).
- AC-3: An "Upgrade to Premium" button renders when `data.plan_name === "Standard"` and is absent when `data.plan_name === "Premium"`.
- AC-4: The button has stable text ("Upgrade to Premium") with no dynamically-generated label, so it is Playwright-automatable.

*Backend: upgrade-preview endpoint & proration (AC-5 → AC-8, REQ-F-02, REQ-F-04, REQ-F-09, REQ-F-10, REQ-NF-01, REQ-NF-04)*
- AC-5: Add `PLANS = {"Standard": {"price": 20.0, "label": "$20/month"}, "Premium": {"price": 40.0, "label": "$40/month"}}` and `DAYS_IN_CYCLE = 30`, and a proration helper: `days_remaining = max(1, (datetime.strptime(renew_at, "%b %d, %Y") - datetime.today()).days)`, `daily_delta = (40.0 - 20.0) / 30`, `prorated_charge = round(daily_delta * days_remaining, 2)`.
- AC-6: `GET /api/billing/upgrade-preview?email=<email>` returns `{"current_plan": "Standard", "new_plan": "Premium", "days_remaining": <int>, "prorated_charge": <float>, "next_renewal_price": 40.00, "renew_at": "<unchanged>"}` for a Standard subscriber (worked example: 15 days remaining → $10.00).
- AC-7: For a Premium subscriber, the endpoint returns HTTP 409 `{"detail": "already_premium"}`, no computation performed.
- AC-8: For an `email` not in `users`, returns HTTP 401 `{"detail": "Not authenticated"}` (matches the existing `GET /api/billing` pattern).

*Frontend: confirmation modal (AC-9 → AC-12, REQ-F-03, REQ-NF-02, REQ-NF-05)*
- AC-9: Clicking "Upgrade to Premium" opens a modal (no navigation) and fetches `GET /api/billing/upgrade-preview?email=<token>`.
- AC-10: The modal displays, verbatim from the API: current plan + price, new plan + price, days remaining, "You will be charged **$X.XX** today", "$40.00/month starting `<renew_at>`".
- AC-11: Exactly two actions — "Confirm Upgrade" and "Cancel"; Cancel closes the modal with no side effects.
- AC-12: No arithmetic on `price`/`prorated_charge`/`days_remaining` appears in the frontend — every number is rendered directly from the API.

*Backend: execute upgrade — happy path & gateway (AC-13 → AC-17, REQ-F-05, REQ-F-07, REQ-F-08, REQ-F-09, REQ-F-10, REQ-NF-01, REQ-NF-04)*
- AC-13: Add `def charge_card(email: str, amount: float) -> dict` — `{"status": "card_declined", "message": "Your card was declined."}` when `email.startswith("fail")`, else `{"status": "success"}`. Add `UpgradeRequest(BaseModel)` with `email: str`.
- AC-14: `POST /api/billing/upgrade` recomputes the prorated charge via the AC-5 helper, calls `charge_card`; on success sets `users[email]["plan"]="Premium"`, `users[email]["price"]="$40/month"`, `billing_data[email]["plan_name"]="Premium"`, `billing_data[email]["price"]="$40/month"`, returns `{"status": "success", "plan": "Premium", "charge": <amount>}`. `renew_at` unchanged in both dicts.
- AC-15: On success, `billing_data[email]["usages"]` is replaced with Premium quotas (Chat credits `used:0,total:10000`; Chatbots `used:0,total:10`; Documents pages `used:0,total:5000`) and `on_demand_usage.notice` becomes `"On-demand credit is available on your Premium plan."`.
- AC-16: For a Premium subscriber, `POST /api/billing/upgrade` returns HTTP 409 `{"detail": "already_premium"}`, no mutation, no `charge_card` call.
- AC-17: For an unknown `email`, returns HTTP 401 `{"detail": "Not authenticated"}`.

*Backend: execute upgrade — decline path (AC-18 → AC-19, REQ-F-06, REQ-NF-04)*
- AC-18: When `charge_card` returns `card_declined`, `POST /api/billing/upgrade` returns HTTP 402 `{"detail": "card_declined", "message": "Your card was declined."}`.
- AC-19: On decline, `users[email]` and `billing_data[email]` are verified byte-for-byte unchanged (unit test asserts no mutation).

*Frontend: confirm — success handling (AC-20 → AC-22, REQ-F-05, REQ-NF-02, REQ-NF-05)*
- AC-20: "Confirm Upgrade" calls `POST /api/billing/upgrade` with `{"email": token}`.
- AC-21: On success, the page re-fetches `GET /api/billing`, closes the modal, and the CTA disappears (`plan_name` now `"Premium"`).
- AC-22: A success banner renders `"You're now on Premium! $<charge>.00 was charged."` using the response's `charge` value (no recomputation).

*Frontend: confirm — decline handling (AC-23 → AC-25, REQ-F-06, REQ-NF-05)*
- AC-23: On a 402 response, the modal stays open (no close/navigate).
- AC-24: An inline error renders: `"Payment failed: Your card was declined. Your plan has not changed."`.
- AC-25: "Cancel" remains available; closing shows the Billing page still on Standard.

**Persona**: Sam, Dana, Priya
**Requires**: none (single story)

---

## Requirements Coverage Matrix

| REQ-ID | Covering Stories | Status |
|---|---|---|
| REQ-F-01 | 1.1 | Full |
| REQ-F-02 | 1.1 | Full |
| REQ-F-03 | 1.1 | Full |
| REQ-F-04 | 1.1 | Full |
| REQ-F-05 | 1.1 | Full |
| REQ-F-06 | 1.1 | Full |
| REQ-F-07 | 1.1 | Full |
| REQ-F-08 | 1.1 | Full |
| REQ-F-09 | 1.1 | Full |
| REQ-F-10 | 1.1 | Full |
| REQ-NF-01 | 1.1 | Full |
| REQ-NF-02 | 1.1 | Full |
| REQ-NF-03 | 1.1 | Full |
| REQ-NF-04 | 1.1 | Full |
| REQ-NF-05 | 1.1 | Full |

**Coverage: 15/15 REQ-IDs fully covered.**

## Story Granularity Check (explicit override recorded)

Story 1.1 exceeds the Step 1.5 hard sizing ceilings (25 ACs, two architectural layers, seven scenario classes) — this is a **deliberate, user-directed exception**, requested verbatim as "single story" at GATE 1, not an oversight. No further auto-splitting was applied. Logged in `runtime-artifacts/audit.md`.

---

## Original SPIDR Slicing (superseded — kept for traceability)

Before the "single story" request, this epic was sliced into 7 single-purpose stories: 1.1 (plan badge/CTA, frontend), 1.2 (preview endpoint + proration + guard, backend), 1.3 (confirmation modal, frontend), 1.4 (execute upgrade happy path + gateway + quotas, backend), 1.5 (execute upgrade decline path, backend), 1.6 (confirm-success wiring, frontend), 1.7 (confirm-decline wiring, frontend). Each of those stories' ACs is preserved verbatim above, grouped by section, under the single consolidated Story 1.1.
