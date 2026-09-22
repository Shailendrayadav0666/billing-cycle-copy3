# E2E Test Steps — Story 1.1 Self-Serve Premium Upgrade

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/self-serve-premium-upgrade` |
| This story's merged PR | 🔴 TO CONFIRM: [PR URL once Story 1.1's PR merges] |
| Confirm the story is in the build | `git log --oneline \| grep "1.1"` |
| How to build & run it | Follow the project's own build docs (README / CONTRIBUTING). This plan does not restate them. |
| Local base URL / port | Frontend: `http://localhost:5173` (Vite dev server, per `spec/plans/atlas-deep-dive.md`); proxies `/api/*` to the backend |
| Local services that must be up | Backend (FastAPI, port 8000) and frontend (Vite, port 5173) |
| Test data / accounts to seed | `tpg@example.com` / password `password` (existing seeded Standard user) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log functional failures against a system that never started.

---

### TC-E2E-01 — Full happy path: Standard user upgrades to Premium

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2, AC-3, AC-8, AC-9 |
| **Type** | E2E |
| **Priority** | P1 (critical path) |
| **Preconditions** | Logged in as `tpg@example.com` (Standard plan), on the Billing page |
| **Test data** | Seeded account `tpg@example.com` |

**Steps**
1. Log in and navigate to the Billing page.
2. Confirm the plan badge reads "Standard" and an "Upgrade to Premium" button is visible top-right of the header.
3. Click "Upgrade to Premium".
4. In the confirmation modal, note the "Remaining days" and "Charge today" values shown, and confirm the bulleted Premium highlights list is visible (4K Ultra HD, 4 simultaneous streams, 6 download devices, Dolby Vision).
5. Click "Confirm & pay <amount>".
6. Observe the page immediately after the click (no manual refresh).

**Expected result**
- After step 2: badge says "Standard"; CTA is visible.
- After step 4: the modal shows a specific dollar amount for "Charge today" and the correct remaining-days count; no network request has been sent yet (upgrade not yet applied — verify via network tab / by refreshing and seeing plan still Standard if the page were reloaded, don't actually reload).
- After step 6: the page updates WITHOUT a full page reload — plan badge reads "Premium", price shows "$40/month", the feature cards show "4K Ultra HD" / "4 devices" / "6 devices", the "Upgrade to Premium" button is gone, and a persistent success banner appears reading "Upgraded to Premium — Charged $<amount> for the remaining <N> days of this billing cycle. From <renew_at> you will be billed $40/month."

**Pass/Fail criteria**: PASS only if every element above updates correctly with no page reload. Any stale value, a page reload, or a missing banner is a FAIL.
**Cleanup**: Reset `tpg@example.com`'s plan back to Standard in the backend's in-memory store (restart the backend, or use a dedicated test account instead of the shared seed user).

---

> **Scope note**: TC-E2E-02 (Cancel), TC-E2E-03 (CTA hidden for Premium), TC-E2E-04 (modal failure handling), and TC-E2E-05 (no-regressions sweep) were deliberately discarded per user request on 2026-09-22 — this plan now covers only the E2E happy path. See `test-plan-summary.md`'s coverage table for the resulting gap on AC-11, which loses all manual test-case coverage as a direct, disclosed consequence.
