# Requirements — Self-Serve Premium Upgrade (Epic 4702)

**AIRE Framework**: v1.0
**Depth**: Standard
**Epic**: 4702 "Self-Serve Premium Upgrade" (Atlas, solution 951) — `spec/plans/epic-brief.md`
**Version**: 1.0 — 2026-09-25

---

## 1. Intent Analysis

| Item | Value |
|---|---|
| **User request** | "using aire and helix mcp, fetch the epic and deep dive documents and start the workflow" — build the Epic pulled from Atlas |
| **Request type** | Enhancement (new capability on an existing brownfield feature) |
| **Scope estimate** | Multiple components — backend API (`src/backend/main.py`) and frontend Billing page (`src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`); new test scaffolding |
| **Complexity estimate** | Moderate — small codebase, but a state-changing money calculation with date edge cases and a security-sensitive endpoint |
| **Clarity** | Clear — Epic and linked story carry 7 acceptance criteria; 6 open points resolved via clarifying questions |

**Summary**: Let a logged-in Standard-plan subscriber ($20/mo) upgrade to Premium ($40/mo) from the Billing page mid-cycle. A confirmation dialog shows the server-computed prorated charge for the rest of the cycle; on confirmation the backend switches the plan in the in-memory store and the page updates to Premium without a reload. The renewal date does not change.

---

## 2. Inputs and Grounding

### 2.1 Sources consulted
| Source | Use |
|---|---|
| `spec/plans/epic-brief.md` — Atlas Epic 4702 + linked Story 4703 (verbatim) | Primary definition of WHAT to build, business rules, Premium plan data |
| `spec/plans/atlas-deep-dive.md` — Atlas doc 4699 v31 | Existing-system truth: 4 REST endpoints, in-memory `users` / `billing_data` dicts, email used as the token, no tests, wildcard CORS |
| Current code: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.jsx` | Confirms Atlas: `Billing.jsx` hardcodes the "Standard" badge and the "What's included with Standard" heading; the header in `App.jsx` already matches the prototype |
| `spec/spec-generation/requirement-verification-questions.md` | Answers: Q1 A, Q2 A, Q3 A, Q4 A, Q5 A, Q6 A, Resiliency B, PBT C |

Context Project artifacts consulted: none for existing knowledge (user answered "no").

### 2.2 New References consulted
| # | Path | Type | Extracted |
|---|---|---|---|
| 1 | `spec/context-project/new-references/StreamPlex Billing.html` | UI prototype (bundled single-page export, decoded and read in full: markup, inline styles, component logic) | See 2.3 |

### 2.3 Design references consulted — grounding notes (DR-2)
**Reference #1 governs**: Billing page presentation — CTA placement and label, dialog layout, labels and buttons, post-upgrade confirmation panel, visual styling. It does **not** govern plan data values or pricing rules; those come from the Epic/Story.

What the prototype shows:
- **Header** (unchanged, already in `App.jsx`): "StreamPlex" wordmark, "Billing" nav link active in green, avatar pill with initial and name, Logout.
- **Title row**: "Plan & Billing" / "Manage your plan and payments" on the left; primary green button **"Upgrade to Premium"** top-right, rendered only when the plan is not Premium.
- **Current plan**: "Current plan:" followed by a green badge bound to the **plan name** (dynamic, not the literal "Standard").
- **Cards**: "MONTHLY PLAN" card with "Active" pill and the price; "Renew at" card with the date.
- **Post-upgrade panel** (shown once Premium): green bordered panel, title **"Upgraded to Premium"**, text **"Charged {prorated} for the remaining {days} days of this billing cycle. From {renew_at} you will be billed $40/month."**
- **Features**: heading **"What's included with {planName}"**, subheading "Your plan's streaming features", 3 feature cards (Video quality, Watch at the same time, Download on devices), then the "Plan perks" card with a progress bar per perk.
- **Dialog**: fixed dark translucent overlay (rgba(11,18,32,0.5)), white card max-width 460px, radius 16px. Title **"Upgrade to Premium"**; line **"Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."**; bordered summary box with **"Remaining days" — "{n} days"** and **"Charge today" — "{prorated}"** (bold, larger); bullet list of Premium benefits; buttons **"Confirm & pay {prorated}"** (primary, full width) and **"Cancel"** (secondary outline).
- **Styling**: Manrope font; primary #0d9b74, hover #0a7a5b, badge background #c8f2df / text #0a6a4f, card borders #e6e9ee, radius 10–16px.

### 2.4 Reference vs Epic — differences and resolution (DR-6 / DR-8)
| Point | Prototype | Epic / Story | Followed | Why |
|---|---|---|---|---|
| CTA placement | Top-right of the title row | "below the current plan card" (AC-1) | **Prototype** | The reference governs layout; the Epic's wording is generic |
| Confirm button label | "Confirm & pay $X" | "Confirm Upgrade" (AC-2) | **Prototype** | Reference governs labels |
| Success feedback | Persistent "Upgraded to Premium" panel with charge details | Brief message "You're now on Premium! Your next full cycle bills at $40/month." (AC-5) | **Prototype** | Reference governs post-upgrade UI; the panel carries the same information |
| Current / new plan lines in dialog | Only "Premium is $40/month" | Current plan: Standard ($20/mo); New plan: Premium ($40/mo) (AC-2) | **Both** — the prototype layout plus the two Epic rows in the summary box | The reference is silent on these rows; adding them contradicts nothing |
| Days / charge | Hardcoded 38 days, $25.33, no cap | Derived from `renew_at`, 30-day cycle, capped at $20.00 (AC-3) | **Epic** (recorded reconciliation) | Pricing rules are outside what the reference governs; prototype value is demo data |
| Premium downloads / quality | 4 downloads, "4K + HDR" | 6 downloads, "4K Ultra HD" | **Epic** (recorded reconciliation) | Plan data is outside what the reference governs |
| Premium perks | 2 perks | 3 perks (adds Dolby Vision) | **Epic** (recorded reconciliation) | Same |
| Configurable Premium price | `premiumPrice` prop 20–100 | Fixed $40 | **Excluded** (recorded reconciliation) | Out of scope |

All reconciliations are recorded in `runtime-artifacts/aire-state.md` under `## Design References` → `### Reconciliations`.

---

## 3. Functional Requirements

### Backend (`src/backend/main.py`)

**REQ-F-01 — Premium plan definition.** The backend defines the Premium plan next to the existing Standard data: plan name "Premium", price "$40/month", usages `video-quality` = "4K Ultra HD", `screens` = "Can watch on 4 devices at once", `downloads` = "Can download on 6 devices", and `included_usage` "Plan perks" with Ad-free streaming, Spatial audio (select titles) and Dolby Vision (select titles), each at 100%. It uses exactly the ids, labels and help texts in the Epic's "Premium Plan Feature Data" (epic-brief.md, Appendix).

**REQ-F-02 — Proration calculation.** A single pure function computes the charge:
- `days_remaining = max(0, renew_at − today)` in whole calendar days, where `renew_at` is parsed from the stored `"MMM DD, YYYY"` string (`%b %d, %Y`).
- `billable_days = min(days_remaining, 30)` (fixed 30-day cycle).
- `prorated_charge = round((40 − 20) × billable_days / 30, 2)`.
- Edge cases: renewal today or past → $0.00 and the upgrade still proceeds; 30 or more days → $20.00.
- Example: 15 days → $10.00. With the seeded user (renews Oct 30, 2026) on Sep 25, 2026: 35 calendar days → 30 billable days → $20.00.

**REQ-F-03 — Upgrade preview endpoint (read-only).** `GET /api/billing/upgrade-preview?email=<token>` returns `{ current_plan: "Standard", current_price: "$20/month", new_plan: "Premium", new_price: "$40/month", days_remaining: <billable_days>, days_in_cycle: 30, prorated_charge: <float> }` using REQ-F-02. It changes no state. Unknown user → 401 `{"detail": "Not authenticated"}`; already Premium → 400 `{"detail": "Already on Premium plan"}`. (Q1 A)

**REQ-F-04 — Upgrade endpoint (state-changing).** `POST /api/billing/upgrade` with body `{ "email": "<user_email>" }`:
1. Unknown user → 401 `{"detail": "Not authenticated"}`; already Premium → 400 `{"detail": "Already on Premium plan"}`; neither store changes.
2. Otherwise, recompute the charge server-side with REQ-F-02 (never trust a client-supplied amount).
3. Set `users[email]["plan"] = "Premium"`, `users[email]["price"] = "$40/month"`.
4. Replace `billing_data[email]` plan name, price, usages and included_usage with the Premium definition (REQ-F-01), keeping `renew_at` unchanged.
5. Return the full billing payload (`plan_name`, `price`, `renew_at`, `usages`, `included_usage`) plus `prorated_charge` and `days_remaining`.

**REQ-F-05 — Persisted plan state.** After an upgrade, `GET /api/billing` and `GET /api/users/me` return the Premium state for that user for the life of the backend process (in-memory store, consistent with the POC). Other users are unaffected.

**REQ-F-06 — Renewal date unchanged.** `renew_at` has the same value before and after an upgrade in `users`, `billing_data`, and every API response. (AC-7)

### Frontend (`src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`)

**REQ-F-07 — Plan-driven Billing page.** The "Current plan:" badge and the "What's included with …" heading show `data.plan_name` instead of the hardcoded "Standard". The feature cards and Plan perks card keep rendering from the API payload, so Premium values appear automatically.

**REQ-F-08 — Upgrade CTA.** A primary "Upgrade to Premium" button sits at the right of the "Plan & Billing" title row. It renders only when `data.plan_name === "Standard"` and not for Premium users. (AC-1, reference #1)

**REQ-F-09 — Confirmation dialog.** Clicking the CTA opens a dialog and requests `GET /api/billing/upgrade-preview`. While the preview loads, a loading state shows and Confirm is disabled. The dialog then shows:
- Title "Upgrade to Premium" and the line "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
- A summary box with rows: Current plan — Standard ($20/mo); New plan — Premium ($40/mo); Remaining days — "{days_remaining} days"; Charge today — "${prorated_charge}" (2 decimals).
- A bullet list of Premium benefits taken from the Epic data: 4K Ultra HD video quality; Stream on 4 devices at once; Download on 6 devices; Dolby Vision (select titles).
- Buttons "Confirm & pay ${prorated_charge}" and "Cancel".

No upgrade happens and no state changes until Confirm is pressed. (AC-2) If the preview fails, the dialog shows an inline error and Confirm stays disabled (see REQ-F-12).

**REQ-F-10 — Confirm applies the upgrade without a reload.** Pressing Confirm sends `POST /api/billing/upgrade` with `{ email: token }`. On success the page state is replaced with the response (no full page reload) and the dialog closes. The page then shows Premium, $40/month, the unchanged renewal date, the Premium feature cards and perks, and no CTA. (AC-5)

**REQ-F-11 — Post-upgrade confirmation panel.** After a successful upgrade, a panel below the plan cards shows "Upgraded to Premium" and "Charged ${prorated_charge} for the remaining {days_remaining} days of this billing cycle. From {renew_at} you will be billed $40/month." using the POST response values. It shows for the rest of the page session. After a reload the page shows the Premium state without the panel, because the charge is not stored. (reference #1, replaces AC-5's transient message)

**REQ-F-12 — Failure handling.** If the preview or upgrade request fails (400, 401, network or other error), the dialog stays open and shows an inline error. For the 400, the error uses the backend `detail` text. Confirm is re-enabled (upgrade failure only) and the Billing page data stays unchanged. (Q4 A)

**REQ-F-13 — Cancel does nothing.** Cancel, Escape or clicking the backdrop closes the dialog. No `POST /api/billing/upgrade` is sent and the Billing page stays unchanged. The only call that happens is the read-only preview made when the dialog opened, which does not change state. (AC-6)

**REQ-F-14 — No regressions.** Login, registration and the Standard Billing display behave as before for Standard users. Newly registered users (renewal date today + 30 days) can upgrade and are charged $20.00.

---

## 4. Non-Functional Requirements

**REQ-NF-01 — Single source of pricing math.** Proration is computed only on the backend (REQ-F-02), and the preview and the upgrade call the same function. The frontend only displays values from the API and never computes a charge. (Epic: "the frontend only displays the result"; Q1 A)

**REQ-NF-02 — Accessible dialog.** The dialog has `role="dialog"`, `aria-modal="true"` and is labelled by its title. Focus moves into it on open and returns to the Upgrade button on close. Escape and a backdrop click close it like Cancel. All controls work from the keyboard. Inline errors are announced (`role="alert"`). (Q5 A)

**REQ-NF-03 — Double-submit protection.** While the upgrade request is in flight, "Confirm & pay" is disabled and shows a pending state, so a double click sends at most one POST. The backend's 400 on an already-Premium user is the second line of defence. (Q5 A)

**REQ-NF-04 — Visual fidelity.** The CTA, dialog and confirmation panel match reference #1 (layout, labels, palette #0d9b74 / #0a7a5b / #c8f2df / #0a6a4f, radius, spacing). Styles go in `src/frontend/src/App.css` as class-based rules consistent with the existing stylesheet, not inline styles. The existing header in `App.jsx` needs no change.

**REQ-NF-05 — Security (Security Baseline, mandatory).** Scoped to what this Epic adds:
- Input validation (SECURITY-05): the upgrade request body is an explicit Pydantic model with a single `email` field (format and length validated). Extra fields are rejected or ignored, never bound to the store (mass-assignment protection, SECURITY-08).
- No client-supplied amount, plan or price is ever accepted. The server decides everything (SECURITY-11).
- Safe errors (SECURITY-15): 400/401 bodies carry only `detail`; unexpected exceptions return a generic 500 without stack traces.
- Logging (SECURITY-03): each upgrade attempt and outcome is logged (user identifier, result, charge), never a password.
- No new runtime dependencies; test-only dependencies are pinned (SECURITY-10).
- **Accepted pre-existing risk (Q3 A)**: the new endpoints identify the user by the email "token", like every existing endpoint (Atlas deep dive critical findings 1 and 3). Changing the auth model is out of scope for this Epic. Wildcard CORS (finding 7) is also pre-existing and out of scope.

> ⚠ **Known conflict with a blocking gate.** The Security Baseline cannot be switched off, and SECURITY-08 requires server-side token validation and object-level authorization on every endpoint that changes data. Under Q3 A, anyone who knows a user's email can upgrade that user. The diff-scoped Security Baseline review at Code Review will likely report this as a **blocking** SECURITY-08 finding on the new `POST /api/billing/upgrade`. To avoid that, change Q3 to **B** (require the token in an `Authorization: Bearer` header and reject requests without it) via Request Changes. Even B reuses the email token and does not fully satisfy SECURITY-08, but it is the smallest step toward it. Only C fully satisfies it.

**REQ-NF-06 — Architecture constraints.** No database, no payment provider or SDK, no new runtime packages in `requirements.txt` or `package.json`. The in-memory store and the FastAPI + React/Vite two-tier architecture stay as they are (Epic scope).

**REQ-NF-07 — Testability and test stack.** (Q6 A)
- Backend: pytest + FastAPI TestClient; pytest-bdd step definitions for the Gherkin contracts.
- Frontend: Vitest + React Testing Library for the Billing page and dialog states.
- E2E: Playwright (mandatory extension) for the upgrade journey.
- "Today" is injectable or overridable in the proration function, so date-dependent tests are deterministic. Required proration cases: 0 days, a past date, 15 days ($10.00), 29 days ($19.33), 30 days ($20.00), 35 days ($20.00 cap).

**REQ-NF-08 — Performance.** Preview and upgrade are O(1) in-memory operations. No specific latency target beyond the existing endpoints.

---

## 5. Out of Scope (confirmed by the Epic)
Downgrades · refunds or credits · payment verification or decline flows · external payment processors · plans other than Standard and Premium · persistent storage or database migration · changes to the authentication model and CORS policy (Q3 A) · configurable Premium price (reference #1 reconciliation) · resiliency baseline and property-based testing (declined).

---

## 6. Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes (mandatory) | Workflow start |
| Playwright Test Automation | Yes (mandatory) | Workflow start |
| Resiliency Baseline | No | Requirements Analysis |
| Property-Based Testing | No | Requirements Analysis |

---

## 7. Traceability — Epic / Story acceptance criteria to requirements
| Atlas AC | Requirements |
|---|---|
| AC-1 CTA for Standard only | REQ-F-07, REQ-F-08 |
| AC-2 Confirmation shows prorated amount before commitment | REQ-F-03, REQ-F-09, REQ-NF-01 |
| AC-3 Proration math | REQ-F-02, REQ-NF-07 |
| AC-4 Backend upgrade endpoint | REQ-F-01, REQ-F-04, REQ-F-05, REQ-NF-05 |
| AC-5 Page reflects Premium immediately | REQ-F-10, REQ-F-11 |
| AC-6 Cancel does nothing | REQ-F-13 |
| AC-7 Renewal date unchanged | REQ-F-06 |
| Epic DoD "No regressions" | REQ-F-14 |
| Clarifying answers Q4, Q5 | REQ-F-12, REQ-NF-02, REQ-NF-03 |
