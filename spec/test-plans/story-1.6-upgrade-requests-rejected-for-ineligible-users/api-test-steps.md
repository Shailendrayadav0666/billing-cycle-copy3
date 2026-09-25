# API Test Steps — Story 1.6 Upgrade requests rejected for ineligible users

**Purpose**: verify the preview and upgrade endpoints reject already-Premium and unknown accounts with the documented status and detail, and fail safely on unexpected errors.
**Scope**: AC-1, AC-2, AC-3 at the API level. Unchanged stored state is in `integration-test-steps.md`.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.6 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.6"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only (in-memory store) |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password` (Standard, renews `Oct 30, 2026`). A Premium account is obtained by upgrading `tpg@example.com` once with `POST {API}/api/billing/upgrade` (Story 1.5). |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-API-01 — Preview refused for an already-Premium account

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-03 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; `tpg@example.com` upgraded once (response `200`) |
| **Test data** | `email=tpg@example.com` |

**Steps**
1. `GET {API}/api/billing/upgrade-preview?email=tpg@example.com`.

**Expected result**
- Status `400`; body exactly `{"detail": "Already on Premium plan"}`.

**Pass/Fail criteria**: PASS if status and body match exactly.
**Cleanup**: restart the backend.

### TC-API-02 — Second upgrade refused for an already-Premium account

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-04 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; `tpg@example.com` upgraded once |
| **Test data** | Body `{"email": "tpg@example.com"}` |

**Steps**
1. `POST {API}/api/billing/upgrade` with the body.
2. Repeat step 1 immediately (rapid double submit).

**Expected result**
- Both calls return `400` with `{"detail": "Already on Premium plan"}`; no second charge is reported.

**Pass/Fail criteria**: PASS if every repeated call is `400` with that detail.
**Cleanup**: restart the backend.

### TC-API-03 — Standard account is NOT refused (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 (boundary) / REQ-F-03 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started (tpg still Standard) |
| **Test data** | `email=tpg@example.com` |

**Steps**
1. `GET {API}/api/billing/upgrade-preview?email=tpg@example.com`.

**Expected result**
- Status `200` (not `400`) — the rejection applies only to Premium accounts.

**Pass/Fail criteria**: PASS if `200`.
**Cleanup**: none.

### TC-API-04 — Unknown account on both endpoints

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-03, REQ-F-04 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | `nobody@example.com` (never registered) |

**Steps**
1. `GET {API}/api/billing/upgrade-preview?email=nobody@example.com`.
2. `POST {API}/api/billing/upgrade` with `{"email": "nobody@example.com"}`.

**Expected result**
- Both return `401` with `{"detail": "Not authenticated"}`.

**Pass/Fail criteria**: PASS if both match exactly.
**Cleanup**: none.

### TC-API-05 — Email case/whitespace variants of a real account (boundary)

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 (boundary) / REQ-F-04 |
| **Type** | API |
| **Priority** | P3 |
| **Preconditions** | Backend freshly started |
| **Test data** | `TPG@EXAMPLE.COM`, ` tpg@example.com ` (leading/trailing space) |

**Steps**
1. `POST {API}/api/billing/upgrade` with each variant.
2. `GET {API}/api/billing?email=tpg@example.com`.

**Expected result**
- TO CONFIRM (dev/product owner): whether email matching is case- and whitespace-sensitive. Existing login treats the email as an exact key (Atlas), so the expected result is `401` "Not authenticated" for each variant and `tpg@example.com` remains Standard.

**Pass/Fail criteria**: PASS if the behaviour matches the confirmed rule and no unintended account is upgraded.
**Cleanup**: restart the backend.

### TC-API-06 — Unexpected server error returns a generic 500

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | A way to make the preview and upgrade handlers hit an unexpected internal error. TO CONFIRM (dev): forcing an internal error manually may not be possible from outside the system — agree a documented fault-injection switch, test fixture, or corrupted seed record (e.g. a `renew_at` value that cannot be parsed) before execution. |
| **Test data** | An account set up to trigger the fault |

**Steps**
1. Trigger the fault for `GET {API}/api/billing/upgrade-preview?email=<account>`.
2. Trigger the fault for `POST {API}/api/billing/upgrade` with that email.

**Expected result**
- Each returns `500` with a generic message (e.g. `{"detail": "Internal server error"}` — exact text TO CONFIRM).
- No body contains a stack trace, exception class name, file path or internal state.

**Pass/Fail criteria**: PASS if both are 500 with a generic, clean body. If the fault cannot be induced, mark "Blocked — cannot induce" rather than Pass.
**Cleanup**: restore the seed / restart the backend.
