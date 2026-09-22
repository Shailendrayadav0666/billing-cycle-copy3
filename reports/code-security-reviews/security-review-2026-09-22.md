# Code Security Review Report

**Date**: 2026-09-22
**Reviewer**: AI Security Audit (AIRE Security Baseline)
**Rules Source**: `aire-workflow/extensions/security/baseline/security-baseline.md`
**Project**: StreamPlex Billing (Billing & Tasks POC)
**Tech Stack**: FastAPI/Pydantic (backend), React/Vite (frontend)
**Scan Scope**: 🔴 **DIFF-SCOPED, NOT FULL CODEBASE** — this work unit's changes only (Story 1.1, Self-Serve
Premium Upgrade), invoked from `implementation/code-review.md` Phase 2.5, scoped per
`agents/code-security-review-agent.md` narrowed to the diff: `src/backend/main.py` (new
`UpgradeRequest` model + `POST /api/billing/upgrade` endpoint + `calculate_days_remaining` helper +
Premium data constants), `src/frontend/src/pages/Billing.jsx` (new `UpgradeModal` /
`UpgradeSuccessBanner` components, upgrade CTA, `fetch` call), `src/frontend/src/App.css` (new CSS
classes only), `src/frontend/vite.config.js` (dev/test tooling config), `src/frontend/package.json`
(dev-only test dependencies). The full-codebase audit remains the standalone `code-security-review`
skill's job and is unchanged by this scan.

---

## Executive Summary

- **Total Findings**: 0
- 🔴 **Critical/Blocker**: 0
- 🟠 **High**: 0
- 🟡 **Medium**: 0
- 🔵 **Low**: 0
- **Security Rules Checked**: 16/16 (against the diff)
- **Rules Compliant**: 7/16
- **Rules Non-Compliant**: 0/16
- **Rules N/A** (no applicable surface in this diff): 9/16
- **Overall Risk Rating**: Low (no new findings introduced by this story)

---

## Findings Summary Table

| # | Severity | Security Rule | Title | File(s) | Line(s) |
|---|----------|--------------|-------|---------|---------|
| — | — | — | No findings on the changed surface | — | — |

---

## 🔴 Critical / Blocker Findings

None.

## 🟠 High Findings

None.

## 🟡 Medium Findings

None.

## 🔵 Low Findings

None.

---

## Pre-Existing / Advisory (out of this diff's scope, not this story's introduction)

| Rule | Observation | Disposition |
|---|---|---|
| SECURITY-08 (Broken Access Control) | The new `POST /api/billing/upgrade` endpoint identifies the caller purely by an `email` field in the request body, with no session/JWT verification — identical to the pre-existing `GET /api/billing` and `GET /api/users/me` endpoints. | **Not a new finding.** This is an explicit, documented design decision: `spec/plans/requirements.md` REQ-NF-03 states verbatim that the new endpoint "follows the existing (unauthenticated, email-as-identifier) security posture already documented in `spec/plans/atlas-deep-dive.md` Security Considerations... this epic does not remediate app-wide authentication/authorization design," and `stories.md` AC-5/AC-7 both explicitly require this endpoint be "consistent with the existing `GET /api/billing` pattern." Recorded here for visibility; recommend `/raise-defect` at the app/epic level (not this story) if app-wide auth hardening is ever prioritized. |
| SECURITY-07 (Restrictive Network Config) | `vite.config.js` widens the Vite dev server's `server.fs.allow` to the repo root (`r('../../')`), beyond the default project-root restriction. | **N/A to this rule** (the rule targets cloud/infra network configuration — security groups, firewalls, route tables — not a local dev-server filesystem allowlist). Noted for completeness: this is a local-only, dev-server-only setting required so Vitest (which runs from `tests/unit/frontend/`, outside the frontend package root) can resolve test-only packages; it does not ship in the production build (`vite build` output) and does not widen any deployed attack surface. |
| SECURITY-05 (Input Validation — email format) | `UpgradeRequest.email: str` has no `EmailStr` type or format/length validation. | **Inherited pattern, not new.** Every existing model with an email field (`LoginRequest`, `RegisterRequest`) uses the identical bare `str` type with no format validation — this story's model matches the codebase's established (pre-existing) convention exactly, introducing no new gap beyond what already exists on every sibling endpoint. |

---

## Security Baseline Compliance Matrix (diff-scoped)

| Security Rule | Rule Name | Status | Findings |
|---|---|---|---|
| SECURITY-01 | Encryption at Rest and in Transit | N/A | No new data store or transit-layer change in this diff (in-memory dicts only, unchanged transport) |
| SECURITY-02 | Access Logging on Network Intermediaries | N/A | No network intermediary touched by this diff |
| SECURITY-03 | Application-Level Logging | N/A | No logging framework exists anywhere in the app (pre-existing); this diff adds none, consistent with every sibling endpoint |
| SECURITY-04 | HTTP Security Headers | N/A | No HTTP server/header configuration touched by this diff |
| SECURITY-05 | Input Validation on All API Parameters | ✅ Compliant | `UpgradeRequest.email: str` type-checked by Pydantic; business-rule validation present (already-Premium 400 guard AC-6, unknown-user 401 guard AC-7); email-format gap is a pre-existing, app-wide convention (see Advisory table), not newly introduced |
| SECURITY-06 | Least-Privilege Access Policies | N/A | No IAM/cloud policy touched |
| SECURITY-07 | Restrictive Network Configuration | N/A | `vite.config.js` `server.fs.allow` change is local dev-server tooling, not infra/cloud network config (see Advisory table) |
| SECURITY-08 | Application-Level Access Control | ✅ Compliant | New endpoint's identity model exactly matches the existing, explicitly-authorized (REQ-NF-03, AC-5, AC-7) app-wide pattern — no new gap introduced (see Advisory table for the pre-existing pattern itself) |
| SECURITY-09 | Security Hardening and Misconfiguration Prevention | ✅ Compliant | No new insecure default introduced; the app's existing wildcard-CORS config (`main.py:12`) is unchanged by this diff (already tracked as pre-existing baseline debt from the D3 static-eval gate) |
| SECURITY-10 | Software Supply Chain Security | ✅ Compliant | New devDependencies (`vitest`, `@testing-library/*`, `jsdom`, `@vitest/coverage-v8`) and backend dev deps (`pytest`, `pytest-cov`, `pytest-bdd`, `httpx`, `playwright`) are well-known official packages; D4 (dependency audit) and D5 (license check) gates both ran on this story's dependency set and reported 0 vulnerabilities / 0 disallowed licenses |
| SECURITY-11 | Secure Design Principles | ✅ Compliant | Fail-safe guard clauses (already-Premium, unknown-user) reject invalid state transitions before any mutation; no client-supplied field is trusted for an authorization decision beyond the pre-existing email-identity pattern |
| SECURITY-12 | Authentication and Credential Management | N/A | No new authentication/credential mechanism introduced; reuses the existing (documented, out-of-scope-for-this-epic) posture |
| SECURITY-13 | Software and Data Integrity Verification | N/A | No artifact signing/integrity concern in this diff |
| SECURITY-14 | Alerting and Monitoring | N/A | No new alerting surface; consistent with the rest of the app (none exists) |
| SECURITY-15 | Exception Handling and Fail-Safe Defaults | ✅ Compliant | Both guard conditions raise structured `HTTPException`s with generic, non-leaking `detail` messages (`"Already on Premium plan"`, `"Not authenticated"`); no stack trace or internal detail is exposed on either path |
| SECURITY-16 | Cryptographic Standards and Certificate Validation | N/A | No cryptographic operation introduced by this diff |

---

## OWASP Reference Mapping

No findings to map. The one advisory item (SECURITY-08 / A01:2025 – Broken Access Control) is a
pre-existing, explicitly-documented and epic-scope-excluded app-wide pattern, not a finding introduced
by this diff.

---

## Recommendations Priority

### Immediate (Blocks Deployment)
None.

### Short-Term (Current Sprint)
None — this story introduces no new security debt.

### Medium-Term (Current Release)
1. If app-wide authentication hardening is ever prioritized, raise it as its own defect/epic
   (`/raise-defect`) — it is explicitly out of scope for this story per REQ-NF-03.

### Long-Term (Backlog)
1. Consider adding `EmailStr` (Pydantic) validation across all email-accepting models app-wide
   (`LoginRequest`, `RegisterRequest`, `UpgradeRequest`) in a dedicated hardening pass, not as part of
   any single feature story.

---

## Appendix

### Methodology
- Diff-scoped review against AIRE Security Baseline (SECURITY-01 through SECURITY-16), per
  `implementation/code-review.md` Phase 2.5 and `agents/code-security-review-agent.md`
- Rules source: `aire-workflow/extensions/security/baseline/security-baseline.md`
- Reviewed `git diff epic/self-serve-premium-upgrade` for `src/backend/main.py`,
  `src/frontend/src/pages/Billing.jsx`, `src/frontend/src/App.css`, `src/frontend/vite.config.js`,
  `src/frontend/src/package.json` — the complete file set this story added or changed
- Cross-referenced `reports/eval-evidence/story-1.1/static/` (D1–D7 diff-vs-baseline results) to avoid
  re-flagging anything already tracked there

### Excluded from Scope
- Full-codebase audit (remains the standalone `code-security-review` skill's job)
- Pre-existing patterns/findings on lines this story did not touch (see Advisory table above)
