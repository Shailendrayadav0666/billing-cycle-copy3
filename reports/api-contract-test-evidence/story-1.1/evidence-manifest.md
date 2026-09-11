# API & Contract Testing Gate — Story 1.1

**Command**: `pytest tests/unit/backend/test_billing_upgrade_api.py -v --junitxml=api-contract-test-report.xml`
**Result**: 14/14 passing.

## Per-endpoint checklist

### `GET /api/billing/upgrade-preview`
| # | Item | Result | Note |
|---|---|---|---|
| 1 | Functional / happy path | Pass | `test_preview_1_functional_happy_path` |
| 2 | Response Code Validation | Pass | 200 (Standard) / 401 (unknown email) / 409 (already Premium) — `test_preview_2_response_codes` |
| 3 | Authorization (401 vs 403) | Pass (401) / **N/A (403)** | This app has one access tier (registered vs not) — no role/permission concept, so no 403 case exists. `test_preview_3_authorization_401_unauthenticated` |
| 4 | Error Response Validation | Pass | 401 and 409 bodies are exactly `{"detail": ...}` — `test_preview_4_error_response_schema` |
| 5 | Request Validation | Pass | Missing required `email` query param -> 422 — `test_preview_5_request_validation_missing_email_param` |
| 6 | Response Contract Validation | Pass | Exact key set + types on the 200 body — `test_preview_6_response_contract_schema` |

### `POST /api/billing/upgrade`
| # | Item | Result | Note |
|---|---|---|---|
| 1 | Functional / happy path | Pass | `test_upgrade_1_functional_happy_path` |
| 2 | Response Code Validation | Pass | 200 / 401 / 409 / 402 — `test_upgrade_2_response_codes` |
| 3 | Authorization (401 vs 403) | Pass (401) / **N/A (403)** | Same reason as above. `test_upgrade_3_authorization_401_unauthenticated` |
| 4 | Error Response Validation | Pass | 401/409 -> `{"detail"}`; 402 -> `{"detail","message"}` — `test_upgrade_4_error_response_schema` |
| 5 | Request Validation | Pass | Missing `email` field -> 422; wrong type (`int` instead of `str`) -> 422 — `test_upgrade_5_request_validation_missing_email_field`, `test_upgrade_5_request_validation_wrong_type_email_field` |
| 6 | Response Contract Validation | Pass | Success body `{status,plan,charge}`; declined body `{detail,message}` — `test_upgrade_6_response_contract_schema_success`, `test_upgrade_6_response_contract_schema_declined` |

**Artifacts**: `api-contract-test-run.log` (raw pytest output), `api-contract-test-report.xml` (JUnit XML, built into pytest via `--junitxml`).
