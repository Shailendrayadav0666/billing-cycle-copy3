"""API & Contract Testing Gate — Story 1.1 (code-generation.md Step 11a.5).

Six-item checklist, applied to BOTH new endpoints:
  1. Functional / happy path
  2. Response Code Validation
  3. Authorization (role-based: 401 vs 403)
  4. Error Response Validation (schema)
  5. Request Validation (inbound contract)
  6. Response Contract Validation (outbound contract)

This app has exactly one access tier (registered vs not) — there is no role/permission
concept beyond "is this email in `users`", so every 403 checklist item is N/A here,
stated explicitly per item rather than silently omitted.
"""
import main as app_module
from fastapi.testclient import TestClient

client = TestClient(app_module.app)


def register(email: str) -> None:
    resp = client.post(
        "/api/auth/register",
        json={"name": "Test", "email": email, "password": "pw"},
    )
    assert resp.status_code == 200, resp.text


# ===========================================================================
# GET /api/billing/upgrade-preview
# ===========================================================================

def test_preview_1_functional_happy_path():
    email = "api-preview-happy@example.com"
    register(email)
    resp = client.get("/api/billing/upgrade-preview", params={"email": email})
    assert resp.status_code == 200
    body = resp.json()
    assert body["current_plan"] == "Standard"
    assert body["new_plan"] == "Premium"


def test_preview_2_response_codes():
    ok_email = "api-preview-codes-ok@example.com"
    register(ok_email)
    assert client.get("/api/billing/upgrade-preview", params={"email": ok_email}).status_code == 200

    unknown_email_resp = client.get("/api/billing/upgrade-preview", params={"email": "api-preview-nobody@example.com"})
    assert unknown_email_resp.status_code == 401

    premium_email = "api-preview-codes-premium@example.com"
    register(premium_email)
    client.post("/api/billing/upgrade", json={"email": premium_email})
    assert client.get("/api/billing/upgrade-preview", params={"email": premium_email}).status_code == 409


def test_preview_3_authorization_401_unauthenticated():
    # No 403 case exists in this app (no role/permission tier beyond authenticated-or-not) — N/A, stated here.
    resp = client.get("/api/billing/upgrade-preview", params={"email": "api-preview-unauth@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


def test_preview_4_error_response_schema():
    unauth = client.get("/api/billing/upgrade-preview", params={"email": "api-preview-err-unauth@example.com"})
    assert set(unauth.json().keys()) == {"detail"}

    email = "api-preview-err-premium@example.com"
    register(email)
    client.post("/api/billing/upgrade", json={"email": email})
    conflict = client.get("/api/billing/upgrade-preview", params={"email": email})
    assert set(conflict.json().keys()) == {"detail"}


def test_preview_5_request_validation_missing_email_param():
    resp = client.get("/api/billing/upgrade-preview")
    assert resp.status_code == 422  # FastAPI's own request validation on the required query param


def test_preview_6_response_contract_schema():
    email = "api-preview-contract@example.com"
    register(email)
    body = client.get("/api/billing/upgrade-preview", params={"email": email}).json()
    assert set(body.keys()) == {
        "current_plan",
        "new_plan",
        "days_remaining",
        "prorated_charge",
        "next_renewal_price",
        "renew_at",
    }
    assert isinstance(body["current_plan"], str)
    assert isinstance(body["new_plan"], str)
    assert isinstance(body["days_remaining"], int)
    assert isinstance(body["prorated_charge"], (int, float))
    assert isinstance(body["next_renewal_price"], (int, float))
    assert isinstance(body["renew_at"], str)


# ===========================================================================
# POST /api/billing/upgrade
# ===========================================================================

def test_upgrade_1_functional_happy_path():
    email = "api-upgrade-happy@example.com"
    register(email)
    resp = client.post("/api/billing/upgrade", json={"email": email})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


def test_upgrade_2_response_codes():
    ok_email = "api-upgrade-codes-ok@example.com"
    register(ok_email)
    assert client.post("/api/billing/upgrade", json={"email": ok_email}).status_code == 200

    unknown_resp = client.post("/api/billing/upgrade", json={"email": "api-upgrade-nobody@example.com"})
    assert unknown_resp.status_code == 401

    premium_email = "api-upgrade-codes-premium@example.com"
    register(premium_email)
    client.post("/api/billing/upgrade", json={"email": premium_email})
    assert client.post("/api/billing/upgrade", json={"email": premium_email}).status_code == 409

    decline_email = "fail-api-upgrade-codes@example.com"
    register(decline_email)
    decline_resp = client.post("/api/billing/upgrade", json={"email": decline_email})
    assert decline_resp.status_code == 402


def test_upgrade_3_authorization_401_unauthenticated():
    # No 403 case exists in this app — N/A, stated here.
    resp = client.post("/api/billing/upgrade", json={"email": "api-upgrade-unauth@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


def test_upgrade_4_error_response_schema():
    unauth = client.post("/api/billing/upgrade", json={"email": "api-upgrade-err-unauth@example.com"})
    assert set(unauth.json().keys()) == {"detail"}

    email = "api-upgrade-err-premium@example.com"
    register(email)
    client.post("/api/billing/upgrade", json={"email": email})
    conflict = client.post("/api/billing/upgrade", json={"email": email})
    assert set(conflict.json().keys()) == {"detail"}

    decline_email = "fail-api-upgrade-err-decline@example.com"
    register(decline_email)
    decline = client.post("/api/billing/upgrade", json={"email": decline_email})
    assert set(decline.json().keys()) == {"detail", "message"}
    assert decline.json()["detail"] == "card_declined"


def test_upgrade_5_request_validation_missing_email_field():
    resp = client.post("/api/billing/upgrade", json={})
    assert resp.status_code == 422  # Pydantic request-body validation on the required field


def test_upgrade_5_request_validation_wrong_type_email_field():
    resp = client.post("/api/billing/upgrade", json={"email": 12345})
    assert resp.status_code == 422


def test_upgrade_6_response_contract_schema_success():
    email = "api-upgrade-contract-success@example.com"
    register(email)
    body = client.post("/api/billing/upgrade", json={"email": email}).json()
    assert set(body.keys()) == {"status", "plan", "charge"}
    assert body["status"] == "success"
    assert body["plan"] == "Premium"
    assert isinstance(body["charge"], (int, float))


def test_upgrade_6_response_contract_schema_declined():
    email = "fail-api-upgrade-contract-declined@example.com"
    register(email)
    body = client.post("/api/billing/upgrade", json={"email": email}).json()
    assert set(body.keys()) == {"detail", "message"}
    assert body["detail"] == "card_declined"
    assert body["message"] == "Your card was declined."
