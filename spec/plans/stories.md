EPIC TICKET: Self-Serve Premium Upgrade (Atlas/Helix solution document id 4702; LOCAL tracker — no external URL)

# Stories

## ⚠️ Slicing Note (read before reviewing)

This cycle deliberately contains **ONE story** instead of the recommended 6-story SPIDR-sliced
breakdown. The user explicitly confirmed this override in `spec/spec-generation/story-generation.md`
after being warned it breaks two normally-enforced rules:

- **Parallelism**: `team_size` is fixed at 2, but with a single story only one developer can work on
  this cycle at a time — there is nothing to run in parallel.
- **Step 1.5 sizing ceilings**: this story has 11 acceptance criteria (ceiling: 5) and newly touches
  both the backend (new endpoint) and frontend (CTA, modal, banner, plumbing fix) layers in one story
  (ceiling: one new layer).

Per `common/design-reference-grounding.md` DR-5, the design reference re-consult below still applies in
full despite the single-story scope.

---

## Story 1.1: Self-Serve Premium Upgrade — End-to-End Mid-Cycle Upgrade Flow

**Covers**: REQ-F-01, REQ-F-02, REQ-F-03, REQ-F-04, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-08, REQ-F-09, REQ-F-10, REQ-F-11, REQ-F-12, REQ-F-13, REQ-F-14, REQ-F-15, REQ-NF-01, REQ-NF-02, REQ-NF-03, REQ-NF-06

**Requires**: none (only story in this cycle)

**Persona**: Standard Plan Subscriber (primary), Existing Premium Subscriber (edge case) — see `personas.md`

**Estimate**: L (this story deliberately was not sized down — see the Slicing Note above)

> **As** an active StreamPlex subscriber on the Standard plan,
> **I want** to upgrade to Premium mid-month from the Billing page and see the exact prorated charge before committing,
> **so that** I get advanced features immediately without waiting for my next cycle or double-paying.

### Design reference grounding (DR-5 re-consult)

- Design reference: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (CTA placement top-right of the header row; confirmation modal title/subtitle/stat-panel/bulleted-highlights/button copy; the persistent post-upgrade success banner). See `requirements.md` → Design References Consulted for the two recorded reconciliations (Premium feature values follow the Epic's table, not the mockup's collapsed demo values; colors follow the existing `App.css` teal family, not the mockup's green).
- No design reference covers: the backend endpoint contract, the proration math, or the already-Premium/unknown-user guards — built from `requirements.md` / the Atlas draft story (doc 4703) only.

### Acceptance Criteria

**AC-1 — Billing page plan display becomes dynamic** (Covers: REQ-F-14)
**Given** `Billing.jsx` currently hardcodes the literal string `"Standard"` in both the plan badge and the "What's included with Standard" heading
**When** this story is implemented
**Then** both read `data.plan_name` dynamically, so they render "Premium" once the backend reports a Premium plan, with no other visual change while still on Standard.

**AC-2 — Upgrade CTA visible only for Standard-plan users** (Covers: REQ-F-01, REQ-F-12)
**Given** a user is logged in with a Standard plan
**When** they view the Billing page
**Then** an "Upgrade to Premium" button renders top-right of the "Plan & Billing" header row (next to the H1, per the design reference), styled as a solid button using the existing `App.css` accent color.
**Given** a user's plan is Premium (`data.plan_name === "Premium"`)
**When** they view the Billing page
**Then** the button is not rendered.

**AC-3 — Confirmation modal shows the exact prorated preview before commitment** (Covers: REQ-F-02, REQ-F-03, REQ-F-15)
**Given** a Standard user clicks "Upgrade to Premium"
**When** the modal opens
**Then** it shows: title "Upgrade to Premium"; subtitle "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."; a stat panel with "Remaining days: `{days_remaining}` days" and "Charge today: `{prorated_charge}`" computed client-side as `days_remaining = clamp((renew_at − today).days, 0, 30)` and `prorated_charge = round((40 − 20) × (days_remaining / 30), 2)`; a bulleted list of Premium highlights (4K Ultra HD, 4 simultaneous streams, 6 download devices, Dolby Vision); a primary "Confirm & pay `{prorated_charge}`" button and a secondary "Cancel" button.
**And** the user has NOT been charged or upgraded at this point.

**AC-4 — Cancel does nothing**
**Given** the confirmation modal is open
**When** the user clicks "Cancel" or dismisses the modal
**Then** no API call is made and the Billing page is unchanged.

**AC-5 — Backend applies the upgrade on confirm** (Covers: REQ-F-04, REQ-F-05, REQ-F-08, REQ-NF-01, REQ-NF-02, REQ-NF-03)
**Given** a `POST /api/billing/upgrade` request with `{ "email": "<user_email>" }` for a user currently on Standard
**When** the backend processes it
**Then** it: (1) calculates `days_remaining` from the stored `renew_at` string (`"%b %d, %Y"` format) minus today, clamped to `[0, 30]`; (2) computes `prorated_charge = round((40 - 20) * (days_remaining / 30), 2)`; (3) updates `users[email]["plan"]` to `"Premium"` and `["price"]` to `"$40/month"`; (4) updates `billing_data[email]["usages"]` to `{video-quality: "4K Ultra HD", screens: "Can watch on 4 devices at once", downloads: "Can download on 6 devices"}` and `["included_usage"]["items"]` to add a `dolby-vision` entry (100%) alongside `ad-free` and `spatial-audio`; (5) returns `{plan_name: "Premium", price: "$40/month", renew_at: <unchanged>, prorated_charge: <float>, usages: [...], included_usage: {...}}`.
**And** no external payment SDK/dependency is introduced (`requirements.txt` unchanged); `users`/`billing_data` remain in-memory dicts; the endpoint accepts `email` in the body with no new authentication mechanism, consistent with the existing `GET /api/billing` pattern.

**AC-6 — Already-Premium guard** (Covers: REQ-F-06)
**Given** the user's current plan is already Premium
**When** `POST /api/billing/upgrade` is called
**Then** the backend returns `400 Bad Request` with `{"detail": "Already on Premium plan"}` and makes no mutation.

**AC-7 — Unknown-user guard** (Covers: REQ-F-07)
**Given** the request's `email` is not a key in `users`
**When** `POST /api/billing/upgrade` is called
**Then** the backend returns `401 Unauthorized` with `{"detail": "Not authenticated"}`, consistent with `GET /api/billing` / `GET /api/users/me`.

**AC-8 — Billing page reflects Premium immediately, no reload** (Covers: REQ-F-09)
**Given** the backend responds successfully to the confirm action
**When** the frontend receives the response
**Then** it replaces its local billing state directly from the response payload (no re-fetch of `GET /api/billing`, no page reload) — the plan badge, price, "Renew at" (unchanged), and feature/usage cards update to Premium values immediately, and the Upgrade CTA disappears (per AC-2).

**AC-9 — Persistent post-upgrade success banner** (Covers: REQ-F-13, REQ-NF-06)
**Given** a successful upgrade just completed
**When** the Billing page re-renders
**Then** a bordered success banner appears below the plan/renew grid reading: "Upgraded to Premium — Charged `{prorated_charge}` for the remaining `{days_remaining}` days of this billing cycle. From `{renew_at}` you will be billed $40/month." styled with the existing `App.css` teal accent family (not the design reference's own green), using existing class patterns (`page-card`/`plan-card`-style bordered container) — no new CSS framework or dependency.

**AC-10 — Confirmation modal failure handling** (Covers: REQ-F-10)
**Given** the confirm action's network request fails, or the backend returns a 4xx/5xx
**When** the modal is showing
**Then** it displays an inline error message within the modal and lets the user retry (re-submit) or cancel; the Billing page's existing `GET /api/billing` fetch (which has no `.catch()`) is explicitly left unchanged — this AC only covers the new modal's own failure path.

**AC-11 — No regressions** (Covers: REQ-F-11)
**Given** this story's changes are deployed
**When** a user logs in, registers, or views the Billing page as a Standard-plan user without attempting an upgrade
**Then** all existing flows (Flows 1–6 in `spec/plans/atlas-deep-dive.md`) behave exactly as before — login, registration, session restore, logout, and the route guard are all unaffected, and the Standard-plan billing display renders identically to today except for the new CTA described in AC-2.

### Referenced Paths

- `src/backend/main.py` — new `UpgradeRequest` model, `POST /api/billing/upgrade` endpoint, `calculate_days_remaining` helper, Premium billing/usage data, `users`/`billing_data` mutation
- `src/frontend/src/pages/Billing.jsx` — dynamic plan-name rendering (AC-1), Upgrade CTA (AC-2), confirmation modal (AC-3/AC-4/AC-10), state update on success (AC-8), success banner (AC-9)
- `src/frontend/src/App.css` — styles for the CTA, modal, and success banner, using existing teal accent tokens
- `src/frontend/src/context/AuthContext.jsx` — read-only; provides `token` (email) already used by `Billing.jsx`

---

## Requirements Coverage Matrix

| REQ-ID | Covering Stories | Status |
|---|---|---|
| REQ-F-01 | 1.1 (AC-2) | Full |
| REQ-F-02 | 1.1 (AC-3) | Full |
| REQ-F-03 | 1.1 (AC-3) | Full |
| REQ-F-04 | 1.1 (AC-5) | Full |
| REQ-F-05 | 1.1 (AC-5) | Full |
| REQ-F-06 | 1.1 (AC-6) | Full |
| REQ-F-07 | 1.1 (AC-7) | Full |
| REQ-F-08 | 1.1 (AC-5) | Full |
| REQ-F-09 | 1.1 (AC-8) | Full |
| REQ-F-10 | 1.1 (AC-10) | Full |
| REQ-F-11 | 1.1 (AC-11) | Full |
| REQ-F-12 | 1.1 (AC-2) | Full |
| REQ-F-13 | 1.1 (AC-9) | Full |
| REQ-F-14 | 1.1 (AC-1) | Full |
| REQ-F-15 | 1.1 (AC-3) | Full |
| REQ-NF-01 | 1.1 (AC-5) | Full |
| REQ-NF-02 | 1.1 (AC-5) | Full |
| REQ-NF-03 | 1.1 (AC-5) | Full |
| REQ-NF-04 | — | N/A (Resiliency Baseline extension disabled — no implementation surface) |
| REQ-NF-05 | — | N/A (Property-Based Testing extension disabled — no implementation surface) |
| REQ-NF-06 | 1.1 (AC-9, also implicit in AC-2) | Full |

**Coverage**: 19/19 applicable REQ-IDs fully covered by Story 1.1's acceptance criteria (REQ-NF-04/05 explicitly N/A — disabled extensions, no code affected).
