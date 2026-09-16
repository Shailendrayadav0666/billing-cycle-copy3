# Requirements Clarification Questions — Self-Serve Premium Upgrade

Sourced from `spec/plans/epic-brief.md` (Atlas Epic) and `spec/plans/atlas-deep-dive.md` (Atlas existing-system truth). Please answer every question by filling in the letter choice after the `[Answer]:` tag, or choose the last option and describe your own answer. Let me know when you're done.

## Question 1 — Proration preview mechanism (Epic OQ-1)
Should the prorated-charge preview shown before the user confirms use a `dry_run` query parameter on the same upgrade endpoint, or a separate read-only endpoint?

A) `POST /api/billing/upgrade?dry_run=true` returns the calculated charge without applying the upgrade; the same endpoint without the flag applies it

B) A separate endpoint, e.g. `GET /api/billing/upgrade/preview`, purely for the preview; `POST /api/billing/upgrade` only ever applies the upgrade

C) Compute the proration entirely client-side (plan prices + days-remaining are already known to the frontend) and skip a server round-trip for the preview

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2 — On-demand balance on upgrade (Epic OQ-2)
Does a Standard user's existing on-demand credit balance carry over unchanged after upgrading to Premium, or does it reset to a Premium-plan default?

A) Carries over unchanged — upgrade only changes the plan tier and its limits, balance is untouched

B) Resets to the Premium plan's default on-demand balance at the moment of upgrade

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3 — Security scope for the new endpoint
The Atlas deep dive flags the existing auth model as Critical: the app uses the user's raw email as an auth token (no JWT, no signature, no expiry) and stores/compares passwords in plaintext (`atlas-deep-dive.md` — Top 10 Critical Findings #1–#2). AIRE's Security Baseline extension is always-mandatory and blocking, scoped to the diff this epic produces. How should the new `POST /api/billing/upgrade` endpoint and its supporting code handle this?

A) New endpoint follows the SAME existing auth pattern (email-as-token) for consistency with the rest of this POC codebase — the pre-existing auth mechanism itself is out of scope for this epic and is NOT part of this diff, so it stays as pre-existing debt per the Security Baseline's diff-scoping rules; the new endpoint still enforces proper object-level authorization (the caller can only upgrade their own account) and input validation over that existing mechanism

B) Use this epic as the opportunity to introduce proper token-based auth (JWT) and password hashing across the app, then build the upgrade endpoint on top of it

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4 — Annual billing (Epic OQ-3)
The Epic flags annual billing as "out of scope now, flag for roadmap." Confirm this stays fully out of scope for this cycle (no design consideration needed now)?

A) Yes — fully out of scope, no design accommodation needed in this cycle

B) No — the design should at least avoid actively precluding annual billing later (e.g. don't hardcode monthly-only assumptions where trivially avoidable)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5 — Failure handling on a declined/failed upgrade
Since payment processing is mocked for this POC (per Epic scope), what should "payment declined" look like for this feature?

A) There is no real decline path — since payment is fully mocked, the upgrade always succeeds once confirmed (mocked payment never fails); only genuine application errors (network, 500s, already-Premium 400) are handled

B) Simulate an occasional/deterministic decline path (e.g. a specific test flag or account) so the UI's error state is exercised and testable even though real payment isn't wired up

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
