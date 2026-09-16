"""API & Contract Testing Gate — POST /api/billing/upgrade (Story 1.1).

Calls the real FastAPI app via TestClient (httpx-based) — never mocks the endpoint. Lives under
tests/api/ per common/directory-structure.md rule 4b (never under tests/unit/, never colocated
with the pure business-logic unit tests in tests/unit/backend/).

Checklist covered (implementation/code-generation.md Step 11a.5):
  1. Functional / happy path            -> test_preview_* , test_apply_*
  2. Response Code Validation            -> every test asserts status_code
  3. Authorization (role-based)          -> test_unauthenticated_email_returns_401
                                             (403/role-tier: N/A - this app has no role tiers,
                                             only a single authenticated-user identity check)
  4. Error Response Validation           -> test_already_premium_returns_400_with_error_envelope
  5. Request Validation (inbound)        -> test_missing_email_field_is_rejected
  6. Response Contract Validation        -> test_preview_response_contract / test_apply_response_contract
"""

import copy
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

EXISTING_EMAIL = "tpg@example.com"


@pytest.fixture(autouse=True)
def _isolate_module_state():
    """main.users / main.billing_data are process-wide module globals mutated by the endpoint.
    Snapshot and restore them around every test so tests never leak state into each other."""
    users_before = copy.deepcopy(main.users)
    billing_before = copy.deepcopy(main.billing_data)
    yield
    main.users.clear()
    main.users.update(users_before)
    main.billing_data.clear()
    main.billing_data.update(billing_before)


def _set_renew_in(days: int) -> None:
    renew_at = (datetime.today() + timedelta(days=days)).strftime("%b %d, %Y")
    main.billing_data[EXISTING_EMAIL]["renew_at"] = renew_at
    main.users[EXISTING_EMAIL]["renew_at"] = renew_at


# ── 1/6. Functional + Response Code + Response Contract: preview ──────────────────────────────

def test_preview_returns_prorated_charge_without_mutating_plan():
    _set_renew_in(15)
    resp = client.post("/api/billing/upgrade?dry_run=true", json={"email": EXISTING_EMAIL})
    assert resp.status_code == 200
    body = resp.json()
    assert body["prorated_charge"] == 10.00
    assert body["current_plan"] == "Standard"
    assert body["new_plan"] == "Premium"
    # Preview must never mutate state (ARCH-03)
    assert main.billing_data[EXISTING_EMAIL]["plan_name"] == "Standard"


def test_preview_response_contract():
    resp = client.post("/api/billing/upgrade?dry_run=true", json={"email": EXISTING_EMAIL})
    body = resp.json()
    for key in ("prorated_charge", "current_plan", "new_plan", "days_remaining"):
        assert key in body
    assert isinstance(body["prorated_charge"], (int, float))
    assert isinstance(body["days_remaining"], int)


# ── 1/6. Functional + Response Code + Response Contract: apply ────────────────────────────────

def test_apply_upgrades_plan_and_returns_applied_charge():
    _set_renew_in(15)
    resp = client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})
    assert resp.status_code == 200
    body = resp.json()
    assert body["applied_charge"] == 10.00
    assert body["plan"] == "Premium"
    assert main.billing_data[EXISTING_EMAIL]["plan_name"] == "Premium"
    assert main.users[EXISTING_EMAIL]["plan"] == "Premium"


def test_apply_response_contract():
    resp = client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})
    body = resp.json()
    for key in ("applied_charge", "plan", "billing"):
        assert key in body
    assert body["billing"]["plan_name"] == "Premium"


def test_apply_updates_usage_limits_to_premium():
    resp = client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})
    usages = {u["id"]: u for u in resp.json()["billing"]["usages"]}
    assert usages["chat-credits"]["total"] == main.PLAN_CATALOG["Premium"]["limits"]["chat-credits"]
    assert usages["chatbots"]["total"] == main.PLAN_CATALOG["Premium"]["limits"]["chatbots"]


def test_apply_does_not_change_on_demand_balance():
    before = main.billing_data[EXISTING_EMAIL]["on_demand_usage"]["remaining_balance"]
    resp = client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})
    after = resp.json()["billing"]["on_demand_usage"]["remaining_balance"]
    assert after == before


# ── 4. Error Response Validation: idempotency guard ────────────────────────────────────────────

def test_already_premium_returns_400_with_error_envelope():
    client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})  # first upgrade succeeds
    resp = client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})  # second attempt
    assert resp.status_code == 400
    assert "detail" in resp.json()
    assert main.billing_data[EXISTING_EMAIL]["plan_name"] == "Premium"  # still Premium, no double charge


def test_already_premium_preview_also_returns_400():
    client.post("/api/billing/upgrade", json={"email": EXISTING_EMAIL})
    resp = client.post("/api/billing/upgrade?dry_run=true", json={"email": EXISTING_EMAIL})
    assert resp.status_code == 400


# ── 3. Authorization ─────────────────────────────────────────────────────────────────────────

def test_unauthenticated_email_returns_401():
    resp = client.post("/api/billing/upgrade", json={"email": "unknown@example.com"})
    assert resp.status_code == 401


def test_unauthenticated_email_preview_also_returns_401():
    resp = client.post("/api/billing/upgrade?dry_run=true", json={"email": "unknown@example.com"})
    assert resp.status_code == 401


# ── 5. Request Validation ───────────────────────────────────────────────────────────────────────

def test_missing_email_field_is_rejected():
    resp = client.post("/api/billing/upgrade", json={})
    assert resp.status_code == 422


def test_wrong_type_email_field_is_rejected():
    resp = client.post("/api/billing/upgrade", json={"email": 12345})
    assert resp.status_code == 422
