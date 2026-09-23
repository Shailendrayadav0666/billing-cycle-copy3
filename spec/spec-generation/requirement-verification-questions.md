# Requirements Clarification Questions — Self-Serve Premium Upgrade

Context already gathered from the Epic (`spec/plans/epic-brief.md`), the Atlas Deep Dive
(`spec/plans/atlas-deep-dive.md`), and the rendered design reference prototype
(`spec/context-project/new-references/StreamPlex Billing.html`) is NOT repeated here as a question —
only genuine open decisions are asked below.

## Question 1 — Authorization on the new `POST /api/billing/upgrade` endpoint

The existing system's ONLY auth mechanism is "email as token": `GET /api/billing?email=<token>` and
`GET /api/users/me?email=<token>` trust the `email` query/body parameter with no validation
(Deep Dive: "No Authentication Middleware" / SECURITY-08-relevant finding, pre-existing debt this
Epic does not aim to fix). The new upgrade endpoint is new code, so the AIRE Security Baseline
(SECURITY-08, blocking) requires at least object-level authorization on it.

A) Match the existing pattern exactly — accept `email` as the identifier with no extra validation beyond confirming it corresponds to a record in the in-memory `users`/`billing_data` stores (i.e., reject an unknown email with 404, but otherwise trust it, consistent with the POC's existing security posture — no new auth mechanism introduced) (Recommended)

B) Same as A, but also require the request to include the existing `password` on file as a second factor before applying the upgrade

C) Introduce a minimal bearer-token check (still not real JWT/signing — just reject requests missing an `Authorization` header) in addition to the email check

D) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2 — Defensive validation on the upgrade endpoint

A) Reject the upgrade with a 4xx error and no state change if: the email doesn't match a known user, OR the user's current plan is already "Premium" (idempotent no-op protection against a stale/duplicate confirm) (Recommended)

B) Only validate the email exists; silently allow re-upgrading an already-Premium user (charges another prorated amount)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3 — Double-submit protection on "Confirm & pay"

The prototype's confirm button has no visible loading/disabled state.

A) Disable the "Confirm & pay" button immediately on click (client-side) until the API call resolves, to prevent an accidental double-charge from a double-click; backend also treats the call as idempotent per Question 2's "already Premium" guard as the safety net (Recommended)

B) No client-side protection needed — rely on backend idempotency (Question 2) alone

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4 — Error-state UI when the upgrade call fails

The prototype only shows the happy path (modal → success banner). No error state exists in the mockup.

A) On a failed `POST /api/billing/upgrade` (network error or non-2xx), keep the modal open, show an inline error message inside it (e.g., "Something went wrong — please try again"), re-enable the Confirm button, and do not change the displayed plan (Recommended)

B) Close the modal and show a page-level error banner instead

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5 — Dolby Vision in the UI

The Epic's plan-comparison table lists **Dolby Vision** as a Premium-exclusive feature, but the
rendered prototype's "What's included" cards and the modal's 3-item upgrade-benefits list never
mention it (video quality is shown as "4K + HDR", not "4K + HDR + Dolby Vision").

A) Follow the prototype exactly as rendered — do not add a Dolby Vision UI element; keep Dolby Vision as a Premium plan-data attribute in the backend only (for future use), with no dedicated UI surface in this Epic (Recommended — matches the approved design reference, which is the more concrete/authoritative source for pixel-level UI)

B) Add Dolby Vision as a 4th item in both the "What's included with Premium" cards and the upgrade modal's benefits list, deviating from the prototype to match the Epic's table exactly

C) Other (please describe after [Answer]: tag below)

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
