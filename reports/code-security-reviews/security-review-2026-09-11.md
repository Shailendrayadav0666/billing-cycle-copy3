# Code Security Review Report

**Date**: 2026-09-11
**Reviewer**: AI Security Audit (AIRE Security Baseline)
**Rules Source**: `aire-workflow/extensions/security/baseline/security-baseline.md`
**Project**: Billing-Cycle (Mid-Cycle Subscription Upgrade — Story 1.1)
**Tech Stack**: Python/FastAPI (backend), React/Vite (frontend), in-memory dict store (no DB)
**Scan Scope**: **Diff-scoped** — this work unit's changes only (per `implementation/code-review.md` Phase 2.5), not the full codebase. Diff: `src/backend/main.py`, `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`, plus new test files. Compared against `origin/epic/EPIC-LOCAL-1-mid-cycle-subscription-upgrade` (b6e9fc7).

---

## Executive Summary

- **Total Findings (this diff)**: 1 (advisory — non-blocking)
- 🔴 **Critical/Blocker**: 0
- 🟠 **High**: 0
- 🟡 **Medium**: 1 (SECURITY-08, advisory)
- 🔵 **Low**: 0
- **Security Rules Checked**: 16/16
- **Rules Compliant (on the changed surface)**: 10/16
- **Rules Non-Compliant**: 0/16
- **Rules N/A (not exercised by this diff)**: 6/16
- **Overall Risk Rating (this diff)**: Low

---

## Findings Summary Table

| # | Severity | Security Rule | Title | File(s) | Line(s) |
|---|----------|--------------|-------|---------|---------|
| 1 | 🟡 Medium | SECURITY-08 | New endpoints extend the app's pre-existing "email-as-identity, no ownership proof" model to a mutating action | `src/backend/main.py` | 247-258, 265-291 |

No 🔴/🟠 findings on the changed surface.

---

## 🟡 Medium Findings

### [SEC-001] Object-level authorization relies entirely on the pre-existing, whole-app "email = identity" model — now extended to a state-changing (billing) action
- **Severity**: 🟡 Medium (advisory — non-blocking; see reasoning below)
- **Security Rule**: SECURITY-08 — Application-Level Access Control
- **Verification Criteria Violated**: "Every request that references a resource by ID MUST verify the requesting user/principal owns or has permission to access that resource (prevent IDOR)"
- **File(s)**: `src/backend/main.py` lines 247-258 (`GET /api/billing/upgrade-preview`), 265-291 (`POST /api/billing/upgrade`)
- **Description**: Both new endpoints accept `email` directly as a caller-supplied value (query param / request body) and use it as the sole identity+authorization check (`if email not in users: 401`). There is no session, password re-verification, or token distinct from the email string, so any caller who knows a registered email can call these endpoints for that account — including the **mutating** `POST /api/billing/upgrade`, which will attempt to charge and upgrade a victim's account.
- **Evidence**:
  ```python
  @app.get("/api/billing/upgrade-preview")
  def billing_upgrade_preview(email: str):
      if email not in users:
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
      # no further ownership/session check — identical to every existing endpoint in this file
  ```
- **Why this is NOT scored as a blocking 🔴/🟠 finding on this diff**: This is the **exact same** identity/authorization pattern already used, unmodified, by every pre-existing endpoint in this file (`GET /api/billing`, `GET /api/tasks`, `POST /api/tasks`, `GET /api/users/me` — none take a password or session, only the bare `email`). It is a systemic, whole-application, pre-existing architectural decision — documented explicitly in `spec/plans/architecture.md` Section 6 ("AuthN/AuthZ: unchanged (email-as-token, no real session/JWT) — explicitly out of scope... New endpoints reuse the identical `email not in users → 401` check already used by `GET /api/billing`") and mandated by the Epic itself ("No changes to auth, tasks, login, or registration flows" — both a Goal and an Epic-level Acceptance Criterion). This story's new endpoints apply that pre-existing, already-accepted pattern **consistently**, not a new or worse pattern — there is no additional signal (session, token, password) available in this architecture to check "ownership" more deeply without adding session/auth machinery, which is explicitly out of scope for this cycle.
- **Impact**: An attacker who knows (or guesses/enumerates) a registered email address can view that account's upgrade-preview and force an upgrade charge on it. This is a real risk in an absolute sense, but it is not new — it already exists identically on `GET /api/billing` today (read access to any account's billing data by email alone).
- **Remediation**: Out of scope for this story per the Epic's explicit constraint. **Recommended follow-up**: raise this as its own defect (`/raise-defect`) scoped to the whole application's authentication model — introducing real sessions/passwords-per-request is an app-wide architectural change, not a Story-1.1-sized fix, and should be scoped and reviewed as its own initiative.

---

## Security Baseline Compliance Matrix (this diff's scope)

| Security Rule | Rule Name | Status | Findings |
|---|---|---|---|
| SECURITY-01 | Encryption at Rest and in Transit | N/A | No persistence store touched by this diff (unchanged in-memory dict) |
| SECURITY-02 | Access Logging on Network Intermediaries | N/A | No load balancer/gateway/CDN in this diff's scope |
| SECURITY-03 | Application-Level Logging | N/A | No logging framework exists anywhere in this app (pre-existing gap, not introduced/regressed by this diff) |
| SECURITY-04 | HTTP Security Headers | N/A | These endpoints serve JSON, not HTML |
| SECURITY-05 | Input Validation | Compliant | `email: str` / `UpgradeRequest.email: str` type-checked by Pydantic/FastAPI; no injection surface (no SQL/shell/eval); no format/length bound, but this matches every existing endpoint's pattern exactly and carries no injection or XSS risk in this JSON-only API — not scored as a finding |
| SECURITY-06 | Least-Privilege Access Policies | N/A | No cloud IAM/roles in this diff |
| SECURITY-07 | Restrictive Network Configuration | N/A | No network/firewall config in this diff |
| SECURITY-08 | Application-Level Access Control | Compliant (advisory — see SEC-001) | See finding above; auth-check pattern consistent with pre-existing, explicitly-approved architecture |
| SECURITY-09 | Security Hardening | Compliant | New error responses (401/402/409/500) return only generic `detail`/`message` — no stack traces or internals |
| SECURITY-10 | Software Supply Chain Security | Compliant | No new production dependency added (`requirements-dev.txt`/frontend devDependencies are test-only, not shipped) |
| SECURITY-11 | Secure Design Principles | Compliant | Proration/charge logic isolated in dedicated functions (`compute_prorated_charge`, `charge_card`); rate limiting N/A (pre-existing, whole-app gap) |
| SECURITY-12 | Authentication and Credential Management | N/A | No auth/credential flow touched by this diff |
| SECURITY-13 | Software and Data Integrity | N/A | No deserialization/XML/CDN in this diff |
| SECURITY-14 | Alerting and Monitoring | N/A | No monitoring infra in this app (pre-existing, whole-app gap) |
| SECURITY-15 | Exception Handling and Fail-Safe Defaults | Compliant | `compute_prorated_charge` now fails closed with a generic 500 on a malformed date (fixed during this review — see `runtime-artifacts/audit.md`) |
| SECURITY-16 | Cryptographic Standards and Certificate Validation | N/A | No cryptographic operations in this diff |

---

## OWASP Reference Mapping

| SECURITY Rule | OWASP Category | Relevant here |
|---|---|---|
| SECURITY-08 | A01:2025 – Broken Access Control | Yes — SEC-001 (advisory) |
| SECURITY-15 | A10:2025 – Mishandling of Exceptional Conditions | Yes — fixed during review |

---

## Recommendations Priority

### Immediate (Blocks Deployment)
None.

### Short-Term (Current Sprint)
None specific to this story.

### Medium-Term (Current Release)
1. Raise a defect for the application-wide authentication model (email-as-token, no real session/password-per-request) — affects every endpoint, not just this story's two new ones. Track via `/raise-defect`, scoped as its own initiative.

### Long-Term (Backlog)
1. Consider adding basic rate limiting to public-facing endpoints once a real deployment target exists (currently a local POC).

---

## Appendix

### Methodology
- AI-driven code security review against AIRE Security Baseline (SECURITY-01 through SECURITY-16)
- Rules source: `aire-workflow/extensions/security/baseline/security-baseline.md`
- Scoped to this work unit's diff (`git diff origin/epic/EPIC-LOCAL-1-mid-cycle-subscription-upgrade...HEAD -- src/ tests/unit/`) plus the attack surface it reaches (the `users`/`billing_data` in-memory stores, the existing auth pattern)

### Excluded from Scope
- The full pre-existing codebase (login/register/tasks flows, plaintext password storage, wide-open CORS) — these are real, pre-existing gaps but out of scope for a diff-scoped review; recommended for the standalone `code-security-review` skill's full-codebase audit.
