# Integration Test Steps — Story 1.4 Upgrade preview endpoint

**Purpose**: verify the preview endpoint's boundary with the in-memory store — calling it leaves the subscriber's plan, price and renewal date untouched, as observed through the existing read endpoints.
**Scope**: AC-2 (read-only), with a cross-check of AC-1 against stored data.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.4 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.4"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only (in-memory store) |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password` (Standard, renews `Oct 30, 2026`) |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-INT-01 — Preview does not change billing data or profile

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-03 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` |

**Steps**
1. `GET {API}/api/billing?email=tpg@example.com` — save the full JSON body (snapshot A).
2. `GET {API}/api/users/me?email=tpg@example.com` — save the body (snapshot B).
3. `GET {API}/api/billing/upgrade-preview?email=tpg@example.com` three times.
4. Repeat steps 1 and 2 and compare with snapshots A and B.

**Expected result**
- The preview calls return `200` each time with identical bodies.
- After the previews, `/api/billing` still shows `plan_name` `"Standard"`, `price` `"$20/month"`, `renew_at` `"Oct 30, 2026"` and the same usages/perks as snapshot A.
- `/api/users/me` still shows `plan` `"Standard"`, `price` `"$20/month"`, `renew_at` `"Oct 30, 2026"` as in snapshot B.

**Pass/Fail criteria**: PASS only if both after-snapshots are byte-for-byte equal to the before-snapshots.
**Cleanup**: none.

### TC-INT-02 — Preview for an unknown account creates no data

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 (negative) / REQ-F-03 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | `ghost@example.com` (never registered) |

**Steps**
1. `GET {API}/api/billing/upgrade-preview?email=ghost@example.com`.
2. `GET {API}/api/users/me?email=ghost@example.com`.
3. `GET {API}/api/billing?email=ghost@example.com`.

**Expected result**
- Step 1 returns `401` with `{"detail": "Not authenticated"}`.
- Steps 2 and 3 both return `401` — the preview did not create an account or billing record.

**Pass/Fail criteria**: PASS if all three return `401`; any `200` is a FAIL.
**Cleanup**: none.

### TC-INT-03 — Preview values agree with the stored renewal date

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-01 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | `tpg@example.com` |

**Steps**
1. Read `renew_at` from `GET {API}/api/billing?email=tpg@example.com`.
2. Compute expected billable days `min(renew_at − today, 30)` and charge `round(20 × days / 30, 2)`.
3. `GET {API}/api/billing/upgrade-preview?email=tpg@example.com`.

**Expected result**
- `days_remaining` and `prorated_charge` equal the values computed from the stored `renew_at`.

**Pass/Fail criteria**: PASS if both match exactly.
**Cleanup**: none.
