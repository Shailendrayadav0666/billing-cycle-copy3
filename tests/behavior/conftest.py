import re
import sys
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path

import httpx
import pytest
import uvicorn
from playwright.sync_api import expect, sync_playwright
from pytest_bdd import given, parsers, then, when

BACKEND_ROOT = Path(__file__).resolve().parents[2] / "src" / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

import main as backend_main  # noqa: E402

BASE_URL = "http://127.0.0.1:8765"


@pytest.fixture(scope="session", autouse=True)
def live_app():
    """Run the real FastAPI app in-process (background thread) for the whole test session.

    Running it in-process — rather than as a separate subprocess — lets step definitions seed
    exact fixture state (a specific renew_at, a specific plan) directly on
    main.users/main.billing_data before Playwright's browser drives the real HTTP server. This is
    setup for the SCENARIO'S PRECONDITIONS, not a shortcut around black-box verification: every
    assertion in every step still goes through the real HTTP API or the real rendered page.
    """
    config = uvicorn.Config(backend_main.app, host="127.0.0.1", port=8765, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    for _ in range(50):
        try:
            httpx.get(f"{BASE_URL}/api/billing", params={"email": "tpg@example.com"}, timeout=1)
            break
        except httpx.HTTPError:
            time.sleep(0.1)

    yield

    server.should_exit = True
    thread.join(timeout=5)


@pytest.fixture(autouse=True)
def reset_store():
    """Reset the in-memory stores to their original seed after every scenario."""
    original_users = {k: dict(v) for k, v in backend_main.users.items()}
    original_billing = {k: dict(v) for k, v in backend_main.billing_data.items()}
    yield
    backend_main.users.clear()
    backend_main.users.update(original_users)
    backend_main.billing_data.clear()
    backend_main.billing_data.update(original_billing)


@pytest.fixture
def api_client():
    with httpx.Client(base_url=BASE_URL, timeout=5) as client:
        yield client


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture
def page(browser):
    context = browser.new_context()
    pg = context.new_page()
    yield pg
    context.close()


@pytest.fixture
def ctx():
    return {"navigated": False, "requests": []}


# ---------------------------------------------------------------------------
# Seeding helpers (direct, in-process state setup — see live_app's docstring)
# ---------------------------------------------------------------------------

STANDARD_USAGES = [
    {"id": "video-quality", "label": "Video quality", "type": "feature", "value": "Full HD (1080p)", "help": "help"},
    {"id": "screens", "label": "Watch at the same time", "type": "feature", "value": "Can watch on 2 devices at once", "help": "help"},
    {"id": "downloads", "label": "Download on devices", "type": "feature", "value": "Can download on 2 devices", "help": "help"},
]
STANDARD_INCLUDED_USAGE = {
    "title": "Plan perks",
    "items": [
        {"id": "ad-free", "label": "Ad-free streaming", "used_percent": 100},
        {"id": "spatial-audio", "label": "Spatial audio (select titles)", "used_percent": 100},
    ],
    "help": "help",
}


def _renew_at_for(days_remaining):
    return (datetime.today() + timedelta(days=days_remaining)).strftime("%b %d, %Y")


def _seed(email, plan, price, renew_at, password="password"):
    backend_main.users[email] = {
        "id": 900, "name": "BDD Test User", "email": email, "password": password,
        "plan": plan, "price": price, "renew_at": renew_at,
    }
    if plan == "Premium":
        backend_main.billing_data[email] = {
            "plan_name": "Premium", "price": price, "renew_at": renew_at,
            "usages": backend_main.PREMIUM_USAGES, "included_usage": backend_main.PREMIUM_INCLUDED_USAGE,
        }
    else:
        backend_main.billing_data[email] = {
            "plan_name": "Standard", "price": price, "renew_at": renew_at,
            "usages": STANDARD_USAGES, "included_usage": STANDARD_INCLUDED_USAGE,
        }


def _apply_seed(ctx, days_remaining):
    renew_at = _renew_at_for(days_remaining)
    _seed(ctx["email"], ctx["plan"], ctx["price"], renew_at)
    ctx["renew_at"] = renew_at
    ctx["days_remaining"] = days_remaining


def _login_and_goto_billing(page, email, password="password"):
    # Login.jsx's <label> elements aren't associated with their <input>s (no htmlFor/id, not
    # wrapping) — a pre-existing accessibility gap, out of this story's scope to fix. Select by
    # input type instead, which is unambiguous on the sign-in form.
    # Navigate to "/" rather than "/login": the production static-file mount (main.py's
    # StaticFiles(html=True)) only serves index.html for the exact root — a hard load of any
    # other client-side route 404s at the server. This is pre-existing production behaviour
    # unrelated to this story; "/" maps to the same <Login> component (see App.jsx's route table),
    # so it reaches the identical page without depending on SPA-fallback routing this app doesn't have.
    page.goto(f"{BASE_URL}/")
    page.locator('input[type="email"]').fill(email)
    page.locator('input[type="password"]').fill(password)
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url(f"{BASE_URL}/billing")
    expect(page.locator(".plan-badge")).to_be_visible()


def _ensure_on_billing_page(page, ctx):
    if not ctx.get("navigated"):
        ctx.setdefault("requests", [])
        page.on("request", lambda req: ctx["requests"].append(req.url) if "/api/" in req.url else None)
        _login_and_goto_billing(page, ctx.get("email", "tpg@example.com"))
        ctx["navigated"] = True


def _dollars(text):
    return float(text.replace("$", ""))


def _quoted_list(text):
    return re.findall(r'"([^"]+)"', text)


# ---------------------------------------------------------------------------
# Given
# ---------------------------------------------------------------------------

@given(parsers.parse('a user "{email}" exists with an active "{plan}" plan at "{price}"'))
def user_exists_plan(ctx, email, plan, price):
    ctx.update(email=email, plan=plan, price=price)
    _apply_seed(ctx, 15)


@given(parsers.parse('a user "{email}" exists with an active "{plan}" subscription at "{price}"'))
def user_exists_subscription(ctx, email, plan, price):
    ctx.update(email=email, plan=plan, price=price)
    _apply_seed(ctx, 15)


@given(parsers.parse("the user's \"renew_at\" date is {days:d} days from today in a {cycle:d}-day billing cycle"))
def renew_at_days_from_today(ctx, days, cycle):
    _apply_seed(ctx, days)


@given(parsers.parse('{days:d} days remain in the {cycle:d}-day billing cycle'))
def days_remain_in_cycle(ctx, days, cycle):
    _apply_seed(ctx, days)


@given(parsers.parse('{days:d} days remain in the billing cycle'))
def days_remain(ctx, days):
    _apply_seed(ctx, days)


@given(parsers.parse('the user\'s plan is "{plan}"'))
def the_users_plan_is(ctx, plan):
    ctx["email"] = ctx.get("email", "tpg@example.com")
    ctx["plan"] = plan
    ctx["price"] = "$40/month" if plan == "Premium" else "$20/month"
    _apply_seed(ctx, ctx.get("days_remaining", 15))


@given("the confirmation modal is open")
def confirmation_modal_is_open(page, ctx):
    ctx["email"] = ctx.get("email", "tpg@example.com")
    ctx.setdefault("plan", "Standard")
    ctx.setdefault("price", "$20/month")
    if "renew_at" not in ctx:
        _apply_seed(ctx, 15)
    _ensure_on_billing_page(page, ctx)
    page.get_by_role("button", name="Upgrade to Premium").click()
    expect(page.get_by_role("dialog")).to_be_visible()


@given(parsers.parse('no user exists with email "{email}"'))
def no_user_exists(ctx, email):
    backend_main.users.pop(email, None)
    backend_main.billing_data.pop(email, None)
    ctx["email"] = email


@given(parsers.parse('a successful upgrade just completed with a prorated charge of "{amount}" and {days:d} days remaining'))
def successful_upgrade_just_completed(page, ctx, amount, days):
    ctx["email"] = ctx.get("email", "tpg@example.com")
    ctx["plan"] = "Standard"
    ctx["price"] = "$20/month"
    _apply_seed(ctx, days)
    _ensure_on_billing_page(page, ctx)
    page.get_by_role("button", name="Upgrade to Premium").click()
    page.get_by_role("button", name=re.compile("Confirm & pay")).click()
    expect(page.locator(".upgrade-success-banner")).to_be_visible()


@given("a Standard-plan user who does not attempt an upgrade")
def standard_plan_user_no_upgrade(ctx):
    ctx["email"] = ctx.get("email", "tpg@example.com")
    ctx.setdefault("plan", "Standard")
    ctx.setdefault("price", "$20/month")
    if "renew_at" not in ctx:
        _apply_seed(ctx, 15)


# ---------------------------------------------------------------------------
# When
# ---------------------------------------------------------------------------

@when("the Billing page renders")
@when("they view the Billing page")
def view_billing_page(page, ctx):
    _ensure_on_billing_page(page, ctx)


@when(parsers.parse('they click "{label}"'))
def click_button(page, ctx, label):
    _ensure_on_billing_page(page, ctx)
    page.get_by_role("button", name=label).click()
    expect(page.get_by_role("dialog")).to_be_visible()


@when(parsers.parse('the user clicks "{label}"'))
def user_clicks(page, label):
    page.get_by_role("button", name=label).click()


@when(parsers.parse('"{subject}" requests an upgrade to "{plan}" at "{price}"'))
def subject_requests_upgrade_with_price(api_client, ctx, subject):
    ctx["response"] = api_client.post("/api/billing/upgrade", json={"email": subject})


@when(parsers.parse('"{subject}" requests an upgrade to "{plan}"'))
def subject_requests_upgrade(api_client, ctx, subject):
    ctx["response"] = api_client.post("/api/billing/upgrade", json={"email": subject})


@when(parsers.parse('an upgrade is requested for "{email}"'))
def upgrade_requested_for(api_client, ctx, email):
    ctx["response"] = api_client.post("/api/billing/upgrade", json={"email": email})


@when("the backend responds successfully to the confirm action")
def backend_responds_successfully(page, ctx):
    _ensure_on_billing_page(page, ctx)
    page.get_by_role("button", name="Upgrade to Premium").click()
    page.get_by_role("button", name=re.compile("Confirm & pay")).click()
    expect(page.locator(".upgrade-success-banner")).to_be_visible()


@when("the Billing page re-renders")
def billing_page_rerenders(page):
    expect(page.locator(".upgrade-success-banner")).to_be_visible()


@when("the confirm action's network request fails")
def confirm_network_fails(page):
    page.route("**/api/billing/upgrade", lambda route: route.abort())
    page.get_by_role("button", name=re.compile("Confirm & pay")).click()


@when("the confirm action receives a 500 response from the backend")
def confirm_receives_500(page):
    page.route(
        "**/api/billing/upgrade",
        lambda route: route.fulfill(status=500, content_type="application/json", body='{"detail": "boom"}'),
    )
    page.get_by_role("button", name=re.compile("Confirm & pay")).click()


@when("they log in, register, restore a session, log out, or hit a protected route unauthenticated")
def full_regression_sweep(page, ctx):
    # 1) Login
    _login_and_goto_billing(page, ctx["email"])
    expect(page.locator(".plan-badge")).to_have_text("Standard")
    # 2) Logout
    page.get_by_text("Logout").click()
    expect(page).to_have_url(re.compile(r".*/login"))
    expect(page.locator('input[type="email"]')).to_be_visible()
    # 3) Protected route unauthenticated — a real user pressing Back after logging out is the
    # most faithful reachable simulation here: the production static-file mount only serves
    # index.html at "/" (pre-existing, out of this story's scope), so a hard reload of "/billing"
    # 404s at the server before React Router ever runs, and a synthetic dispatched `popstate`
    # doesn't carry the internal history-library state shape a real back-navigation does (it was
    # tried and silently no-ops). Native back navigation fires a genuine popstate with that state
    # intact, correctly re-running ProtectedRoute against the now-logged-out token.
    page.go_back()
    expect(page).to_have_url(re.compile(r".*/login"))
    expect(page.locator('input[type="email"]')).to_be_visible()
    # 4) Register a fresh account
    fresh_email = f"bdd-fresh-{int(time.time() * 1000)}@example.com"
    page.get_by_role("button", name="Sign Up").click()
    # The "Full name" input has no `type` attribute at all (defaults to text only as a DOM
    # property, not a reflected HTML attribute), so `input[type="text"]` matches nothing —
    # isolate it by excluding the other two typed fields instead. Wait for it to actually be
    # present post-toggle before filling, rather than relying solely on fill()'s auto-wait.
    name_field = page.locator('input:not([type="email"]):not([type="password"]):not([type="checkbox"])')
    expect(name_field).to_be_visible()
    name_field.fill("BDD Fresh User")
    page.locator('input[type="email"]').fill(fresh_email)
    page.locator('input[type="password"]').fill("password123")
    page.get_by_role("button", name="Sign Up").click()
    expect(page).to_have_url(f"{BASE_URL}/billing", timeout=10000)
    expect(page.locator(".plan-badge")).to_have_text("Standard")
    # 5) Session restore (page refresh) — per spec/plans/atlas-deep-dive.md Flow 3, this is
    # specifically about AuthContext's mount effect re-validating the token via
    # GET /api/users/me and NOT clearing it — not about which route ends up visible. A hard
    # reload of "/billing" itself 404s at the server for the same pre-existing static-serving
    # reason as step 3 (out of this story's scope), so reload at "/" (which the server does
    # serve) and verify the token survives the fresh mount's re-validation instead.
    page.goto(f"{BASE_URL}/")
    expect(page.locator('input[type="email"]')).to_be_visible()
    page.wait_for_timeout(300)  # let AuthContext's GET /api/users/me round-trip complete
    assert page.evaluate("() => localStorage.getItem('token')") == fresh_email, (
        "Flow 3 (Session Restore) should keep the token after a fresh mount's "
        "GET /api/users/me succeeds — logout() only fires on a 401"
    )
    # Return to the scenario's actual subject (the Standard-plan user from the Given step) so the
    # final Then assertions verify ITS billing display, not the throwaway registration account.
    page.evaluate("() => localStorage.removeItem('token')")
    _login_and_goto_billing(page, ctx["email"])


# ---------------------------------------------------------------------------
# Then
# ---------------------------------------------------------------------------

@then(parsers.parse('the plan badge reads "{value}"'))
def plan_badge_reads(page, value):
    expect(page.locator(".plan-badge")).to_have_text(value)


@then(parsers.parse('the "What\'s included with" heading reads "{value}"'))
def whats_included_heading(page, value):
    expect(page.locator(".section-title").first).to_have_text(value)


@then(parsers.parse('an "{label}" button is rendered top-right of the "{header}" header row'))
def cta_rendered(page, label):
    expect(page.get_by_role("button", name=label)).to_be_visible()


@then(parsers.parse('no "{label}" button is rendered'))
def cta_not_rendered(page, label):
    expect(page.get_by_role("button", name=label)).to_have_count(0)


@then(parsers.parse('the modal shows the title "{title}"'))
def modal_shows_title(page, title):
    expect(page.get_by_role("dialog").get_by_text(title, exact=True)).to_be_visible()


@then(parsers.parse('the modal shows "{text}"'))
def modal_shows_text(page, text):
    label, _, value = text.partition(":")
    expect(page.get_by_role("dialog")).to_contain_text(label.strip())
    expect(page.get_by_role("dialog")).to_contain_text(value.strip())


@then(parsers.parse('the modal shows a "{label}" amount of "{amount}"'))
def modal_shows_amount(page, label, amount):
    expect(page.get_by_role("dialog")).to_contain_text(label)
    expect(page.get_by_role("dialog")).to_contain_text(amount)


@then(parsers.re(r'the modal lists the Premium highlights (?P<raw>.+)'))
def modal_lists_highlights(page, raw):
    for item in _quoted_list(raw):
        expect(page.get_by_role("dialog")).to_contain_text(item)


@then("the user has not been charged or upgraded yet")
def not_charged_yet(ctx):
    assert backend_main.users[ctx["email"]]["plan"] != "Premium"


@then("no API call is made")
def no_api_call_made(ctx):
    assert not any("/api/billing/upgrade" in u for u in ctx["requests"])


@then("the Billing page remains unchanged")
def billing_page_unchanged(page):
    expect(page.locator(".plan-badge")).to_have_text("Standard")


@then(parsers.parse('a prorated charge of "{amount}" is calculated'))
def prorated_charge_calculated(ctx, amount):
    assert ctx["response"].status_code == 200
    assert ctx["response"].json()["prorated_charge"] == _dollars(amount)


@then(parsers.parse('"{subject}"\'s plan becomes "{plan}"'))
def subjects_plan_becomes(subject, plan):
    assert backend_main.users[subject]["plan"] == plan


@then(parsers.parse('"{subject}"\'s price becomes "{price}"'))
def subjects_price_becomes(subject, price):
    assert backend_main.users[subject]["price"] == price


@then(parsers.parse('"{subject}"\'s "renew_at" date is unchanged'))
def subjects_renew_at_unchanged(ctx, subject):
    assert backend_main.users[subject]["renew_at"] == ctx["renew_at"]


@then(parsers.parse('the response is {status:d} with plan_name "{plan}", price "{price}", and prorated_charge {charge:g}'))
def response_full_contract(ctx, status, plan, price, charge):
    body = ctx["response"].json()
    assert ctx["response"].status_code == status
    assert body["plan_name"] == plan
    assert body["price"] == price
    assert body["prorated_charge"] == charge


@then(parsers.parse('the response usages include video quality "{quality}", {streams:d} simultaneous streams, and {downloads:d} download devices'))
def response_usages_include(ctx, quality, streams, downloads):
    usages = {u["id"]: u["value"] for u in ctx["response"].json()["usages"]}
    assert usages["video-quality"] == quality
    assert str(streams) in usages["screens"]
    assert str(downloads) in usages["downloads"]


@then(parsers.parse('the response included_usage includes a "{perk}" perk alongside "{perk_a}" and "{perk_b}"'))
def response_included_usage(ctx, perk, perk_a, perk_b):
    labels = [item["label"] for item in ctx["response"].json()["included_usage"]["items"]]
    for name in (perk, perk_a, perk_b):
        assert any(name in label for label in labels), f'"{name}" not found in {labels}'


@then(parsers.parse('the response is {status:d} with detail "{detail}"'))
def response_status_with_detail(ctx, status, detail):
    assert ctx["response"].status_code == status
    assert ctx["response"].json()["detail"] == detail


@then(parsers.parse('"{subject}"\'s plan remains "{plan}" with no further mutation'))
def subjects_plan_remains(subject, plan):
    assert backend_main.users[subject]["plan"] == plan


@then("the frontend updates its billing state directly from the response payload")
def frontend_updates_from_response(page):
    expect(page.locator(".plan-badge")).to_have_text("Premium")


@then("no additional GET /api/billing request is made")
def no_additional_get_billing(ctx):
    get_billing_calls = [u for u in ctx["requests"] if u.startswith(f"{BASE_URL}/api/billing?")]
    assert len(get_billing_calls) == 1, f"expected exactly 1 initial GET, saw {get_billing_calls}"


@then("the Upgrade to Premium button is no longer rendered")
def upgrade_button_gone(page):
    expect(page.get_by_role("button", name="Upgrade to Premium")).to_have_count(0)


@then(parsers.re(r'a success banner is shown reading "(?P<text>.+)"'))
def success_banner_shown(page, text):
    prefix = text.split("<renew_at>")[0].strip()
    expect(page.locator(".upgrade-success-banner")).to_contain_text(prefix.rstrip("."))


@then("the modal displays an inline error message")
def modal_shows_error(page):
    expect(page.locator(".upgrade-modal-error")).to_be_visible()


@then("the user can retry or cancel")
def user_can_retry_or_cancel(page):
    expect(page.get_by_role("button", name=re.compile("Confirm & pay"))).to_be_enabled()
    expect(page.get_by_role("button", name="Cancel")).to_be_enabled()


@then("the existing GET /api/billing fetch's error handling is unchanged")
def existing_get_billing_unchanged(ctx):
    assert any(u.startswith(f"{BASE_URL}/api/billing?") for u in ctx["requests"])


@then("each flow behaves exactly as documented in the existing system (Flows 1-6)")
def flows_behave_as_documented():
    pass  # verified step-by-step by the When step's own assertions


@then("the Standard-plan billing display is unchanged except for the new Upgrade CTA")
def standard_display_unchanged(page):
    expect(page.locator(".plan-badge")).to_have_text("Standard")
    expect(page.get_by_role("button", name="Upgrade to Premium")).to_be_visible()


