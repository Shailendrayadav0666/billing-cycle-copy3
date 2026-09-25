# Personas — Self-Serve Premium Upgrade

**Epic**: Atlas 4702 · **Source**: Epic user-value statement, Atlas Story 4703, `spec/plans/atlas-deep-dive.md` (StreamPlex users, one seeded account `tpg@example.com` on Standard)

---

## Sam — the Standard subscriber (primary)

| Attribute | Detail |
|---|---|
| **Plan** | Standard, $20/month, renewing on a fixed date (seeded user: Oct 30, 2026; new sign-ups: registration date + 30 days) |
| **Goal** | Get Premium features (4K Ultra HD, 4 streams, 6 downloads, Dolby Vision) now, mid-cycle, not at the next renewal |
| **Concern** | Paying twice for the same days; being charged without seeing the amount first |
| **Behaviour** | Opens the Billing page, reads the charge carefully, may back out, expects the page to change straight away once confirmed |
| **Needs from the product** | A visible Upgrade button, the exact prorated charge before committing, an easy way to cancel, immediate confirmation, and a clear message if something fails |
| **Quote** | *"As an active StreamPlex subscriber on the Standard plan, I want to upgrade to Premium mid-month and only pay for the days remaining in my cycle, so I can get advanced features immediately without feeling like I'm double-paying."* (Epic) |

## Priya — the Premium subscriber (secondary)

| Attribute | Detail |
|---|---|
| **Plan** | Premium, $40/month (including anyone Sam becomes after upgrading) |
| **Goal** | See her real plan and features on the Billing page |
| **Concern** | Being offered, or charged for, an upgrade she already has |
| **Behaviour** | Visits Billing occasionally to check her plan and renewal date |
| **Needs from the product** | The page names Premium and its features; no Upgrade button; the system refuses a second upgrade |

---

## Persona-to-Story Map

| Story | Sam (Standard) | Priya (Premium) |
|---|---|---|
| 1.1 Premium upgrade dialog on the Billing page | Primary | Secondary (sees no CTA) |
| 1.2 Prorated charge calculation | Primary | — |
| 1.3 Billing page reflects the current plan | Secondary (Standard display unchanged) | Primary |
| 1.4 Upgrade preview endpoint | Primary | — |
| 1.5 Upgrade endpoint switches the user to Premium | Primary | — |
| 1.6 Upgrade requests rejected for ineligible users | — | Primary |
| 1.7 Dialog shows the server-computed prorated charge | Primary | — |
| 1.8 Confirm the upgrade from the dialog | Primary | — |
| 1.9 Upgrade failures shown in the dialog | Primary | — |
