# API & Contract Testing Gate Evidence — Story 1.1

**Endpoint**: `POST /api/billing/upgrade` (query param `dry_run`)
**Command**: `pytest tests/api/ --junitxml=api-contract-test-report.xml` (FastAPI TestClient / httpx)
**Tests passing**: 12/12

## Checklist (per endpoint)

| # | Checklist item | Result | Notes |
|---|---|---|---|
| 1 | Functional / happy path | Pass | `test_preview_returns_prorated_charge_without_mutating_plan`, `test_apply_upgrades_plan_and_returns_applied_charge` |
| 2 | Response Code Validation | Pass | 200 (preview/apply), 400 (idempotency), 401 (unknown email), 422 (validation) all asserted |
| 3 | Authorization — role-based | Pass (401) / N/A (403) | 401 for unauthenticated (unknown) email — `test_unauthenticated_email_returns_401` / `..._preview_also_returns_401`. 403 is N/A: this app has no role-tier concept — every authenticated identity has equal access to its own account, matching every other existing endpoint |
| 4 | Error Response Validation | Pass | `test_already_premium_returns_400_with_error_envelope` — asserts `detail` key present |
| 5 | Request Validation (inbound) | Pass | `test_missing_email_field_is_rejected` (422), `test_wrong_type_email_field_is_rejected` (422) |
| 6 | Response Contract Validation (outbound) | Pass | `test_preview_response_contract` (prorated_charge/current_plan/new_plan/days_remaining), `test_apply_response_contract` (applied_charge/plan/billing) |

## Artifacts
- `api-contract-test-run.log` — raw pytest output
- `api-contract-test-report.xml` — JUnit XML (pytest `--junitxml`)
