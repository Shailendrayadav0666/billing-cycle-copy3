> **Source**: Atlas via Helix MCP
> **Server / tool**: helix (mcp__helix) · get_solution_document_tool
> **Estate**: Billing-Cycle-Helix-Workshop (solution_id 951) — repository Billing-Cycle (https://github.com/Shailendrayadav0666/Billing-Cycle, branch main, last ingested commit 69f67f308492a85648aa25a9ff7d8d574031344a)
> **Scope pulled**: Epic document (document_id 4702, artifact_type: epic)
> **Fetched**: 2026-09-22T10:35:04Z
> **Freshness**: document version 1, created 2026-09-22T10:30:26Z (Atlas-reported)

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
