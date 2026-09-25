# Code Security Review Report

**Date**: 2026-09-25
**Reviewer**: AI Security Audit (AIRE Security Baseline)
**Rules Source**: `aire-workflow/extensions/security/baseline/security-baseline.md`
**Project**: helix-aire-v1-demo2 — Billing-Cycle (StreamPlex)
**Tech Stack**: React 19 + Vite 8 frontend (plain JavaScript/JSX), FastAPI backend (unchanged by this unit), Vitest / Playwright test tooling
**Scan Scope**: This work unit's diff (story-1.1, base ce9c3c2) and the attack surface it reaches — the Billing page UI, the new `UpgradeDialog` component, their styles, and the test/tooling configuration added with them. Not a full-codebase audit.
**Code review version**: v1

---

## Executive Summary

- **Total Findings**: 2 (0 on the blocking levels)
- **Critical/Blocker**: 0
- **High**: 0
- **Medium**: 1 (pre-existing, not introduced by this change)
- **Low**: 1
- **Security Rules Checked**: 16/16
- **Rules Compliant**: 3/16 (SECURITY-05, -11, -16 as far as the diff reaches)
- **Rules Non-Compliant**: 2/16 at advisory level only (SECURITY-10 Low; SECURITY-15 Medium, pre-existing)
- **Rules N/A**: 11/16
- **Overall Risk Rating**: Low

The diff is UI-only: a button, a modal dialog with static copy plus the plan label from the existing billing payload, and CSS. It adds no endpoint, no network call, no authentication or storage change, and no runtime dependency.

---

## Findings Summary Table

| # | Severity | Security Rule | Title | File(s) | Line(s) |
|---|----------|--------------|-------|---------|---------|
| 1 | Low | SECURITY-10 | New frontend devDependencies use caret ranges and the frontend lockfile is not committed | `src/frontend/package.json`, `src/frontend/.gitignore` | devDependencies block; `.gitignore` `package-lock.json` entry |
| 2 | Medium (pre-existing) | SECURITY-15 | Billing data fetch has no error handling | `src/frontend/src/pages/Billing.jsx` | 88-92 (unchanged by this unit) |

---

## Critical / Blocker Findings

None.

---

## High Findings

None.

---

## Medium Findings

### [SEC-002] Billing data fetch has no error handling (pre-existing)
- **Severity**: Medium — **pre-existing**, on lines this work unit did not change
- **Security Rule**: SECURITY-15 — Exception Handling and Fail-Safe Defaults
- **Verification Criteria Violated**: "All external calls (DB, HTTP, file I/O) have explicit error handling"; "No unhandled promise rejections"
- **File(s)**: `src/frontend/src/pages/Billing.jsx` (Lines 88-92)
- **Description**: `fetch('/api/billing?email=…').then((r) => r.json()).then(setData)` has no `.catch` and does not check `r.ok`; a network failure is an unhandled rejection and a 401 body would be set as page data.
- **Evidence**: `fetch(\`/api/billing?email=${encodeURIComponent(token)}\`).then((r) => r.json()).then(setData)`
- **Impact**: The page stays on "Loading billing..." or renders from an error body; no data disclosure.
- **Remediation**: check `r.ok`, add `.catch`, show a generic error state. Recommend `/raise-defect` — outside Story 1.1's scope (Story 1.9 covers upgrade-request failures only).
- **References**: CWE-755, OWASP A10:2025

---

## Low Findings

### [SEC-001] New frontend devDependencies use caret ranges without a committed lockfile
- **Severity**: Low (unpinned, non-vulnerable, development-only dependencies)
- **Security Rule**: SECURITY-10 — Software Supply Chain Security
- **Verification Criteria Violated**: "A lock file exists and is committed to version control" (frontend package)
- **File(s)**: `src/frontend/package.json` (devDependencies added by this unit: vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, @amiceli/vitest-cucumber); `src/frontend/.gitignore` (ignores `package-lock.json` — repository convention that predates this unit)
- **Description**: The added packages follow the file's existing caret-range convention; with no committed lockfile, fresh installs may resolve newer versions. The root `package.json` + `package-lock.json` (Playwright) are committed with a lockfile.
- **Impact**: Non-reproducible test tooling installs; no runtime exposure (dev dependencies only). `npm audit`: 0 vulnerabilities.
- **Remediation**: commit `src/frontend/package-lock.json` (remove it from `src/frontend/.gitignore`) or pin exact versions — a repository-wide decision, recommend raising it as its own item.
- **References**: CWE-1357, OWASP A03:2025

---

## Security Baseline Compliance Matrix

| Security Rule | Rule Name | Status | Findings |
|---|---|---|---|
| SECURITY-01 | Encryption at Rest and in Transit | N/A — no data store or transport change | 0 |
| SECURITY-02 | Access Logging on Network Intermediaries | N/A — no intermediary | 0 |
| SECURITY-03 | Application-Level Logging | N/A — no server code or security event in the diff | 0 |
| SECURITY-04 | HTTP Security Headers | N/A — no HTML-serving endpoint changed | 0 |
| SECURITY-05 | Input Validation | Compliant — the dialog takes no user input; API text is rendered via JSX escaping (`Billing.jsx:182`, `UpgradeDialog.jsx:51`) | 0 |
| SECURITY-06 | Least-Privilege Access Policies | N/A — no IAM/policy | 0 |
| SECURITY-07 | Restrictive Network Configuration | N/A — no network config | 0 |
| SECURITY-08 | Application-Level Access Control | N/A — no endpoint added or changed | 0 |
| SECURITY-09 | Security Hardening | N/A — no server/runtime config (test configs only) | 0 |
| SECURITY-10 | Software Supply Chain Security | Non-Compliant (Low, advisory) | 1 |
| SECURITY-11 | Secure Design Principles | Compliant — the UI decides nothing about price or plan; no server trust placed in it | 0 |
| SECURITY-12 | Authentication and Credential Management | N/A — auth untouched | 0 |
| SECURITY-13 | Software and Data Integrity | N/A — no deserialization, CDN or pipeline (Containerfile base image pinned `node:22.14.0-bookworm-slim`) | 0 |
| SECURITY-14 | Alerting and Monitoring | N/A — no monitoring surface | 0 |
| SECURITY-15 | Exception Handling and Fail-Safe Defaults | Non-Compliant (Medium, pre-existing, advisory) — the diff adds no external call | 1 |
| SECURITY-16 | Cryptographic Standards | Compliant (N/A in practice — no crypto) | 0 |

---

## OWASP Reference Mapping

SEC-001 → A03:2025 Software Supply Chain Failures · SEC-002 → A10:2025 Mishandling of Exceptional Conditions.

---

## Recommendations Priority

### Immediate (Blocks Deployment)
None.

### Short-Term (Current Sprint)
None on this diff.

### Medium-Term (Current Release)
1. SEC-002 (pre-existing): add error handling to the Billing data fetch — raise with `/raise-defect`.

### Long-Term (Backlog)
1. SEC-001: decide on committing the frontend lockfile or pinning exact versions.

---

## Appendix

### Methodology
- Manual review of the story-1.1 diff (`git diff --cached ce9c3c2`) against SECURITY-01…16 verification criteria
- Rules source: `aire-workflow/extensions/security/baseline/security-baseline.md`

### Excluded from Scope
- Pre-existing, untouched code (e.g. email-as-token authentication, wildcard CORS in `src/backend/main.py`) — known from the Atlas deep dive, accepted as pre-existing risk (REQ-NF-05, Q3 A), not changed by this unit
