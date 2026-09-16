# Personas — Self-Serve Premium Upgrade

## Standard Subscriber (primary)

- **Role**: A logged-in user of the Billing-Cycle app on the **Standard** plan ($20/month — 2,000 chat
  credits, 3 chatbots, 1,000 document pages).
- **Goal**: Upgrade to **Premium** the moment they hit a usage limit, without contacting support or
  leaving the Billing page.
- **Motivation**: Avoid the friction the Epic identifies — today the Billing page tells them on-demand
  credit is unavailable on their plan but offers no way out, creating churn risk.
- **Key interactions**: Views the Billing page, sees the "Upgrade to Premium" CTA, clicks it, reviews
  the prorated charge in the confirmation panel, confirms, and expects to see the Premium plan badge and
  new limits reflected immediately.
- **Pain points this feature addresses**: No self-serve path today; must otherwise file a support
  ticket for something that should take under 60 seconds.

## System state, not a separate persona: "already on Premium"

Per the answered story-generation.md Question 2 (Answer: A), a caller who is already on the Premium
plan is modeled as a **system state** the backend's idempotency guard clause handles (REQ-F-05), not as
a distinct persona — they are still the same Standard-Subscriber-shaped actor, just observed after a
successful upgrade or via direct API call. The CTA is simply not shown to them in the UI (REQ-F-01), and
a direct API call in this state returns `400`.
