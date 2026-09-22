# Personas — Self-Serve Premium Upgrade

## Persona 1: Standard Plan Subscriber (Primary)

- **Name/example**: TPG (existing seeded user, `tpg@example.com`)
- **Role**: An active StreamPlex subscriber on the Standard plan ($20/mo)
- **Goal**: Upgrade to Premium mid-cycle to get 4K Ultra HD, more simultaneous streams/downloads, and Dolby Vision, without waiting for the next billing cycle or double-paying.
- **Motivation**: Wants advanced features immediately; is price-sensitive enough to want to see the exact prorated charge before committing.
- **Pain point today**: The Billing page is entirely read-only — no self-serve path exists.

## Persona 2: Existing Premium Subscriber (Edge Case)

- **Role**: A subscriber who has already upgraded to Premium (either just now, or previously).
- **Goal**: Should not be able to "upgrade" again or be charged a second time.
- **Relevance**: Drives the already-Premium guard (400 response) and the CTA's hide-when-Premium behavior — a real, testable edge case even though it has no dedicated story of its own in this cycle.

## Persona → Story Mapping

| Persona | Story |
|---|---|
| Standard Plan Subscriber | Story 1.1 (all ACs) |
| Existing Premium Subscriber | Story 1.1 (AC-6, AC-9 — already-Premium guard and CTA hidden) |
