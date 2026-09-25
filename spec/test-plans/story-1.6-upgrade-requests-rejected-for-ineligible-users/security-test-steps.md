# Security Test Steps — Story 1.6 Upgrade requests rejected for ineligible users

**Purpose**: verify fail-safe defaults on the rejection paths — no information leakage, no account enumeration beyond the documented contract, no double charging — and document the accepted identity risk.
**Scope**: AC-1, AC-2, AC-3. Mapped to Security Baseline rules.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.6 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.6"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only; access to the backend's console/log output |
| Test data / accounts to seed | Seeded `tpg@example.com`; `victim@example.com` registered and upgraded once |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-SEC-01 — Rejections disclose nothing beyond the documented detail

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-NF-05 · SECURITY-15 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running; one Premium account |
| **Test data** | Premium account; `nobody@example.com` |

**Steps**
1. Call the preview and the upgrade for the Premium account.
2. Call both for `nobody@example.com`.
3. Inspect every response body and header.

**Expected result**
- Bodies contain only the `detail` key with `"Already on Premium plan"` or `"Not authenticated"`.
- No plan data, price, renewal date, user id, password or stack trace in any rejection.

**Pass/Fail criteria**: PASS if every rejection body is exactly the documented detail.
**Cleanup**: none.

### TC-SEC-02 — Repeated upgrades never produce a second charge

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 · SECURITY-11 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `tpg@example.com` |

**Steps**
1. Send 5 `POST {API}/api/billing/upgrade` requests for `tpg@example.com` as fast as possible (e.g. five terminal tabs, or a REST client's repeat function).
2. Record every status and body.

**Expected result**
- Exactly one request returns `200` with a `prorated_charge`; all others return `400` "Already on Premium plan".

**Pass/Fail criteria**: PASS if exactly one success is observed. TO CONFIRM (dev): the in-memory single-process server is expected to serialise these; if more than one `200` appears, raise a defect.
**Cleanup**: restart the backend.

### TC-SEC-03 — Unexpected errors fail safe

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 · SECURITY-15, SECURITY-03 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Fault can be induced (TO CONFIRM with dev — see API TC-API-06) |
| **Test data** | The faulting account |

**Steps**
1. Induce the fault on the upgrade endpoint.
2. `GET {API}/api/billing?email=<account>`.

**Expected result**
- The response is a generic `500`; the account's plan and price are unchanged (no half-applied upgrade).
- The backend log records the error without a password.

**Pass/Fail criteria**: PASS if the failure is generic, the account is unchanged, and the error is logged. Mark "Blocked — cannot induce" if the fault cannot be produced.
**Cleanup**: restore the seed / restart the backend.

### TC-SEC-04 — Known risk observation: account enumeration and cross-account requests

| Field | Value |
|-------|-------|
| **Traces to** | AC-1, AC-2 / REQ-NF-05 · SECURITY-08 (accepted pre-existing risk, Q3 A) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running; `victim@example.com` registered and upgraded |
| **Test data** | Logged in as `tpg@example.com` (or not logged in); requests for `victim@example.com` and `nobody@example.com` |

**Steps**
1. Without credentials for `victim@example.com`, call the preview for `victim@example.com`.
2. Call the preview for `nobody@example.com`.

**Expected result**
- Per the accepted design (Q3 A), step 1 is expected to return `400` "Already on Premium plan" and step 2 `401` "Not authenticated" — which lets anyone learn whether an email has an account and whether it is Premium. This is a **documented known risk**, not correct behaviour.

**Pass/Fail criteria**: Record the observed results as a **risk observation** in the execution record — neither a pass nor a hidden risk. TO CONFIRM with the product owner whether to raise it as a defect with `/raise-defect`.
**Cleanup**: restart the backend.
