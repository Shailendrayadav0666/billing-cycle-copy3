# Security Test Steps — Story 1.5 Upgrade endpoint switches the user to Premium

**Purpose**: verify the state-changing upgrade endpoint accepts only the user identifier, never trusts client-supplied pricing, logs attempts safely, and document the accepted identity risk.
**Scope**: AC-4 primarily; AC-1 security properties. Mapped to Security Baseline rules.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.5 [STORY] PR, once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.5"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | TO CONFIRM — backend base URL/port not documented (`{API}` below) |
| Local services that must be up | Backend API only; access to the backend's console/log output |
| Test data / accounts to seed | Seeded `tpg@example.com` / `password`; `victim@example.com` registered via `POST {API}/api/auth/register` |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-SEC-01 — Client cannot set the charge, plan or price

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-NF-05 · SECURITY-08 (mass assignment), SECURITY-11 |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started |
| **Test data** | `{"email":"tpg@example.com","prorated_charge":-5,"plan":"Premium","price":"$0/month","usages":[],"included_usage":{}}` |

**Steps**
1. `POST {API}/api/billing/upgrade` with the body.
2. `GET {API}/api/billing?email=tpg@example.com`.

**Expected result**
- The response (if 200) carries the server-computed `prorated_charge` (never `-5`), `price` `"$40/month"`, and the full Premium usages and perks (never empty).
- Stored billing data matches the server definition, not the client values.

**Pass/Fail criteria**: PASS if no client-supplied value is reflected; FAIL otherwise.
**Cleanup**: restart the backend.

### TC-SEC-02 — Upgrade attempts are logged without passwords

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-NF-05 · SECURITY-03 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started with its console/log output visible |
| **Test data** | `tpg@example.com` (success); `ghost@example.com` (unknown, failure) |

**Steps**
1. Upgrade `tpg@example.com`.
2. Attempt an upgrade for `ghost@example.com`.
3. Inspect the backend log output produced by steps 1 and 2.

**Expected result**
- A log line exists for each attempt, recording the user identifier and the outcome (success with charge; failure).
- No log line contains `password` or the value `password`, and no full user record is dumped.

**Pass/Fail criteria**: PASS if both attempts are logged and no password appears. TO CONFIRM (dev): the log format/location.
**Cleanup**: restart the backend.

### TC-SEC-03 — Error responses expose no internals

| Field | Value |
|-------|-------|
| **Traces to** | AC-4 (negative) / REQ-NF-05 · SECURITY-05, SECURITY-15 |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | `{"email":"' OR 1=1 --"}`, `{"email":"<img src=x onerror=alert(1)>"}`, a 10,000-character email string |

**Steps**
1. `POST {API}/api/billing/upgrade` with each body.

**Expected result**
- Each returns `4xx` (validation error or 401); none returns `200` or `500`.
- No body contains a stack trace, exception name, file path, or the raw payload unescaped.

**Pass/Fail criteria**: PASS if all responses are 4xx with clean bodies.
**Cleanup**: none.

### TC-SEC-04 — Known risk observation: upgrading another user's account

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-05 · SECURITY-08 (accepted pre-existing risk, Q3 A) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; `victim@example.com` registered (Standard) |
| **Test data** | Logged in as `tpg@example.com` (or no login at all); body `{"email":"victim@example.com"}` |

**Steps**
1. Without any credential for `victim@example.com`, send `POST {API}/api/billing/upgrade` with the body.
2. `GET {API}/api/billing?email=victim@example.com`.

**Expected result**
- Per the accepted design (Q3 A — the email is the only identity), the request is expected to succeed and upgrade the victim's account to Premium with a charge. This is a **documented known risk (IDOR / broken access control)**, not correct behaviour.

**Pass/Fail criteria**: Record the observed result as a **risk observation** in the execution record — it is neither a pass nor a hidden risk. If the endpoint rejects the request (401/403), record that the risk is mitigated. TO CONFIRM with the product owner whether to raise it as a defect with `/raise-defect`; the Security Baseline review is expected to flag SECURITY-08 on this endpoint.
**Cleanup**: restart the backend.
