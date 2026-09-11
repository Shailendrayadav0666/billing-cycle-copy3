# Personas — Mid-Cycle Subscription Upgrade

## Persona 1: Standard Subscriber ("Sam")
- **Role**: Active user on the Standard plan ($20/month), token = registered email
- **Goal**: Move to Premium mid-cycle without contacting support, paying only for the days remaining
- **Motivation**: Needs more chat credits / chatbots / document pages than Standard allows
- **Pain point today**: Billing page shows a hardcoded "Standard" badge with no path to change plan
- **Relevant stories**: 1.1, 1.2, 1.3, 1.4, 1.6

## Persona 2: Declined-Card Subscriber ("Dana")
- **Role**: Standard subscriber whose registered email happens to start with `fail` (demo-deterministic decline trigger) — represents any subscriber whose payment method is declined
- **Goal**: Attempt the upgrade and get clear, actionable feedback when payment fails, with no partial/inconsistent state
- **Pain point today**: N/A (new flow) — this persona validates the failure path is safe and clear
- **Relevant stories**: 1.2, 1.3, 1.5, 1.7

## Persona 3: Premium Subscriber ("Priya")
- **Role**: Already on the Premium plan
- **Goal**: Not be confused by an upgrade offer that doesn't apply to her
- **Relevant stories**: 1.1 (CTA suppressed), 1.2 (409 guard on preview endpoint), 1.4 (409 guard on upgrade endpoint)
