# Code Generation Plan — Story 1.1: Mid-Cycle Subscription Upgrade (Standard → Premium)

**Tracker Item**: Story 1.1 (local — no external tracker)
**Epic Link**: none
**Covers**: REQ-F-01..10, REQ-NF-01..05 (all 15 REQ-IDs — see `spec/plans/requirements.md`)
**Dependencies**: `requires: []` (no prerequisites) · `enables: []` (no dependents — single-story epic)
**Design references**: none registered (`## Design References` in `runtime-artifacts/aire-state.md` is empty — Context Opt-In was declined). Every component below is built from the Epic brief + acceptance criteria only: `Design reference: none covers this component — built from ACs only`.

Source documents consulted: `spec/plans/epic-brief.md`, `spec/plans/requirements.md`, `spec/plans/stories.md`, `spec/plans/architecture.md` (Sections 3, 5, 6, 10).

---

## Step 1 — Backend: pricing constants, proration helper, dummy gateway (Business Logic Generation)
**File**: `src/backend/main.py`
**REQ/AC**: REQ-F-04 (AC-5), REQ-F-07 (AC-13), REQ-NF-01

- [ ] Add `PLANS` dict (Standard $20.00/"$20/month", Premium $40.00/"$40/month") and `DAYS_IN_CYCLE = 30` constants.
- [ ] Add `PREMIUM_QUOTAS` constant (usages list: chat-credits total 10000, chatbots total 10, documents-pages total 5000, `used: 0`, same `id`/`label`/`help` as the Standard entries).
- [ ] Add a proration helper function computing `days_remaining = max(1, (datetime.strptime(renew_at, "%b %d, %Y") - datetime.today()).days)`, `daily_delta = (PLANS["Premium"]["price"] - PLANS["Standard"]["price"]) / DAYS_IN_CYCLE`, `prorated_charge = round(daily_delta * days_remaining, 2)`. Both new endpoints (Steps 2 and 3) call this ONE helper — never duplicate the formula (ARCH-02).
- [ ] Add `def charge_card(email: str, amount: float) -> dict` — pure function, `email.startswith("fail")` → `{"status": "card_declined", "message": "Your card was declined."}`, else `{"status": "success"}`. No I/O, no imports beyond what's already in `main.py`.
- [ ] Add `class UpgradeRequest(BaseModel): email: str`.

## Step 2 — Backend: `GET /api/billing/upgrade-preview` (API Layer Generation)
**File**: `src/backend/main.py`
**REQ/AC**: REQ-F-02 (AC-6), REQ-F-09 (AC-7), REQ-F-10 (AC-8), REQ-NF-04

- [ ] `email not in users` → HTTP 401 `{"detail": "Not authenticated"}` (matches the existing `GET /api/billing` pattern).
- [ ] `billing_data[email]["plan_name"] == "Premium"` → HTTP 409 `{"detail": "already_premium"}`.
- [ ] Otherwise: compute via Step 1's helper, return `{"current_plan": "Standard", "new_plan": "Premium", "days_remaining": <int>, "prorated_charge": <float>, "next_renewal_price": 40.00, "renew_at": billing_data[email]["renew_at"]}`.

## Step 3 — Backend: `POST /api/billing/upgrade` (API Layer Generation)
**File**: `src/backend/main.py`
**REQ/AC**: REQ-F-05 (AC-14), REQ-F-06 (AC-18, AC-19), REQ-F-08 (AC-15), REQ-F-09 (AC-16), REQ-F-10 (AC-17), REQ-NF-04

- [ ] `email not in users` → HTTP 401 `{"detail": "Not authenticated"}`.
- [ ] `billing_data[email]["plan_name"] == "Premium"` → HTTP 409 `{"detail": "already_premium"}`, no `charge_card` call, no mutation (ARCH-01 territory — verify no charge happens either).
- [ ] Recompute the prorated charge via Step 1's SAME helper (never trust a client-supplied amount — `UpgradeRequest` has no amount field by design, per architecture.md SEC-02).
- [ ] Call `charge_card(email, prorated_charge)`.
  - **`card_declined`** → HTTP 402 `{"detail": "card_declined", "message": "Your card was declined."}`. 🔴 No assignment to `users[email][...]` or `billing_data[email][...]` may execute before this response is raised (ARCH-03 — verified by a dedicated unit test asserting byte-for-byte-unchanged state).
  - **`success`** → set `users[email]["plan"]="Premium"`, `users[email]["price"]="$40/month"`, `billing_data[email]["plan_name"]="Premium"`, `billing_data[email]["price"]="$40/month"`, replace `billing_data[email]["usages"]` with `PREMIUM_QUOTAS["usages"]`, set `billing_data[email]["on_demand_usage"]["notice"] = "On-demand credit is available on your Premium plan."`. `renew_at` untouched in both dicts. Return `{"status": "success", "plan": "Premium", "charge": <amount>}`.

## Step 4 — Frontend: dynamic plan badge & Upgrade CTA (Frontend Components Generation)
**File**: `src/frontend/src/pages/Billing.jsx`
**REQ/AC**: REQ-F-01 (AC-1..AC-4), REQ-NF-03, REQ-NF-05

- [ ] Replace the hardcoded `<span className="standard-badge">Standard</span>` (line 128) with `<span className="standard-badge">{data.plan_name}</span>`.
- [ ] Add an "Upgrade to Premium" button, rendered only when `data.plan_name === "Standard"`, with `data-testid="billing-upgrade-cta-button"` and stable text (Playwright-automatable, REQ-NF-05).
- [ ] No other markup changes — plan price/Active badge already render from `data` correctly.

## Step 5 — Frontend: upgrade confirmation modal (Frontend Components Generation)
**File**: `src/frontend/src/pages/Billing.jsx`
**REQ/AC**: REQ-F-03 (AC-9..AC-12), REQ-NF-02, REQ-NF-05

- [ ] Add modal state (`useState`) for `{ open, preview, loading, error }`.
- [ ] On CTA click: open the modal, `fetch('/api/billing/upgrade-preview?email=' + encodeURIComponent(token))`, store the response in `preview`.
- [ ] Render (verbatim from `preview`, zero arithmetic — REQ-NF-02/ARCH-01): current plan + price, new plan + price, days remaining, "You will be charged **$X.XX** today", "$40.00/month starting `<renew_at>`".
- [ ] Two actions: "Confirm Upgrade" (`data-testid="billing-upgrade-confirm-button"`) and "Cancel" (`data-testid="billing-upgrade-cancel-button"`) — Cancel closes the modal, no other side effect.

## Step 6 — Frontend: confirm upgrade — success & decline handling (Frontend Components Generation)
**File**: `src/frontend/src/pages/Billing.jsx`
**REQ/AC**: REQ-F-05 frontend half (AC-20..AC-22), REQ-F-06 frontend half (AC-23..AC-25), REQ-NF-02, REQ-NF-05

- [ ] "Confirm Upgrade" → `POST /api/billing/upgrade` with `{"email": token}`.
- [ ] On success (200): re-fetch `GET /api/billing`, close the modal, CTA disappears (plan now Premium), show a success banner `"You're now on Premium! $<charge>.00 was charged."` using the response's `charge` value verbatim.
- [ ] On decline (402): keep the modal open, show inline error `"Payment failed: Your card was declined. Your plan has not changed."`, Cancel remains available.

## Step 7 — Unit Test & Coverage Gate (MANDATORY, Step 11a)
- [ ] Backend: `tests/unit/backend/test_billing_upgrade.py` (pytest) — proration formula (worked example 15 days → $10.00, boundary `days_remaining` clamped to ≥1), `charge_card()` both branches, both endpoints' happy/guard/decline paths, no-mutation assertion on decline.
- [ ] Frontend: `tests/unit/frontend/Billing.test.jsx` (vitest + @testing-library/react) — CTA visibility by plan, modal open/display/cancel, confirm success/decline flows, no-arithmetic assertion (values rendered verbatim from mocked fetch responses).
- [ ] Run both, iterate to `unitTestCoverageMin` (90%) on new/changed code, capture proof artifacts to `reports/unit-test-evidence/story-1.1/`.

## Step 8 — API & Contract Testing Gate (MANDATORY — this story adds 2 endpoints, Step 11a.5)
- [ ] `tests/unit/backend/test_billing_upgrade_api.py` (pytest + FastAPI `TestClient`) covering, for BOTH new endpoints: functional/happy path, response-code validation (200/401/402/409), authorization (401 unauthenticated → N/A for 403, this app has no role concept beyond authenticated/not — state explicitly), error-response schema (`detail`/`message` keys only), request validation (missing/invalid `email`), response contract validation (exact keys/types of the preview and upgrade success responses).
- [ ] Capture proof artifacts to `reports/api-contract-test-evidence/story-1.1/`.

## Step 9 — Full Regression vs Baseline (MANDATORY, Step 11b)
- [ ] Re-run the entire `tests/` suite (Steps 7+8 combined — no pre-existing suite exists, so baseline is empty per Step 1.5 Item 4.5). Diff vs `baseline-regression.log` (recorded as "no test suite at all" — zero pre-existing tests to break).

## Step 10 — Static Eval Gate D1–D7 (MANDATORY, Step 11c)
- [ ] Re-run `tests/.evals/scripts/run-static-evals.sh` scoped to `EVAL_KEY=story-1.1`, diff vs the Step 1.5 Item 4.6 baseline (all N/A/PASS, zero pre-existing findings). Fix any new finding on the changed files.

## Step 11 — Documentation (minor)
- [ ] No API docs generator in this repo; no README update required (the two new endpoints are internal to this SPA and already described in `spec/plans/architecture.md` Section 5).

## Step 12 — Deployment Artifacts
- [ ] N/A — no infrastructure change (architecture.md Section 8/11).

---

## REQ/AC Trace Completeness Self-Check

| REQ-ID | Plan Step(s) |
|---|---|
| REQ-F-01 | Step 4 |
| REQ-F-02 | Step 2 |
| REQ-F-03 | Step 5 |
| REQ-F-04 | Step 1 |
| REQ-F-05 | Step 3, Step 6 |
| REQ-F-06 | Step 3, Step 6 |
| REQ-F-07 | Step 1 |
| REQ-F-08 | Step 3 |
| REQ-F-09 | Step 2, Step 3 |
| REQ-F-10 | Step 2, Step 3 |
| REQ-NF-01 | Step 1 |
| REQ-NF-02 | Step 5, Step 6 |
| REQ-NF-03 | Step 4 |
| REQ-NF-04 | Step 2, Step 3 |
| REQ-NF-05 | Step 4, Step 5, Step 6 |

Every AC-1..AC-25 from `stories.md` maps to at least one step above (Steps 1-6 map 1:1 to the AC groups already organized that way in stories.md). **PASS — no gap.**
