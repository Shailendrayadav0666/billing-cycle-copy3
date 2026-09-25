# Security Test Steps — Story 1.4 Upgrade preview endpoint

**Purpose**: verify input validation, safe error responses and the (accepted) identity model on the preview endpoint.
**Scope**: AC-3, plus AC-1/AC-2 security properties. Mapped to Security Baseline rules.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.4 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.4"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password`; a second account registered via `POST {API}/api/auth/register` |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-SEC-01 — Injection-style input is rejected without leaking internals

| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-NF-05 · SECURITY-05, SECURITY-15 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | `email=' OR '1'='1`, `email=<script>alert(1)</script>`, `email=%00`, `email=tpg@example.com&email=other@example.com` |

**Steps**
1. Send `GET {API}/api/billing/upgrade-preview?email=<value>` for each value (URL-encoded).
2. Inspect status and body.

**Expected result**
- Each returns a `4xx` status; none returns `200` or `500`.
- No body echoes the raw script payload unescaped, and none contains a stack trace, exception name or file path.

**Pass/Fail criteria**: PASS if every request is 4xx with a clean body.
**Cleanup**: none.

### TC-SEC-02 — Preview response exposes no sensitive fields

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-05 · SECURITY-11 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | `tpg@example.com` |

**Steps**
1. `GET {API}/api/billing/upgrade-preview?email=tpg@example.com`.
2. List every key in the JSON body.

**Expected result**
- Keys are exactly `current_plan`, `current_price`, `new_plan`, `new_price`, `days_remaining`, `days_in_cycle`, `prorated_charge`.
- No `password`, `id` or other account field appears.

**Pass/Fail criteria**: PASS if no key outside the documented contract appears.
**Cleanup**: none.

### TC-SEC-03 — Known risk observation: preview for another user's account

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-05 · SECURITY-08 (accepted pre-existing risk, Q3 A) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running; a second account registered (`victim@example.com`) |
| **Test data** | Logged in (browser or token) as `tpg@example.com`; request made for `victim@example.com` |

**Steps**
1. Without any credential for `victim@example.com`, send `GET {API}/api/billing/upgrade-preview?email=victim@example.com`.
2. Record the status and body.

**Expected result**
- Per the accepted design (Q3 A, email-as-token), the request is expected to return `200` with the victim's preview. This is a **documented known risk**, not correct behaviour.

**Pass/Fail criteria**: Record the observed result as a **risk observation** in the execution record; it neither passes nor hides the risk. If the endpoint instead rejects the request (401/403), record that the risk is mitigated. TO CONFIRM with the product owner whether this observation should be raised as a defect with `/raise-defect`.
**Cleanup**: restart the backend.
