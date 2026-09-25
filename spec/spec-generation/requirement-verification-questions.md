# Requirements Clarification Questions

**Epic**: 4702 — Self-Serve Premium Upgrade (Atlas, solution 951)
**Inputs read**: `spec/plans/epic-brief.md` (Epic 4702 + linked Story 4703), `spec/plans/atlas-deep-dive.md`, design reference `spec/context-project/new-references/StreamPlex Billing.html`, current `src/backend/main.py` and `src/frontend/src/pages/Billing.jsx`

The Epic and linked story are detailed, so these questions cover only points that are open, internally inconsistent, or that the security baseline forces a decision on. Fill in each `[Answer]:` tag with a letter (or `X` plus a description).

---

## Question 1
How should the confirmation modal get the prorated amount it displays before the user commits?

The Epic says "Proration is calculated on the backend; the frontend only displays the result", but the linked story also allows computing it client-side from `renew_at`.

A) New read-only backend endpoint `GET /api/billing/upgrade-preview` returns days remaining and the prorated charge; the modal displays it, and `POST /api/billing/upgrade` recomputes the same value server-side (single source of math, Recommended)

B) Compute days remaining and the charge in the browser for display only; the backend recomputes independently on confirm

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2
The seeded user renews on Oct 30, 2026, which is 35 days from today — longer than the fixed 30-day cycle. The Epic caps the charge at $20.00 when days remaining is 30 or more. What should the modal and confirmation show as "Remaining days" in that case?

A) Show the capped value used in the math (30 days, charge $20.00) so the numbers shown always reproduce the charge (Recommended)

B) Show the true calendar days (35 days) alongside the capped charge of $20.00

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
The upgrade endpoint changes billing state, but the existing system identifies the user only by their email, passed as the "token" (Atlas deep dive critical findings 1 and 3). The Security Baseline extension is mandatory and blocking. How should `POST /api/billing/upgrade` identify the user?

A) Follow the existing POC pattern (email in the request, as the Epic specifies), and record the email-as-token weakness as an accepted, pre-existing risk that is out of scope for this Epic (Recommended for the POC; keeps login/registration untouched)

B) Keep the POC token, but require it in an `Authorization: Bearer <token>` header instead of the body, reject requests without it (401), and never trust an email in the body

C) Replace the email token with signed, expiring tokens (for example JWT) for all endpoints — expands scope to login, registration and every existing call

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4
What should happen when the upgrade request fails (for example, the 400 "Already on Premium plan" response, a 401, or a network error)?

A) Keep the modal open, show an inline error message inside it, re-enable the Confirm button, and leave the Billing page unchanged (Recommended)

B) Close the modal and show an error banner on the Billing page

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5
How should the confirm action guard against double submission and support keyboard/screen-reader users?

The prototype shows only the Cancel button for closing; the Epic's AC-6 also mentions "closes the modal".

A) Disable "Confirm & pay" and show a pending state while the request is in flight; the modal is a proper accessible dialog (focus moves into it, Escape and clicking the backdrop close it as Cancel does, focus returns to the Upgrade button) (Recommended)

B) Disable "Confirm & pay" while in flight; only the Cancel button closes the modal (exactly as the prototype shows)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 6
The repo has no test framework at all (Atlas deep dive finding 5). Playwright E2E is mandatory. Which unit/behaviour test stack should be added?

A) Backend: pytest + FastAPI TestClient (with pytest-bdd for the Gherkin step definitions); Frontend: Vitest + React Testing Library; E2E: Playwright (Recommended — idiomatic for FastAPI and Vite)

B) Backend only (pytest + pytest-bdd) plus Playwright E2E; no frontend unit tests

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: c
