# API & Contract Testing Gate Evidence — Story 1.1

**Endpoint under test**: `POST /api/billing/upgrade`
**Command**: `python -m pytest tests/api/test_billing_upgrade_api.py -v --junitxml=reports/api-contract-test-evidence/story-1.1/api-contract-test-report.xml`
**Result**: 14 passed, 1 skipped (N/A, documented), 0 failed

## Checklist coverage

| Item | Status | Test(s) |
|---|---|---|
| Functional / happy path | ✅ | `test_happy_path_upgrade` |
| Response-code validation | ✅ | `test_response_codes` (200/400 parametrized), `test_response_code_401_unknown_user`, `test_response_code_422_malformed_body` |
| Role-based authorization — 401 | ✅ | `test_401_unauthenticated_identity` |
| Role-based authorization — 403 | N/A | `test_403_role_based_denial_not_applicable` — this application has no role/permission model anywhere (documented in `spec/plans/atlas-deep-dive.md` Security Considerations); REQ-NF-03 deliberately preserves rather than extends the existing auth posture, so introducing a 403-capable role check would be out of scope for this story |
| Error-response validation | ✅ | `test_error_response_shape_already_premium`, `test_error_response_shape_unknown_user`, `test_error_response_no_stack_trace_leak` |
| Request validation | ✅ | `test_request_validation_missing_required_field`, `test_request_validation_wrong_type`, `test_request_validation_extra_fields_ignored` |
| Response contract/schema validation | ✅ | `test_response_schema_success`, `test_response_schema_matches_get_billing_contract` |

## Files
- `api-contract-test-run.log` — raw runner output
- `api-contract-test-report.xml` — machine-readable JUnit XML report

## Verdict
**PASS** — every applicable checklist item passes; the one N/A item is a documented, structural fact about the application (no RBAC exists anywhere), not a gap this story introduced or should fix.
