# Personas — Self-Serve Premium Upgrade

## Persona 1: Active Standard-Plan Subscriber

- **Name**: Represented in the seeded/demo account as "TPG" (`tpg@example.com`)
- **Role**: An existing, logged-in StreamPlex subscriber on the Standard plan ($20/month)
- **Goal**: Wants Premium features (4K + HDR, 4 simultaneous streams, more downloads) immediately, without waiting for their next billing cycle and without feeling like they're double-paying for the current one
- **Context**: Views the Billing page (`/billing`) after logging in; sees their current plan, price, and renewal date
- **Motivations**: Convenience (self-serve, no support ticket), fairness (pay only for what's left of the cycle), immediacy (features unlock right away)
- **Pain point addressed by this Epic**: Today the Billing page is read-only — there is no way to change plans at all
- **Relevant stories**: 1.1 (sees the CTA and modal), 1.2 (their upgrade is processed and priced correctly), 1.3 (sees their plan change immediately), 1.4 (sees a clear message if something goes wrong)

## Persona 2: Already-Premium Subscriber (edge case)

- **Role**: A subscriber who is already on the Premium plan
- **Goal / expectation**: Should never be charged again for an upgrade they already have
- **Relevant stories**: 1.2 (the backend's idempotent-guard AC exists specifically for this persona — an already-Premium user hitting the upgrade endpoint again, whether by a stale UI state, a replayed request, or direct API use, must be rejected with no state change)

## Persona 3: Unknown / Unauthenticated Caller (edge case)

- **Role**: A request bearing an email that doesn't match any registered user (malformed client state, expired/tampered local data, or a direct API call with a bad value)
- **Goal / expectation**: Should not be able to trigger a plan change on an account that doesn't exist
- **Relevant stories**: 1.2 (the backend's 404 guard)
