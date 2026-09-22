# Requirements: Self-Serve Premium Upgrade

## Intent Analysis Summary

- **User Request**: "using aire and helix mcp, fetch the epic and deep dive documents and start the workflow" — resolved via Helix MCP to Atlas Epic *Self-Serve Premium Upgrade* (`spec/plans/epic-brief.md`)
- **Request Type**: New Feature
- **Scope Estimate**: Multiple Components (backend endpoint + frontend UI + proration logic)
- **Complexity Estimate**: Moderate
- **Depth**: Standard

## Grounding

- `spec/plans/epic-brief.md` — Atlas Epic (doc 4702), primary source of WHAT to build
- `spec/plans/atlas-deep-dive.md` — Atlas deep dive (doc 4699), existing-system truth (architecture, Flow 4: Billing Dashboard Load, Security Considerations)
- Direct read of `src/backend/main.py` (current `users`, `billing_data`, `GET /api/billing`, `GET /api/users/me`, auth endpoints)
- `spec/spec-generation/requirement-verification-questions.md` — 9 answered clarifying questions (7 scoped + 2 extension opt-ins), all Recommended options, no contradictions

## Functional Requirements

| ID | Requirement |
|---|---|
| REQ-F-01 | Display an "Upgrade to Premium" CTA on the Billing page (`src/frontend/src/pages/Billing.jsx`) for users currently on the Standard plan. |
| REQ-F-02 | On CTA click, show a confirmation modal that computes and displays the exact prorated charge before any commitment. `days_remaining = clamp((renew_at − today).days, 0, 30)`; `days_in_cycle = 30` (fixed — no cycle-start date is stored anywhere in the backend). |
| REQ-F-03 | The confirmation modal shows a side-by-side comparison of Standard vs. Premium plan features (video quality, simultaneous streams, downloads, spatial audio, ad-free streaming, Dolby Vision) and the computed prorated charge, with Confirm and Cancel actions. |
| REQ-F-04 | Add a `POST /api/billing/upgrade` backend endpoint accepting `{email}` in the request body — following the existing app's email-as-identifier convention (consistent with `GET /api/billing` / `GET /api/users/me`); no new auth mechanism is introduced. |
| REQ-F-05 | On confirm, the backend computes proration server-side: `prorated_charge = round((premium_price − standard_price) × (days_remaining / days_in_cycle), 2)` (standard rounding to the nearest cent), updates the user's plan to Premium in the `users` and `billing_data` in-memory stores, and returns the full updated billing object in the same shape as `GET /api/billing` (`plan_name, price, renew_at, usages[], included_usage`) plus a `prorated_charge` field. `renew_at` is unchanged — the next full cycle bills at $40/month. |
| REQ-F-06 | If the user's current plan is already Premium, the endpoint returns `400 Bad Request` with `detail: "Already on Premium plan"` and performs no mutation. |
| REQ-F-07 | If the email is not found in `users`, the endpoint returns `401 Unauthorized` with `detail: "Not authenticated"`, consistent with the existing `GET /api/billing` / `GET /api/users/me` behavior. |
| REQ-F-08 | Premium plan data maps 1:1 onto the existing `usages` / `included_usage` schema: `video-quality` → `"4K Ultra HD"`, `screens` → `"Can watch on 4 devices at once"`, `downloads` → `"Can download on 6 devices"`; `included_usage.items` gains a `dolby-vision` entry (100%) alongside the existing `ad-free` and `spatial-audio` entries. Field labels/help text otherwise follow the existing Standard-plan wording pattern. |
| REQ-F-09 | On a successful upgrade response, the frontend replaces its local billing state directly from the response payload — no re-fetch of `GET /api/billing`, no page reload. The Billing page immediately re-renders with the Premium plan name, price (`$40/month`), and updated feature/usage cards. |
| REQ-F-10 | On upgrade failure (network error, or a 4xx/5xx response from the endpoint), the confirmation modal shows an inline error message and lets the user retry or cancel. This error handling is scoped to the new modal only. |
| REQ-F-11 | No regressions to the existing login, registration, or billing-display flows — all existing endpoints and components continue to behave exactly as documented in `spec/plans/atlas-deep-dive.md` (Flows 1–6). |
| REQ-F-12 | The Upgrade CTA renders top-right of the "Plan & Billing" header row (next to the H1, not inside the plan-details grid), and is shown only while the user is NOT already on Premium — it disappears once upgraded (grounded in the design reference; see Design References Consulted below). |
| REQ-F-13 | After a successful upgrade, the Billing page shows a persistent success banner (bordered card, distinct from the confirmation modal) reading: `"Upgraded to Premium — Charged {prorated_charge} for the remaining {days_remaining} days of this billing cycle. From {renew_at} you will be billed $40/month."` This is a NEW capability the confirmation modal alone does not cover — the Epic only specified an immediate plan-state flip; the design reference additionally shows a standing confirmation on the page itself. |
| REQ-F-14 | `Billing.jsx`'s current plan-name badge and the "What's included with Standard" section heading are presently **hardcoded** to the literal string `"Standard"` rather than reading `data.plan_name` — both must become dynamic so the page can render "Premium" post-upgrade (required for REQ-F-09/REQ-F-13 to have any effect; not a mockup capability, a plumbing fix on a file already in scope). |
| REQ-F-15 | Confirmation modal structure and copy (grounded in the design reference): title "Upgrade to Premium"; subtitle "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."; a bordered stat panel showing "Remaining days: `{days_remaining}` days" and "Charge today: `{prorated_charge}`"; a bulleted list of the Premium highlights (values per REQ-F-08's authoritative table — see reconciliation below, NOT the reference's collapsed values); primary button "Confirm & pay `{prorated_charge}`"; secondary outlined "Cancel" button. |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| REQ-NF-01 | The new endpoint and proration math introduce zero external dependencies — no external payment provider, no SDK (per Epic Scope). |
| REQ-NF-02 | Persistence remains in-memory (`users`, `billing_data` module-level dicts) — no database is introduced, consistent with the existing POC architecture. |
| REQ-NF-03 | The new endpoint follows the existing (unauthenticated, email-as-identifier) security posture already documented in `spec/plans/atlas-deep-dive.md` Security Considerations. This is a known, pre-existing, already-documented risk; this epic does not remediate app-wide authentication/authorization design. The diff-scoped Security Baseline review (`agents/code-security-review-agent.md` Phase 2.5) applies to the new code surface on its own terms, not as a mandate to fix pre-existing, untouched patterns. |
| REQ-NF-04 | Resiliency Baseline extension: **disabled** for this cycle (user opted out — POC/prototype scope). |
| REQ-NF-05 | Property-Based Testing extension: **disabled** for this cycle (user opted out — limited algorithmic complexity beyond the proration formula; a simple mutation over an in-memory dict). |
| REQ-NF-06 | UI styling for the new CTA, modal, success banner, and comparison table follows the existing `src/frontend/src/App.css` design language (existing teal accent family — `#0d9488` / `#0f766e` / `#2dd4bf`, existing `page-card`/`plan-card`/`badge` class patterns) — no new UI component library or dependency is introduced. See Design References Consulted: the reference's own palette (`#0d9b74` family) is NOT used, since it does not match anything already in the codebase. |

## Extensions

| Extension | Status |
|---|---|
| Security Baseline | Always mandatory — enforced |
| Playwright Test Automation | Always mandatory — enforced |
| Resiliency Baseline | Disabled (user opt-out) |
| Property-Based Testing | Disabled (user opt-out) |

## Out of Scope (from Epic, unchanged)

- Downgrades (Premium → Standard)
- Refunds or credits
- Payment verification or decline handling
- Enterprise billing or multi-tier plans beyond Standard and Premium
- External payment processors (Stripe, PayPal, etc.)
- Persistent storage / database migration
- Fixing the existing `GET /api/billing` silent-failure bug (Flow 4 issue, pre-existing, untouched by this epic)
- Broader authentication/authorization remediation (pre-existing, untouched by this epic)

## Design References Consulted

**Reference 1**: `spec/context-project/new-references/StreamPlex Billing.html` — a self-contained bundled/exported UI prototype (the real markup is a JSON-encoded payload inside a `<script type="__bundler/template">` tag; decoded via a scratch script rather than reading the raw bundler-loader bytes). Governs: the Billing page Upgrade CTA, a post-upgrade success banner, and the confirmation modal.

**What was extracted (DR-2)**:
- Exact DOM structure, inline styles, copy text, and interaction wiring (`sc-camel-on-click` handlers for `openUpgrade` / `confirmUpgrade` / `closeModal`) for: the CTA button, the confirmation modal (title, subtitle, stat panel, bulleted highlights, primary/secondary buttons), and a persistent post-upgrade success banner.
- A mock `Component`/`renderVals()` script showing the prototype's OWN placeholder proration math and premium feature values (hardcoded `days=38`, `current=$20`, `monthly=40`, video quality collapsed to `"4K + HDR"`, a single `devices=4` value reused for both streams and downloads, no Dolby Vision row).

**New capabilities folded in (REQ-F-12, REQ-F-13, REQ-F-15)**: the CTA's exact placement, the confirmation modal's exact copy/structure, and — genuinely new versus the Epic text — a persistent on-page success banner after upgrade (REQ-F-13). The Epic was silent on this banner; per DR-8 the reference wins here, so it was added.

**Reconciliations recorded against this reference** (full detail in `runtime-artifacts/aire-state.md` `## Design References` → `### Reconciliations`):
1. **Premium feature values**: the reference's collapsed demo values (`"4K + HDR"`, one shared `devices=4` for both streams and downloads, no Dolby Vision) are EXCLUDED. REQ-F-08's Epic-sourced table (4K Ultra HD / 4 streams / 6 downloads / Dolby Vision as a distinct perk) governs instead — the Epic is the reference's own product source and was already a deliberate, detailed decision recorded in this document before the reference arrived.
2. **Color palette**: the reference's `#0d9b74`/`#0a7a5b`/`#c8f2df` green family is EXCLUDED in favor of the existing `App.css` teal family (`#0d9488`/`#0f766e`/`#2dd4bf`), per REQ-NF-06 — the reference's hex values do not appear anywhere in the current codebase, so introducing them would add a second, competing accent color.

## Context Project Artifacts Consulted

- **Existing knowledge**: None — user opted out.
- **New references**: `spec/context-project/new-references/StreamPlex Billing.html` — see Design References Consulted above (the user updated their initial "no" answer to Yes after adding this file; `## Context Project` in `runtime-artifacts/aire-state.md` was updated accordingly).
