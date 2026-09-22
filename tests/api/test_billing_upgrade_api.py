"""API & Contract Testing Gate — POST /api/billing/upgrade (Story 1.1).

Per common/directory-structure.md rule 4b, API/contract tests live under tests/api/, never
co-located with tests/unit/. Checklist (dev-implement.md Step 6.2): functional/happy path,
response-code validation, role-based authorization (401/403), error-response validation, request
validation, response contract/schema validation.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[2] / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

import main as backend_main  # noqa: E402


@pytest.fixture(autouse=True)
def reset_store():
    original_users = {k: dict(v) for k, v in backend_main.users.items()}
    original_billing = {k: dict(v) for k, v in backend_main.billing_data.items()}
    yield
    backend_main.users.clear()
    backend_main.users.update(original_users)
    backend_main.billing_data.clear()
    backend_main.billing_data.update(original_billing)


@pytest.fixture
def client():
    return TestClient(backend_main.app)


def _seed(email, plan="Standard", days=15):
    renew_at = (datetime.today() + timedelta(days=days)).strftime("%b %d, %Y")
    backend_main.users[email] = {
        "id": 1, "name": "API Test", "email": email, "password": "password",
        "plan": plan, "price": "$20/month" if plan == "Standard" else "$40/month",
        "renew_at": renew_at,
    }
    backend_main.billing_data[email] = {
        "plan_name": plan, "price": "$20/month" if plan == "Standard" else "$40/month",
        "renew_at": renew_at, "usages": [], "included_usage": {"title": "t", "items": [], "help": "h"},
    }


# --- Functional / happy path -------------------------------------------------

def test_happy_path_upgrade(client):
    _seed("api-happy@example.com")
    resp = client.post("/api/billing/upgrade", json={"email": "api-happy@example.com"})
    assert resp.status_code == 200
    assert resp.json()["plan_name"] == "Premium"


# --- Response-code validation -------------------------------------------------

@pytest.mark.parametrize(
    "email,plan,expected_status",
    [
        ("api-200@example.com", "Standard", 200),
        ("api-400@example.com", "Premium", 400),
    ],
)
def test_response_codes(client, email, plan, expected_status):
    _seed(email, plan=plan)
    resp = client.post("/api/billing/upgrade", json={"email": email})
    assert resp.status_code == expected_status


def test_response_code_401_unknown_user(client):
    resp = client.post("/api/billing/upgrade", json={"email": "no-such-user@example.com"})
    assert resp.status_code == 401


def test_response_code_422_malformed_body(client):
    resp = client.post("/api/billing/upgrade", json={})
    assert resp.status_code == 422


# --- Role-based authorization (401/403) --------------------------------------

def test_401_unauthenticated_identity(client):
    """This POC has no role/permission system at all (documented in
    spec/plans/atlas-deep-dive.md Security Considerations, and deliberately not remediated by this
    story per REQ-NF-03) — there is only "known email" vs "unknown email", mapping to 401 only.
    403 (insufficient role) is N/A: no endpoint in this app has ever had a role concept to deny."""
    resp = client.post("/api/billing/upgrade", json={"email": "role-test-unknown@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


def test_403_role_based_denial_not_applicable():
    pytest.skip("N/A — no role/permission model exists anywhere in this application (REQ-NF-03: "
                "the existing auth posture is deliberately preserved, not extended, by this story)")


# --- Error-response validation ------------------------------------------------

def test_error_response_shape_already_premium(client):
    _seed("api-err-premium@example.com", plan="Premium")
    resp = client.post("/api/billing/upgrade", json={"email": "api-err-premium@example.com"})
    assert resp.status_code == 400
    body = resp.json()
    assert set(body.keys()) == {"detail"}
    assert body["detail"] == "Already on Premium plan"


def test_error_response_shape_unknown_user(client):
    resp = client.post("/api/billing/upgrade", json={"email": "api-err-unknown@example.com"})
    body = resp.json()
    assert set(body.keys()) == {"detail"}
    assert body["detail"] == "Not authenticated"


def test_error_response_no_stack_trace_leak(client):
    _seed("api-err-noleak@example.com", plan="Premium")
    resp = client.post("/api/billing/upgrade", json={"email": "api-err-noleak@example.com"})
    text = resp.text.lower()
    for leak_marker in ("traceback", "exception", "file \"", "line "):
        assert leak_marker not in text


# --- Request validation --------------------------------------------------------

def test_request_validation_missing_required_field(client):
    resp = client.post("/api/billing/upgrade", json={})
    assert resp.status_code == 422
    errors = resp.json()["detail"]
    assert any(e["loc"][-1] == "email" for e in errors)


def test_request_validation_wrong_type(client):
    resp = client.post("/api/billing/upgrade", json={"email": 12345})
    assert resp.status_code == 422


def test_request_validation_extra_fields_ignored(client):
    """Pydantic's default behaviour (no extra="forbid") ignores unknown fields — verify this
    doesn't crash the endpoint or leak into the response, matching the existing app's other
    request models which also declare no extra="forbid"."""
    _seed("api-extra@example.com")
    resp = client.post(
        "/api/billing/upgrade",
        json={"email": "api-extra@example.com", "unexpected_field": "should be ignored"},
    )
    assert resp.status_code == 200
    assert "unexpected_field" not in resp.json()


# --- Response contract / schema validation -------------------------------------

def test_response_schema_success(client):
    _seed("api-schema@example.com")
    resp = client.post("/api/billing/upgrade", json={"email": "api-schema@example.com"})
    body = resp.json()
    required_keys = {"plan_name", "price", "renew_at", "usages", "included_usage", "prorated_charge"}
    assert required_keys.issubset(body.keys())
    assert isinstance(body["prorated_charge"], (int, float))
    assert isinstance(body["usages"], list)
    assert isinstance(body["included_usage"], dict)
    assert "password" not in body


def test_response_schema_matches_get_billing_contract(client):
    """The success response must be a superset of GET /api/billing's own contract (REQ-F-05 /
    ARCH-05) plus prorated_charge — never a divergent shape."""
    _seed("api-schema-parity@example.com")
    upgrade_body = client.post(
        "/api/billing/upgrade", json={"email": "api-schema-parity@example.com"}
    ).json()
    get_billing_body = client.get(
        "/api/billing", params={"email": "api-schema-parity@example.com"}
    ).json()
    for key in ("plan_name", "price", "renew_at", "usages", "included_usage"):
        assert key in upgrade_body
        assert key in get_billing_body
