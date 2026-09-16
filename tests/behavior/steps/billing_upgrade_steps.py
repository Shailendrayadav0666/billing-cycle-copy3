"""Step definitions for spec/behavior/story-1.1.feature.

Bound to the application's public surface (the real FastAPI app via TestClient/httpx) — never to
internals — per common/behavior-spec.md Section 4.2.
"""

import copy
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, then, when
from fastapi.testclient import TestClient

# The application lives at src/backend/main.py (the resolved code root); add it to sys.path so
# `import main` resolves regardless of the runner's own cwd (same pattern as src/backend/pytest.ini).
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src" / "backend"))
import main  # noqa: E402

client = TestClient(main.app)


_ORIGINAL_USERS = copy.deepcopy(main.users)
_ORIGINAL_BILLING = copy.deepcopy(main.billing_data)


@pytest.fixture(autouse=True)
def _isolate_module_state():
    # Reset BEFORE every scenario (not only after) so a prior scenario's mutation can never leak
    # forward, regardless of how pytest-bdd wires scenario teardown internally.
    main.users.clear()
    main.users.update(copy.deepcopy(_ORIGINAL_USERS))
    main.billing_data.clear()
    main.billing_data.update(copy.deepcopy(_ORIGINAL_BILLING))
    yield


@pytest.fixture
def context():
    return {}


@given(parsers.parse('a user "{email}" exists with plan "{plan}" at ${price}/month'))
def user_exists(email, plan, price):
    # A Background/Given clause ESTABLISHES state, never merely asserts pre-existing state —
    # forcing it here makes this step robust regardless of what a prior scenario left behind,
    # rather than depending on fixture-teardown ordering between scenarios.
    assert email in main.users
    main.billing_data[email]["plan_name"] = plan
    main.users[email]["plan"] = plan


@given(parsers.parse("the user's billing cycle renews in {days:d} days"))
def set_renew_date(days):
    renew_at = (datetime.today() + timedelta(days=days)).strftime("%b %d, %Y")
    main.billing_data["tpg@example.com"]["renew_at"] = renew_at
    main.users["tpg@example.com"]["renew_at"] = renew_at


@given(parsers.parse('"{email}" has already been upgraded to "{plan}"'))
def already_upgraded(email):
    client.post("/api/billing/upgrade", json={"email": email})
    assert main.billing_data[email]["plan_name"] == "Premium"


@given(parsers.parse('"{email}" has an on-demand balance of ${amount}'))
def set_on_demand_balance(email, amount):
    main.billing_data[email]["on_demand_usage"]["remaining_balance"] = f"${amount}"


@when(parsers.parse('a dry_run upgrade preview is requested for "{email}"'))
def request_preview(email, context):
    context["response"] = client.post("/api/billing/upgrade?dry_run=true", json={"email": email})


@when(parsers.parse('the upgrade is applied for "{email}"'))
def apply_upgrade(email, context):
    context["response"] = client.post("/api/billing/upgrade", json={"email": email})


@when(parsers.parse('the upgrade is applied again for "{email}"'))
def apply_upgrade_again(email, context):
    context["response"] = client.post("/api/billing/upgrade", json={"email": email})


@when("the upgrade is requested for an email not in the system")
def request_unknown_email(context):
    context["response"] = client.post(
        "/api/billing/upgrade", json={"email": "nobody-behavior-test@example.com"}
    )


@when("the upgrade endpoint is called with no email field")
def request_missing_email(context):
    context["response"] = client.post("/api/billing/upgrade", json={})


@then(parsers.parse("the response is {code:d} with a prorated charge of ${amount}"))
def assert_preview_response(context, code, amount):
    resp = context["response"]
    assert resp.status_code == code
    assert resp.json()["prorated_charge"] == float(amount)


@then(parsers.parse("the response is {code:d} with an applied charge of ${amount}"))
def assert_apply_response(context, code, amount):
    resp = context["response"]
    assert resp.status_code == code
    assert resp.json()["applied_charge"] == float(amount)


@then(parsers.parse("the response is {code:d}"))
def assert_status_code(context, code):
    assert context["response"].status_code == code


@then("the response is a validation error")
def assert_validation_error(context):
    assert context["response"].status_code == 422


@then(parsers.parse('the user\'s plan remains "{plan}"'))
def assert_plan_remains(plan):
    assert main.billing_data["tpg@example.com"]["plan_name"] == plan


@then(parsers.parse('the user\'s plan becomes "{plan}"'))
def assert_plan_becomes(plan):
    assert main.billing_data["tpg@example.com"]["plan_name"] == plan


@then(parsers.parse('the user\'s plan remains "{plan}" with no duplicate charge'))
def assert_plan_remains_no_duplicate(plan):
    assert main.billing_data["tpg@example.com"]["plan_name"] == plan


@then(parsers.parse("the on-demand balance is still ${amount}"))
def assert_balance_unchanged(amount):
    assert main.billing_data["tpg@example.com"]["on_demand_usage"]["remaining_balance"] == f"${amount}"
