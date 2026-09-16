> **Source**: Atlas via Helix MCP
> **Server / tool**: helix · get_solution_document_tool
> **Document**: document_id 4039, "Epic: Self-Serve Premium Upgrade.md" (artifact_type=epic, lifecycle_state=CURRENT, version 1)
> **Estate**: solution_id 951 (Billing-Cycle-Helix-Workshop)
> **Fetched**: 2026-09-16T10:01:18Z

---

# Epic: Self-Serve Premium Upgrade

**Status:** DRAFT
**Created:** 2026-09-16
**Author:** Shailendra
**PRD:** PRD: Upgrade to Premium — Mid-Cycle Subscription Upgrade
**System:** Billing-Cycle

---

## Epic Goal

Enable Standard plan users to upgrade to the Premium plan mid-cycle directly from the Billing page — no manual intervention, no support ticket. The user sees an **"Upgrade to Premium"** button, reviews a prorated charge, confirms, and is immediately on Premium.

---

## Problem Being Solved

Standard plan users ($20/month) hit usage limits (2,000 chat credits, 3 chatbots, 1,000 document pages) with no self-serve path to upgrade. The Billing page tells them on-demand credit is unavailable on their plan — but offers no way out. This creates friction and churn risk.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Upgrade flow completion rate | > 80% of users who click the button |
| Time to upgrade | < 60 seconds end-to-end |
| API error rate | < 1% |
| Regression rate on billing page | 0 |

---

## Scope

### In Scope
- "Upgrade to Premium" CTA on `Billing.jsx`
- Inline confirmation panel with prorated charge preview
- `POST /api/billing/upgrade` backend endpoint with proration logic
- Plan badge and usage limits updated in UI after upgrade
- Idempotent upgrade (already-Premium returns 400)

### Out of Scope
- Real payment processing (mocked for this POC)
- Downgrade flow
- Email notifications
- Admin reporting

---

## Stories

| # | Story | Status |
|---|-------|--------|
| S-01 | Mid-Cycle Upgrade to Premium | 🔲 To Do |

---

## Files to Change

| File | Nature of Change |
|------|-----------------|
| `Billing-Cycle/frontend/src/pages/Billing.jsx` | Add upgrade button, confirmation panel, loading/success/error states |
| `Billing-Cycle/frontend/src/App.css` | Add `.premium-badge`, `.upgrade-btn`, `.upgrade-confirm-panel` styles |
| `Billing-Cycle/backend/main.py` | Add `UpgradeRequest` model + `POST /api/billing/upgrade` endpoint |

---

## Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| OQ-1 | Should prorated charge preview use a `dry_run` query param or a separate endpoint? | Engineering | Medium |
| OQ-2 | Does on-demand balance carry over or reset to a Premium default on upgrade? | PM | Medium |
| OQ-3 | Annual billing consideration — out of scope now, flag for roadmap? | PM | Low |

---

## Referenced Paths

### High Relevance
- `Billing-Cycle/frontend/src/pages/Billing.jsx` - UI file being modified for this epic
- `Billing-Cycle/backend/main.py` - Backend file receiving the new upgrade endpoint

### Medium Relevance
- `Billing-Cycle/frontend/src/context/AuthContext.jsx` - Auth token pattern used by the upgrade flow
- `Billing-Cycle/frontend/package.json` - Confirms tech constraints (React 19, no state lib)
- `Billing-Cycle/README.md` - API surface and project structure reference

### Low Relevance
- `Billing-Cycle/frontend/vite.config.js` - Build config, unaffected
- `Billing-Cycle/backend/requirements.txt` - No new dependencies required
