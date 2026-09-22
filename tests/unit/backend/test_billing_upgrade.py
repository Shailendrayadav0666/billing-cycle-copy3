"""Unit tests for POST /api/billing/upgrade (Story 1.1).

Traces to: REQ-F-04, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-08, AC-5, AC-6, AC-7.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[3] / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

import main as backend_main  # noqa: E402


@pytest.fixture(autouse=True)
def reset_store():
    """Reset the in-memory stores before every test so tests don't leak state."""
    original_users = {
        k: dict(v) for k, v in backend_main.users.items()
    }
    original_billing = {
        k: dict(v) for k, v in backend_main.billing_data.items()
    }
    yield
    backend_main.users.clear()
    backend_main.users.update(original_users)
    backend_main.billing_data.clear()
    backend_main.billing_data.update(original_billing)


@pytest.fixture
def client():
    return TestClient(backend_main.app)


def _seed_user(email, plan="Standard", renew_in_days=15):
    renew_at = (datetime.today() + timedelta(days=renew_in_days)).strftime("%b %d, %Y")
    backend_main.users[email] = {
        "id": 999,
        "name": "Test User",
        "email": email,
        "password": "password",
        "plan": plan,
        "price": "$20/month" if plan == "Standard" else "$40/month",
        "renew_at": renew_at,
    }
    backend_main.billing_data[email] = {
        "plan_name": plan,
        "price": "$20/month" if plan == "Standard" else "$40/month",
        "renew_at": renew_at,
        "usages": [],
        "included_usage": {"title": "Plan perks", "items": [], "help": ""},
    }
    return email


def test_calculate_days_remaining_clamps_to_zero_when_past():
    past = (datetime.today() - timedelta(days=5)).strftime("%b %d, %Y")
    assert backend_main.calculate_days_remaining(past) == 0


def test_calculate_days_remaining_clamps_to_thirty_when_far_future():
    far_future = (datetime.today() + timedelta(days=90)).strftime("%b %d, %Y")
    assert backend_main.calculate_days_remaining(far_future) == 30


def test_calculate_days_remaining_normal_case():
    fifteen_days = (datetime.today() + timedelta(days=15)).strftime("%b %d, %Y")
    assert backend_main.calculate_days_remaining(fifteen_days) == 15


def test_successful_upgrade_returns_full_billing_contract(client):
    email = _seed_user("upgrade-happy@example.com", plan="Standard", renew_in_days=15)

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert resp.status_code == 200
    body = resp.json()
    assert body["plan_name"] == "Premium"
    assert body["price"] == "$40/month"
    assert body["prorated_charge"] == 10.00
    assert "usages" in body and "included_usage" in body
    video_quality = next(u for u in body["usages"] if u["id"] == "video-quality")
    assert video_quality["value"] == "4K Ultra HD"
    screens = next(u for u in body["usages"] if u["id"] == "screens")
    assert screens["value"] == "Can watch on 4 devices at once"
    downloads = next(u for u in body["usages"] if u["id"] == "downloads")
    assert downloads["value"] == "Can download on 6 devices"
    perk_ids = {item["id"] for item in body["included_usage"]["items"]}
    assert {"ad-free", "spatial-audio", "dolby-vision"}.issubset(perk_ids)


def test_upgrade_leaves_renew_at_unchanged(client):
    email = _seed_user("renew-unchanged@example.com", plan="Standard", renew_in_days=15)
    before = backend_main.billing_data[email]["renew_at"]

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert resp.json()["renew_at"] == before


def test_upgrade_boundary_zero_days_remaining(client):
    email = _seed_user("boundary-zero@example.com", plan="Standard", renew_in_days=0)

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert resp.status_code == 200
    assert resp.json()["prorated_charge"] == 0.00


def test_upgrade_boundary_full_cycle_remaining(client):
    email = _seed_user("boundary-full@example.com", plan="Standard", renew_in_days=30)

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert resp.status_code == 200
    assert resp.json()["prorated_charge"] == 20.00


def test_already_premium_guard(client):
    email = _seed_user("already-premium@example.com", plan="Premium", renew_in_days=15)

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Already on Premium plan"
    # No mutation occurred
    assert backend_main.users[email]["plan"] == "Premium"


def test_unknown_user_guard(client):
    resp = client.post("/api/billing/upgrade", json={"email": "ghost-not-real@example.com"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Not authenticated"


def test_malformed_request_missing_email(client):
    resp = client.post("/api/billing/upgrade", json={})

    assert resp.status_code == 422


def test_malformed_request_wrong_type(client):
    resp = client.post("/api/billing/upgrade", json={"email": 12345})

    assert resp.status_code == 422


def test_response_never_includes_password(client):
    email = _seed_user("no-password-leak@example.com", plan="Standard", renew_in_days=15)

    resp = client.post("/api/billing/upgrade", json={"email": email})

    assert "password" not in resp.text
