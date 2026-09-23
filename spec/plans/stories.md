EPIC TICKET: EPIC-LOCAL-1 — Self-Serve Premium Upgrade (LOCAL tracker; Epic content sourced from Atlas via Helix MCP, document_id 4702 — no external tracker URL)

# User Stories — Self-Serve Premium Upgrade

Story order reflects the user's explicit steering decision (Requirements Analysis / User Stories Step 12): Story 1.1 is frontend-only scope so it is buildable and demoable first, independent of the backend endpoint.

---

## Story 1.1 — Upgrade CTA & Confirmation Modal (Frontend)

**As** an active Standard-plan subscriber viewing the Billing page,
**I want** to see an "Upgrade to Premium" option and a clear confirmation of what I'll be charged today,
**so that** I can decide with full information before committing to an upgrade.

**Covers**: REQ-F-01, REQ-F-02, REQ-F-09, REQ-F-11, REQ-NF-05

**Scope**: Frontend only — `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`. No backend changes. The modal's displayed preview (remaining days, prorated charge) is computed client-side from data already loaded on the page (current plan price, Premium price, `renew_at`), using the same formula the backend will use authoritatively at confirm time (Story 1.2).

**Acceptance Criteria**:
1. **AC-1**: Given a user on the Standard plan viewing the Billing page, an "Upgrade to Premium" button is visible, positioned top-right of the "Plan & Billing" heading (matching the design reference).
2. **AC-2**: Given the user clicks "Upgrade to Premium", a modal opens titled "Upgrade to Premium" showing: the body copy "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.", a "Remaining days" value, and a "Charge today" value computed as `(40 - 20) × (days_remaining / days_in_cycle)`, rounded to 2 decimals.
3. **AC-3**: The modal lists exactly 3 benefit bullets — "Stream on 4 devices at once", "Download on 4 devices", "4K + HDR video quality" — and no others (specifically, no Dolby Vision bullet, per the approved design reference over the Epic's comparison table).
4. **AC-4**: The modal shows a primary button labeled "Confirm & pay $X.XX" (X.XX = the computed prorated charge, interpolated into the label itself) and a secondary "Cancel" button; clicking "Cancel" closes the modal with no state change.
5. **AC-5**: Clicking "Confirm & pay $X.XX" immediately disables that button (and visually indicates a pending state) so a second click cannot submit a duplicate request while the request is in flight.

**Design reference grounding**: `spec/context-project/new-references/StreamPlex Billing.html` — see `## Design References` extraction in `runtime-artifacts/aire-state.md`. Copy, layout, and button labels above are taken verbatim from the rendered prototype.

**Requires**: none — immediately startable (uses a client-computed preview and can stub/mock the submit call; R3 Mock rule — real wiring is verified by Stories 1.3/1.4)

---

## Story 1.2 — Prorated Upgrade Endpoint (Backend)

**As** the billing system,
**I want** a server-side endpoint that authoritatively validates and applies a Standard→Premium upgrade with a correctly computed prorated charge,
**so that** the charge and plan change are always computed and applied consistently, regardless of what the client displayed.

**Covers**: REQ-F-03, REQ-F-04, REQ-F-06, REQ-F-07, REQ-F-08, REQ-NF-01, REQ-NF-02, REQ-NF-03, REQ-NF-04, REQ-NF-06

**Scope**: Backend only — `src/backend/main.py`. No frontend changes.

**Acceptance Criteria**:
1. **AC-1**: Given a Standard-plan user identified by a valid, known `email`, when `POST /api/billing/upgrade` is called, then: the prorated charge is computed server-side as `(premium_price - standard_price) × (days_remaining / days_in_cycle)` rounded to 2 decimals; the user's plan becomes "Premium" at $40/month; `renew_at` is unchanged; the response returns the new plan state and the charge applied.
2. **AC-2**: Given an `email` that does not match any known user record, when `POST /api/billing/upgrade` is called, then the response is a 404-class error and no user/billing record is modified (Question 1 — matches the existing email-as-token pattern's identification approach, with an explicit existence check this endpoint adds).
3. **AC-3**: Given a user whose current plan is already "Premium", when `POST /api/billing/upgrade` is called, then the response is a 4xx-class error and no state changes (idempotent no-op — Question 2).
4. **AC-4**: The prorated-charge calculation is implemented as an isolated, pure function taking `(standard_price, premium_price, days_remaining, days_in_cycle)` as arguments, independently unit-testable without the HTTP layer.
5. **AC-5**: The existing endpoints (`GET /api/billing`, `GET /api/users/me`, `POST /api/auth/login`, `POST /api/auth/register`) continue to behave exactly as before this endpoint is added (no regression).

**Requires**: none — immediately startable, fully independent of the frontend

---

## Story 1.3 — Successful Upgrade — Immediate Plan Update (Frontend)

**As** an active subscriber who just confirmed an upgrade,
**I want** to see my new Premium plan reflected immediately,
**so that** I have clear confirmation the upgrade took effect without needing to reload or wait.

**Covers**: REQ-F-05, REQ-F-06, REQ-F-11, REQ-NF-05

**Scope**: Frontend only — `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`. Wires Story 1.1's modal to a successful `POST /api/billing/upgrade` response from Story 1.2.

**Acceptance Criteria**:
1. **AC-1**: Given the upgrade request succeeds, the modal closes, the "Current plan" pill updates to "Premium", and the plan card updates to "$40/month" — with no page reload.
2. **AC-2**: A success banner appears with the heading "Upgraded to Premium" and body text "Charged $X.XX for the remaining N days of this billing cycle. From \<renew_at\> you will be billed $40/month.", using the exact values returned by the backend response (not recomputed client-side).
3. **AC-3**: The "What's included" section re-labels to "with Premium" and its 3 feature cards update to the Premium values (Video quality → "4K + HDR"; Watch at the same time → "Can watch on 4 devices at once"; Download on devices → "Can download on 4 devices") — with no Dolby Vision card or element added (consistent with Story 1.1 AC-3 and REQ-F-11).
4. **AC-4**: The "Upgrade to Premium" CTA is no longer rendered once the plan is Premium.

**Requires**: 1.1, 1.2 — needs the real modal (1.1) to attach success behavior to, and the real endpoint (1.2) to exist so AC-2's values come from an actual backend response, not a guess at its shape

---

## Story 1.4 — Upgrade Failure Handling (Frontend)

**As** an active subscriber attempting to upgrade,
**I want** a clear, recoverable error if the upgrade request fails,
**so that** I'm not left confused about whether I was charged or what to do next.

**Covers**: REQ-F-10, REQ-NF-05

**Scope**: Frontend only — `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`. Wires Story 1.1's modal to a failed `POST /api/billing/upgrade` response (network error or non-2xx) from Story 1.2.

**Acceptance Criteria**:
1. **AC-1**: Given the `POST /api/billing/upgrade` call fails (network error or non-2xx response), the modal remains open — it does not close.
2. **AC-2**: An inline error message is shown inside the modal (e.g., "Something went wrong — please try again").
3. **AC-3**: The "Confirm & pay $X.XX" button is re-enabled so the user can retry.
4. **AC-4**: No plan, price, or UI state outside the modal changes — the page still shows the pre-upgrade Standard state.

**Requires**: 1.1 — needs the real modal to attach the failure-handling behavior to; the backend (1.2) is NOT required since a failed request can be simulated/mocked (network error or any non-2xx) without depending on the real endpoint's specific validation logic (R3 Mock rule)

---

## Requirements Coverage Matrix

| REQ-ID | Covering Stories | Status |
|---|---|---|
| REQ-F-01 | 1.1 | Full |
| REQ-F-02 | 1.1 | Full |
| REQ-F-03 | 1.2 (authoritative), 1.1 (client preview, same formula) | Full |
| REQ-F-04 | 1.2 | Full |
| REQ-F-05 | 1.3 | Full |
| REQ-F-06 | 1.2 (unchanged renew_at), 1.3 (display) | Full |
| REQ-F-07 | 1.2 | Full |
| REQ-F-08 | 1.2 | Full |
| REQ-F-09 | 1.1 | Full |
| REQ-F-10 | 1.4 | Full |
| REQ-F-11 | 1.1, 1.3 | Full |
| REQ-F-12 | — | Out of scope (scope-boundary statement, not a capability to build — verified by absence; no downgrade/refund/persistent-storage code is introduced by any story above) |
| REQ-NF-01 | 1.2 | Full |
| REQ-NF-02 | 1.2 | Full |
| REQ-NF-03 | 1.2 | Full |
| REQ-NF-04 | 1.2 | Full |
| REQ-NF-05 | 1.1, 1.3, 1.4 | Full |
| REQ-NF-06 | 1.2 | Full |

**Coverage summary**: 17/17 buildable REQ-IDs fully covered by story ACs; 1 REQ-ID (REQ-F-12) is an explicit scope-exclusion statement with no corresponding capability, recorded as Out of Scope rather than forced into a story.
