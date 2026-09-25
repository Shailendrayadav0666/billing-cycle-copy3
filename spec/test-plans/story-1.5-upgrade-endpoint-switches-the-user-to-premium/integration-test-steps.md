# Integration Test Steps — Story 1.5 Upgrade endpoint switches the user to Premium

**Purpose**: verify that an upgrade is stored in the in-memory store and visible through the existing read endpoints, for that subscriber only, with the renewal date kept.
**Scope**: AC-2, AC-3 (stored state).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.5 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.5"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only (in-memory store) |
| Test data / accounts to seed | Seeded `tpg@example.com`; a second account registered via `POST {API}/api/auth/register` |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-INT-01 — Upgrade is visible in billing data and profile

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-05 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` |

**Steps**
1. `POST {API}/api/billing/upgrade` with `{"email": "tpg@example.com"}`; confirm `200`.
2. `GET {API}/api/billing?email=tpg@example.com`.
3. `GET {API}/api/users/me?email=tpg@example.com`.

**Expected result**
- `/api/billing`: `plan_name` `"Premium"`, `price` `"$40/month"`, Premium usages (4K Ultra HD, 4 devices, 6 devices) and three perks including Dolby Vision.
- `/api/users/me`: `plan` `"Premium"`, `price` `"$40/month"`; no `password` field.

**Pass/Fail criteria**: PASS if both endpoints report the Premium state.
**Cleanup**: restart the backend.

### TC-INT-02 — Other subscribers are unaffected

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 (negative) / REQ-F-05 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; register `other@example.com` |
| **Test data** | `tpg@example.com` (upgraded), `other@example.com` (control) |

**Steps**
1. Snapshot `GET {API}/api/billing?email=other@example.com`.
2. Upgrade `tpg@example.com`.
3. Repeat step 1 and compare.

**Expected result**
- `other@example.com` is still `"Standard"` at `"$20/month"` with the same `renew_at`, usages and perks as the snapshot.

**Pass/Fail criteria**: PASS if the control account is byte-for-byte unchanged.
**Cleanup**: restart the backend.

### TC-INT-03 — Renewal date is kept in stored data

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-06 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` (renews `Oct 30, 2026`) |

**Steps**
1. Upgrade `tpg@example.com`.
2. `GET {API}/api/billing?email=tpg@example.com` and `GET {API}/api/users/me?email=tpg@example.com`.

**Expected result**
- Both report `renew_at` `"Oct 30, 2026"`.

**Pass/Fail criteria**: PASS if both values are unchanged.
**Cleanup**: restart the backend.

### TC-INT-04 — State resets on backend restart (documented POC limitation)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 (boundary) / REQ-NF-06 |
| **Type** | Integration |
| **Priority** | P3 |
| **Preconditions** | `tpg@example.com` upgraded |
| **Test data** | `tpg@example.com` |

**Steps**
1. Restart the backend process.
2. `GET {API}/api/billing?email=tpg@example.com`.

**Expected result**
- The account is back to `"Standard"` at `"$20/month"` — upgrades last only for the life of the backend process (in-memory store, by design).

**Pass/Fail criteria**: PASS if the documented behaviour is observed; any persisted Premium state indicates an unplanned persistence change (report it).
**Cleanup**: none.
