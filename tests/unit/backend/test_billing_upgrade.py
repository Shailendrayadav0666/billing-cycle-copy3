"""Unit tests for Story 1.1 — Mid-Cycle Subscription Upgrade (Standard -> Premium).

Covers REQ-F-04/07/05/06/08/09/10 business logic via direct function calls and the
FastAPI TestClient. See spec/plans/stories.md Story 1.1 for the acceptance criteria.
"""
from datetime import datetime, timedelta

import main as app_module
from fastapi.testclient import TestClient

client = TestClient(app_module.app)


def register(email: str) -> None:
    resp = client.post(
        "/api/auth/register",
        json={"name": "Test", "email": email, "password": "pw"},
    )
    assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------------------
# compute_prorated_charge (REQ-F-04, AC-5/AC-6)
# ---------------------------------------------------------------------------

def test_compute_prorated_charge_worked_example():
    renew_at = (datetime.today() + timedelta(days=15)).strftime("%b %d, %Y")
    days_remaining, prorated_charge = app_module.compute_prorated_charge(renew_at)
    assert days_remaining == 15
    assert prorated_charge == 10.00


def test_compute_prorated_charge_full_cycle():
    renew_at = (datetime.today() + timedelta(days=30)).strftime("%b %d, %Y")
    _, prorated_charge = app_module.compute_prorated_charge(renew_at)
    assert prorated_charge == 20.00


def test_compute_prorated_charge_clamped_to_minimum_one_day():
    # A renew_at date in the past must never produce a negative or zero charge.
    renew_at = (datetime.today() - timedelta(days=5)).strftime("%b %d, %Y")
    days_remaining, prorated_charge = app_module.compute_prorated_charge(renew_at)
    assert days_remaining == 1
    assert prorated_charge == round((40.0 - 20.0) / 30 * 1, 2)


def test_compute_prorated_charge_fails_closed_on_malformed_renew_at():
    # SECURITY-15: a malformed date must never propagate a raw ValueError/traceback.
    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        app_module.compute_prorated_charge("not-a-date")
    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Billing data unavailable"


# ---------------------------------------------------------------------------
# charge_card (REQ-F-07, AC-13)
# ---------------------------------------------------------------------------

def test_charge_card_success_for_normal_email():
    assert app_module.charge_card("sam@example.com", 10.0) == {"status": "success"}


def test_charge_card_declined_for_fail_prefixed_email():
    result = app_module.charge_card("fail-anything@example.com", 10.0)
    assert result == {"status": "card_declined", "message": "Your card was declined."}


# ---------------------------------------------------------------------------
# GET /api/billing/upgrade-preview (REQ-F-02/09/10, AC-6/7/8)
# ---------------------------------------------------------------------------

def test_preview_returns_prorated_values_for_standard_subscriber():
    register("unit-preview-1@example.com")
    resp = client.get("/api/billing/upgrade-preview", params={"email": "unit-preview-1@example.com"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["current_plan"] == "Standard"
    assert body["new_plan"] == "Premium"
    assert body["days_remaining"] == 30
    assert body["prorated_charge"] == 20.00
    assert body["next_renewal_price"] == 40.0


def test_preview_already_premium_returns_409():
    email = "unit-preview-premium@example.com"
    register(email)
    client.post("/api/billing/upgrade", json={"email": email})
    resp = client.get("/api/billing/upgrade-preview", params={"email": email})
    assert resp.status_code == 409
    assert resp.json() == {"detail": "already_premium"}


def test_preview_unknown_email_returns_401():
    resp = client.get("/api/billing/upgrade-preview", params={"email": "nobody-unit@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


# ---------------------------------------------------------------------------
# POST /api/billing/upgrade — happy path (REQ-F-05/08, AC-14/15)
# ---------------------------------------------------------------------------

def test_upgrade_success_flips_plan_and_updates_quotas():
    email = "unit-upgrade-success@example.com"
    register(email)
    renew_at_before = client.get("/api/billing", params={"email": email}).json()["renew_at"]

    resp = client.post("/api/billing/upgrade", json={"email": email})
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"status": "success", "plan": "Premium", "charge": 20.00}

    billing = client.get("/api/billing", params={"email": email}).json()
    assert billing["plan_name"] == "Premium"
    assert billing["price"] == "$40/month"
    assert billing["renew_at"] == renew_at_before  # REQ-F-05: renew_at untouched

    usages = {u["id"]: u for u in billing["usages"]}
    assert usages["chat-credits"]["total"] == 10000
    assert usages["chatbots"]["total"] == 10
    assert usages["documents-pages"]["total"] == 5000
    assert billing["on_demand_usage"]["notice"] == "On-demand credit is available on your Premium plan."

    me = client.get("/api/users/me", params={"email": email}).json()
    assert me["plan"] == "Premium"
    assert me["price"] == "$40/month"


def test_upgrade_already_premium_returns_409_and_does_not_charge_again():
    email = "unit-upgrade-premium@example.com"
    register(email)
    client.post("/api/billing/upgrade", json={"email": email})
    resp = client.post("/api/billing/upgrade", json={"email": email})
    assert resp.status_code == 409
    assert resp.json() == {"detail": "already_premium"}


def test_upgrade_unknown_email_returns_401():
    resp = client.post("/api/billing/upgrade", json={"email": "nobody-upgrade@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


# ---------------------------------------------------------------------------
# POST /api/billing/upgrade — decline path (REQ-F-06, AC-18/19)
# ---------------------------------------------------------------------------

def test_upgrade_declined_returns_402_with_message():
    email = "fail-unit-decline@example.com"
    register(email)
    resp = client.post("/api/billing/upgrade", json={"email": email})
    assert resp.status_code == 402
    assert resp.json() == {"detail": "card_declined", "message": "Your card was declined."}


def test_upgrade_declined_leaves_state_byte_for_byte_unchanged():
    email = "fail-unit-nomutate@example.com"
    register(email)
    billing_before = client.get("/api/billing", params={"email": email}).json()
    user_before = client.get("/api/users/me", params={"email": email}).json()

    client.post("/api/billing/upgrade", json={"email": email})

    billing_after = client.get("/api/billing", params={"email": email}).json()
    user_after = client.get("/api/users/me", params={"email": email}).json()
    assert billing_after == billing_before
    assert user_after == user_before
