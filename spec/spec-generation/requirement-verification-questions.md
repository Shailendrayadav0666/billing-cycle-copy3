# Requirement Verification Questions — Self-Serve Premium Upgrade

**Grounding**: `spec/plans/epic-brief.md` (Atlas Epic, doc 4702) + `spec/plans/atlas-deep-dive.md` (Atlas deep dive, doc 4699) + direct read of `src/backend/main.py`.

The Epic is already detailed (proration formula, affected files, DoD). The questions below target the
gaps the deep dive and the backend source revealed that the Epic does not resolve.

---

## Question 1: How is `days_in_cycle` computed?

The backend stores only `renew_at` (a formatted string like `"Oct 30, 2026"`, the *next* renewal date)
— there is no stored cycle-start date. The Epic's formula needs `days_remaining` and `days_in_cycle`,
but `days_in_cycle` isn't derivable from any existing field without an assumption.

A) Fixed 30-day cycle always (`days_in_cycle = 30`); `days_remaining = (renew_at − today).days`, clamped to `[0, 30]` (Recommended — matches the Epic's own worked example)
B) Derive the cycle length from `renew_at` minus a stored cycle-start date — requires adding a new `cycle_started_at` field to the user/billing record
C) Something else (describe)

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 2: Proration rounding

The formula `($40 − $20) × (15 / 30) = $10.00` divides evenly in the example, but real dates will
produce fractional cents.

A) Round to 2 decimal places (nearest cent), standard rounding (Recommended)
B) Round up to the nearest cent (never undercharge)
C) Truncate to 2 decimal places (never round up)

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 3: Authentication pattern for the new endpoint

The deep dive flags the app's whole auth model as insecure (email passed as an unvalidated query/body
param, no real token, no ownership check) on the two existing protected endpoints
(`GET /api/users/me`, `GET /api/billing`). The Epic's Out of Scope list doesn't mention fixing auth.

A) Follow the existing convention exactly — accept `email` in the request body of `POST /api/billing/upgrade`, look it up in `users`/`billing_data`, no new auth mechanism (Recommended — consistent with the rest of the POC; a real auth overhaul is a separate initiative)
B) Add a minimal ownership check beyond the existing pattern (describe what you want)

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 4: Idempotency / already-Premium / concurrent upgrade calls

Nothing in the Epic says what happens if: the user is already on Premium and calls upgrade again, or
double-clicks the confirm button before the UI updates.

A) Return `400 Bad Request` with a clear error (`"Already on Premium plan"`) if the user's current plan is already Premium; treat each call as a fresh charge otherwise — no additional idempotency key (Recommended for this POC scope)
B) Add an idempotency key / debounce mechanism (describe)

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 5: Response shape of `POST /api/billing/upgrade`

`GET /api/billing` returns `{plan_name, price, renew_at, usages[], included_usage}`. The Epic says the
Billing page must reflect the new plan "without a page reload" after confirmation.

A) The upgrade endpoint returns the full updated billing object in the exact same shape as
   `GET /api/billing`, plus a `prorated_charge` field — the frontend replaces its local billing state
   directly from the response, no re-fetch needed (Recommended)
B) The upgrade endpoint returns only a success flag + prorated_charge; the frontend re-fetches
   `GET /api/billing` afterward to refresh state

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 6: Mapping the Premium feature table into the existing `usages` / `included_usage` schema

The Epic's Premium Plan Definition table (video quality, streams, downloads, spatial audio, ad-free,
Dolby Vision) needs to become `billing_data[email]["usages"]` and `["included_usage"]` entries in the
same shape Standard already uses (see `src/backend/main.py` lines 31–67).

A) Map 1:1 onto the existing Standard shape: `usages` = [video-quality: "4K Ultra HD", screens: "Can
   watch on 4 devices at once", downloads: "Can download on 6 devices"]; `included_usage.items` adds a
   `dolby-vision` entry alongside `ad-free` and `spatial-audio` (Recommended — preserves the existing
   frontend rendering logic with no shape changes)
B) Redesign the schema to add a `resolution`/`tier` field type instead of reusing `usages` (describe)

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question 7: Confirmation modal UX and failure handling

The Epic requires "a confirmation step showing the exact prorated charge before commitment" but
doesn't specify the modal's failure path. Note: the deep dive flags that the *existing* `GET
/api/billing` fetch has no `.catch()` (perpetual loading on failure) — Out of Scope doesn't mention
fixing this.

A) Confirmation modal shows plan comparison + prorated charge + Confirm/Cancel buttons. On confirm,
   call the upgrade endpoint; on failure (network/4xx/5xx), show an inline error message in the modal
   and let the user retry or cancel — this is new error handling scoped to the new modal only, the
   existing `GET /api/billing` fetch is left as-is (Recommended)
B) Same UX, but also fix the existing `GET /api/billing` silent-failure bug while touching this file
C) No error handling for the new modal either — mirror the existing app's lack of error handling exactly

X) Other (please describe after [Answer]: tag below)

[Answer]:a

---

## Question: Resiliency Extensions

Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]:b

---

## Question: Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]:c

---
