> **Source**: Atlas via Helix MCP
> **Server / tool**: helix · mcp__helix__get_solution_document_tool
> **Estate**: solution_id 951 "Billing-Cycle-Helix-Workshop" (repo Billing-Cycle, branch main, last_ingested_commit 69f67f308492a85648aa25a9ff7d8d574031344a) · document_id 4702 "Epic: Self-Serve Premium Upgrade.md" (artifact_type epic, v1, lifecycle CURRENT); linked child story document_id 4703 "Story: Mid-Cycle Upgrade Flow (Standard → Premium).md" (artifact_type story, v1, parent_registry_id 4702)
> **Scope pulled**: the Epic document in full, plus its one linked child story (verbatim, as reference input for User Stories)
> **Fetched**: 2026-09-25T11:03:30Z
> **Freshness**: Atlas documents updated_at 2026-09-22T10:30:26Z (Epic) and 2026-09-22T10:31:15Z (Story); repo last ingested at commit 69f67f308492a85648aa25a9ff7d8d574031344a

# Epic: Self-Serve Premium Upgrade

**Created:** 2026-09-22
**For:** Shailendra
**System:** Billing-Cycle (StreamPlex)
**Status:** Draft
**Priority:** High

---

## Epic Summary

Enable active Standard plan subscribers to upgrade to the Premium plan mid-billing-cycle directly from the Billing page, paying only a prorated charge for the remaining days in their current cycle. The upgrade takes effect immediately — no waiting, no double-paying.

---

## Problem Statement

Currently, the Billing page (`src/frontend/src/pages/Billing.jsx`) shows plan details and usage but provides no path for a user to change their plan. A subscriber on the Standard plan ($20/mo) who wants Premium features mid-month has no self-serve option — the UI is entirely read-only. This blocks upsell and creates friction for users who want to upgrade immediately.

---

## Goal

Deliver a complete, self-serve upgrade flow from the Standard plan ($20/mo) to the Premium plan ($40/mo), including:

1. A visible **Upgrade CTA** on the Billing page
2. A **confirmation step** showing the exact prorated charge before commitment
3. An **immediate plan flip** on confirmation — Billing page reflects new plan, price, and quotas without a page reload
4. All pricing and proration math computed in our own backend code — no external payment provider, no SDK

---

## Scope

### In Scope
- Standard → Premium upgrade only
- Upgrade CTA on the Billing page (`src/frontend/src/pages/Billing.jsx`)
- Prorated charge calculation: `(Premium price − Standard price) × (days remaining / days in cycle)`
- New backend endpoint: `POST /api/billing/upgrade`
- Confirmation modal showing prorated amount before the user commits
- Immediate UI update to Premium plan, price (`$40/month`), and feature set after confirmation
- Premium plan data structure in `src/backend/main.py` (alongside existing Standard data)
- In-memory store update (consistent with current POC architecture — no database required)

### Out of Scope
- Downgrades (Premium → Standard)
- Refunds or credits
- Payment verification or decline handling
- Enterprise billing or multi-tier plans beyond Standard and Premium
- External payment processors (Stripe, PayPal, etc.)
- Persistent storage / database migration

---

## User Value

> *"As an active StreamPlex subscriber on the Standard plan, I want to upgrade to Premium mid-month and only pay for the days remaining in my cycle, so I can get advanced features immediately without feeling like I'm double-paying."*

---

## Premium Plan Definition

| Feature | Standard ($20/mo) | Premium ($40/mo) |
|---------|-------------------|------------------|
| Video quality | Full HD (1080p) | 4K Ultra HD |
| Simultaneous streams | 2 devices | 4 devices |
| Downloads | 2 devices | 6 devices |
| Spatial audio | ✅ | ✅ |
| Ad-free streaming | ✅ | ✅ |
| Dolby Vision | ❌ | ✅ |

---

## Proration Logic

```
prorated_charge = (premium_price - standard_price) × (days_remaining / days_in_cycle)
```

Example: 15 days remaining in a 30-day cycle:
```
($40 - $20) × (15 / 30) = $10.00
```

- The current `renew_at` date does **not** change — the next full cycle bills at the Premium price ($40/mo)
- Proration is calculated on the backend; the frontend only displays the result

---

## Affected Files

| File | Change Type |
|------|-------------|
| `src/backend/main.py` | Add Premium plan data, proration logic, `POST /api/billing/upgrade` endpoint |
| `src/frontend/src/pages/Billing.jsx` | Add Upgrade CTA, confirmation modal, plan-switch UI |
| `src/frontend/src/App.css` | Add styles for upgrade CTA, modal, confirmation UI |

---

## Stories

| Story | Description | Status |
|-------|-------------|--------|
| [Mid-Cycle Upgrade Flow (Standard → Premium)](#) | Full implementation: backend endpoint + proration math + frontend CTA + confirmation modal + immediate UI refresh | Draft |

---

## Definition of Done (Epic Level)

- [ ] A Standard-plan user can initiate an upgrade from the Billing page
- [ ] A confirmation step shows the exact prorated charge before any commitment
- [ ] On confirmation, the backend applies the upgrade and returns the new plan state
- [ ] The Billing page immediately reflects Premium plan name, price ($40/month), and updated feature quotas
- [ ] Proration math is computed server-side with no external dependencies
- [ ] No regressions to existing login, registration, or billing display flows
- [ ] Product Strategist sign-off on acceptance criteria

---

## Referenced Paths

### High Relevance
- `Billing-Cycle/src/backend/main.py` - All backend logic, billing data structure, existing endpoints — upgrade endpoint and Premium plan data added here
- `Billing-Cycle/src/frontend/src/pages/Billing.jsx` - Billing dashboard where the Upgrade CTA and confirmation modal will live

### Medium Relevance
- `Billing-Cycle/src/frontend/src/context/AuthContext.jsx` - Provides `token` (email) used to identify the user for the upgrade request
- `Billing-Cycle/src/frontend/src/App.css` - Styles for new upgrade UI components

### Low Relevance
- `Billing-Cycle/src/frontend/src/App.jsx` - Routing — no changes expected
- `Billing-Cycle/src/frontend/package.json` - Dependencies — no new packages required

---
---

# Appendix — Linked Atlas Story (verbatim, document_id 4703)

# Story: Mid-Cycle Upgrade Flow (Standard → Premium)

**Created:** 2026-09-22
**For:** Shailendra
**Epic:** Self-Serve Premium Upgrade
**System:** Billing-Cycle (StreamPlex)
**Status:** Draft
**Priority:** High
**Estimate:** M (3–5 days)

---

## User Story

> **As a Standard plan subscriber ($20/mo),**
> **I want to upgrade to Premium ($40/mo) from the Billing page mid-month,**
> **so that I get advanced features immediately and only pay a prorated charge for the days remaining in my cycle.**

---

## Context

The Billing page (`src/frontend/src/pages/Billing.jsx`) currently renders plan details and usage cards fetched from `GET /api/billing`, but is entirely read-only — there is no way for the user to change their plan. The backend (`src/backend/main.py`) stores billing data in an in-memory dict (`billing_data`) keyed by email, and plan data in a parallel `users` dict. Both need to be updated on upgrade.

The "token" in the current system is the user's email (stored in `localStorage` and passed as a query param). The upgrade endpoint will follow the same pattern for consistency with the existing POC auth model.

---

## Acceptance Criteria

### AC-1: Upgrade CTA is visible to Standard plan users only

**Given** a user is logged in with a Standard plan  
**When** they view the Billing page  
**Then** an "Upgrade to Premium" button is visible in the plan section (below the current plan card)

**Given** a user is logged in with a Premium plan  
**When** they view the Billing page  
**Then** the "Upgrade to Premium" button is NOT rendered (plan is already Premium)

---

### AC-2: Confirmation modal shows prorated amount before commitment

**Given** a Standard user clicks "Upgrade to Premium"  
**When** the upgrade modal opens  
**Then** the modal displays:
- Current plan: Standard ($20/mo)
- New plan: Premium ($40/mo)
- Days remaining in cycle (calculated from `renew_at` date and today's date)
- **Prorated charge:** `($40 − $20) × (days_remaining / days_in_cycle)` rounded to 2 decimal places
- Example display: *"You'll be charged $10.00 today for the 15 days remaining in your cycle."*
- A **Confirm Upgrade** button and a **Cancel** button

**And** the user has NOT been charged or upgraded yet at this point

---

### AC-3: Proration math is correct

**Given** the following inputs to the proration formula:
- Premium price: $40.00
- Standard price: $20.00
- Days remaining in cycle: derived from `renew_at` (stored as `"MMM DD, YYYY"` string) minus today's date
- Days in cycle: 30 (fixed)

**Then** the backend computes:
```
prorated_charge = round((40 - 20) * (days_remaining / 30), 2)
```

**Edge cases:**
- If `days_remaining <= 0` (renewal date is today or past): prorated charge = $0.00; upgrade still proceeds
- If `days_remaining >= 30`: prorated charge = $20.00 (full price difference)

---

### AC-4: Backend upgrade endpoint applies the plan change

**Given** a `POST /api/billing/upgrade` request with `{ "email": "<user_email>" }`  
**When** the user is found and is on the Standard plan  
**Then** the backend:
1. Calculates `days_remaining` from the stored `renew_at` date
2. Computes `prorated_charge`
3. Updates `users[email]["plan"]` to `"Premium"` and `users[email]["price"]` to `"$40/month"`
4. Updates `billing_data[email]` with the Premium plan features (see Premium feature set below)
5. Returns `{ "plan_name": "Premium", "price": "$40/month", "renew_at": "<unchanged>", "prorated_charge": <float>, "usages": [...], "included_usage": {...} }`

**Given** the user is already on Premium  
**When** `POST /api/billing/upgrade` is called  
**Then** the backend returns HTTP 400 with `{ "detail": "Already on Premium plan" }`

---

### AC-5: Billing page reflects Premium plan immediately after confirmation

**Given** the user clicks "Confirm Upgrade" in the modal  
**When** the backend responds successfully  
**Then** the Billing page updates **without a full page reload** to show:
- Plan name: **Premium**
- Price: **$40/month**
- Renewal date: **unchanged** (same `renew_at` as before)
- Updated usage cards reflecting Premium quotas (4K quality, 4 streams, 6 downloads)
- The "Upgrade to Premium" button is no longer rendered

**And** a success message is briefly shown: *"You're now on Premium! Your next full cycle bills at $40/month."*

---

### AC-6: Cancel does nothing

**Given** the upgrade modal is open  
**When** the user clicks "Cancel" or closes the modal  
**Then** no API call is made and the Billing page remains unchanged

---

### AC-7: Renewal date is unchanged

**Given** a user upgrades mid-cycle  
**Then** the `renew_at` date in both the UI and the backend remains the same value it was before the upgrade — the Premium price takes effect at the next cycle, not from a new start date

---

## Premium Plan Feature Data

The backend must define and return the following for Premium users:

```python
"usages": [
    {
        "id": "video-quality",
        "label": "Video quality",
        "type": "feature",
        "value": "4K Ultra HD",
        "help": "The best video resolution available on the Premium plan.",
    },
    {
        "id": "screens",
        "label": "Watch at the same time",
        "type": "feature",
        "value": "Can watch on 4 devices at once",
        "help": "Number of supported devices that can stream simultaneously.",
    },
    {
        "id": "downloads",
        "label": "Download on devices",
        "type": "feature",
        "value": "Can download on 6 devices",
        "help": "Number of devices for offline viewing.",
    },
],
"included_usage": {
    "title": "Plan perks",
    "items": [
        {"id": "ad-free", "label": "Ad-free streaming", "used_percent": 100},
        {"id": "spatial-audio", "label": "Spatial audio (select titles)", "used_percent": 100},
        {"id": "dolby-vision", "label": "Dolby Vision (select titles)", "used_percent": 100},
    ],
    "help": "Perks included in your Premium plan.",
}
```

---

## Backend Changes

**New endpoint:** `POST /api/billing/upgrade`

```python
class UpgradeRequest(BaseModel):
    email: str

@app.post("/api/billing/upgrade")
def upgrade_plan(payload: UpgradeRequest):
    # 1. Validate user exists and is on Standard
    # 2. Calculate days_remaining from renew_at
    # 3. Compute prorated_charge = round((40 - 20) * (days_remaining / 30), 2)
    # 4. Update users[email] plan fields
    # 5. Update billing_data[email] with Premium feature set
    # 6. Return updated billing data + prorated_charge
```

**Proration helper:**
```python
from datetime import datetime

def calculate_days_remaining(renew_at: str) -> int:
    renew_date = datetime.strptime(renew_at, "%b %d, %Y").date()
    today = datetime.today().date()
    return max(0, (renew_date - today).days)
```

---

## Frontend Changes

**`src/frontend/src/pages/Billing.jsx`**

1. Conditionally render an **"Upgrade to Premium"** button when `data.plan_name === "Standard"`
2. Manage modal open/close state with `useState`
3. On modal open: call `GET /api/billing/upgrade-preview?email=<token>` OR compute display values from existing `data.renew_at` client-side (simpler: compute `days_remaining` in JS from the `renew_at` string and display the prorated amount)
4. On "Confirm Upgrade": `POST /api/billing/upgrade` with `{ email: token }`, then call `setData(response)` to update the page state
5. Show a transient success message on confirmation
6. Remove the upgrade button once plan is Premium

---

## Out of Scope (Confirmed)

- Downgrades
- Refunds or credits
- Payment verification or decline flows
- External payment SDKs (Stripe, etc.)
- Enterprise or additional plans
- Persistent database storage

---

## Definition of Done

- [ ] `POST /api/billing/upgrade` endpoint implemented in `src/backend/main.py`
- [ ] Proration formula tested manually with at least 3 day-remaining values (e.g., 0, 15, 29)
- [ ] "Upgrade to Premium" CTA visible on Billing page for Standard users only
- [ ] Confirmation modal renders with correct prorated charge before commitment
- [ ] On confirmation, Billing page data updates without page reload to show Premium plan
- [ ] Success message displayed after upgrade
- [ ] Cancel/close modal does not trigger upgrade
- [ ] `renew_at` date unchanged after upgrade
- [ ] Upgrade button absent for Premium users
- [ ] No regressions: login, registration, Standard billing display all work as before
- [ ] Code reviewed and merged

---

## Referenced Paths

### High Relevance
- `Billing-Cycle/src/backend/main.py` - New `UpgradeRequest` model, `POST /api/billing/upgrade` endpoint, proration logic, Premium billing data structure, and `users` dict mutation all implemented here
- `Billing-Cycle/src/frontend/src/pages/Billing.jsx` - Upgrade CTA button, confirmation modal, `POST` fetch call, and state update (`setData`) all implemented here

### Medium Relevance
- `Billing-Cycle/src/frontend/src/context/AuthContext.jsx` - Provides `token` (email) consumed by `Billing.jsx` to identify the user in the upgrade request
- `Billing-Cycle/src/frontend/src/App.css` - Styles for the upgrade button, modal overlay, confirmation text, and success message

### Low Relevance
- `Billing-Cycle/src/frontend/package.json` - No new dependencies expected; confirmed in scope constraints
- `Billing-Cycle/src/backend/requirements.txt` - No new Python packages required for this story
