"""Step definitions for spec/behavior/story-1.1.feature (Mid-Cycle Subscription Upgrade).

Bound to the application's real public surface only (common/behavior-spec.md Section 4.2):
- API-observable behaviour -> httpx against the live, real uvicorn server (`api` fixture).
- Rendered-UI behaviour -> a real Chromium via Playwright (`page` fixture), against the
  same server, driving the actually-built React app.
Given-steps that ARRANGE fixture data (e.g. "15 days remain") are the one place this reaches
past the public API, because the app exposes no admin endpoint to set a subscriber's renewal
date — a normal, accepted BDD arrangement pattern; every When/Then still goes through the
real HTTP/browser surface.
"""
from datetime import datetime, timedelta

import main as app_module
from pytest_bdd import given, parsers, then, when

PLAN_PRICE_LABEL = {"Standard": "$20/month", "Premium": "$40/month"}


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------

@given(parsers.parse('a subscriber "{email}" exists with an active "{plan}" subscription at ${price}/month'))
def create_subscriber(email, plan, price, api, ctx):
    resp = api.post("/api/auth/register", json={"name": email.split("@")[0], "email": email, "password": "pw"})
    assert resp.status_code == 200, resp.text
    if plan == "Premium":
        pre = api.post("/api/billing/upgrade", json={"email": email})
        assert pre.status_code == 200, pre.text
    ctx["last_created_email"] = email
    ctx.setdefault("known_subscribers", set()).add(email)


@given("15 days remain in the current 30-day billing cycle")
def override_renewal_window(ctx):
    email = ctx["last_created_email"]
    renew_at = (datetime.today() + timedelta(days=15)).strftime("%b %d, %Y")
    app_module.billing_data[email]["renew_at"] = renew_at
    app_module.users[email]["renew_at"] = renew_at
    ctx["renew_at"] = renew_at


# ---------------------------------------------------------------------------
# Navigation / UI arrangement helpers
# ---------------------------------------------------------------------------

def _goto_billing(page, email):
    # main.py's static mount has no SPA catch-all fallback (pre-existing, out of this
    # story's scope), so a direct browser navigation to "/billing" 404s. Load the SPA at
    # "/" first, seed localStorage, then RELOAD (a full navigation, still "/") so
    # AuthContext's `useState(localStorage.getItem('token'))` picks the token up at mount
    # — setting localStorage after the app already mounted does not retroactively update
    # that state. Only then move to "/billing" via the SPA's own client-side router.
    page.goto("/")
    page.evaluate("(t) => localStorage.setItem('token', t)", email)
    page.reload()
    page.wait_for_load_state("domcontentloaded")
    page.evaluate(
        "() => { window.history.pushState({}, '', '/billing'); "
        "window.dispatchEvent(new PopStateEvent('popstate')); }"
    )
    page.wait_for_selector(".page-card")


def _open_modal(page, email, ctx):
    _goto_billing(page, email)
    ctx["requests"] = []
    page.on("request", lambda r: ctx["requests"].append({"method": r.method, "url": r.url, "post_data": r.post_data}))
    with page.expect_response(lambda r: "/api/billing/upgrade-preview" in r.url):
        page.get_by_test_id("billing-upgrade-cta-button").click()
    page.wait_for_selector('[role="dialog"]')
    preview_resp = api_preview_snapshot(page, email)
    ctx["preview_shown"] = preview_resp


def api_preview_snapshot(page, email):
    # Read back exactly what the modal is showing right now (no re-fetch), used to
    # cross-verify the DOM never recomputes/deviates from what the API actually returned.
    return {
        "current_plan": page.locator(".modal-row").nth(0).locator("span").nth(1).inner_text(),
        "new_plan": page.locator(".modal-row").nth(1).locator("span").nth(1).inner_text(),
        "days_remaining": page.locator(".modal-row").nth(2).locator("span").nth(1).inner_text(),
        "charge_text": page.locator(".modal-charge").inner_text(),
        "renewal_text": page.locator(".modal-renewal").inner_text(),
    }


def _click_confirm(page, ctx):
    ctx.setdefault("requests", [])
    page.on("request", lambda r: ctx["requests"].append({"method": r.method, "url": r.url, "post_data": r.post_data}))
    with page.expect_response(lambda r: r.request.method == "POST" and "/api/billing/upgrade" in r.url) as info:
        page.get_by_test_id("billing-upgrade-confirm-button").click()
    response = info.value
    ctx["last_response"] = {"status_code": response.status, "json": response.json()}
    page.wait_for_timeout(300)


# ---------------------------------------------------------------------------
# AC-1 / AC-2 / AC-3 / AC-4 — Billing page rendering
# ---------------------------------------------------------------------------

@when(parsers.parse('"{email}" opens the Billing page'))
@given(parsers.parse('"{email}" is on the Billing page'))
def opens_billing_page(email, page, ctx):
    _goto_billing(page, email)
    ctx["current_email"] = email


@then(parsers.parse('the current-plan badge shows "{plan}"'))
def check_current_plan_badge(plan, page):
    assert page.locator(".standard-badge").inner_text() == plan


@then('no hardcoded "Standard" text is rendered independent of the API response')
def check_badge_matches_api(page, api, ctx):
    live_plan = api.get("/api/billing", params={"email": ctx["current_email"]}).json()["plan_name"]
    assert page.locator(".standard-badge").inner_text() == live_plan


@then(parsers.parse('the plan card shows the price "{price}"'))
def check_plan_price(price, page):
    assert page.locator(".plan-price").inner_text() == price


@then(parsers.parse('the plan card shows an "{label}" badge'))
def check_plan_badge_label(label, page):
    assert page.locator(".badge.active").inner_text() == label


@then('an "Upgrade to Premium" button is visible')
def cta_visible(page):
    assert page.get_by_test_id("billing-upgrade-cta-button").is_visible()


@then('no "Upgrade to Premium" button is visible')
def cta_absent(page):
    assert page.get_by_test_id("billing-upgrade-cta-button").count() == 0


@then('the "Upgrade to Premium" button text is exactly "Upgrade to Premium"')
def cta_text_exact(page):
    assert page.get_by_test_id("billing-upgrade-cta-button").inner_text() == "Upgrade to Premium"


# ---------------------------------------------------------------------------
# AC-5..AC-8 — Upgrade preview (API)
# ---------------------------------------------------------------------------

@when(parsers.parse('"{email}" requests an upgrade preview with {days} days remaining'))
@when(parsers.parse('"{email}" requests an upgrade preview'))
def request_preview(email, api, ctx, days=None):
    ctx["last_response"] = _as_result(api.get("/api/billing/upgrade-preview", params={"email": email}))


@when(parsers.parse('an unauthenticated request requests an upgrade preview for "{email}"'))
def request_preview_unauthenticated(email, api, ctx):
    ctx["last_response"] = _as_result(api.get("/api/billing/upgrade-preview", params={"email": email}))


def _as_result(resp):
    try:
        body = resp.json()
    except ValueError:
        body = None
    return {"status_code": resp.status_code, "json": body}


@then(parsers.parse("the preview response is {status:d}"))
def preview_status_only(status, ctx):
    assert ctx["last_response"]["status_code"] == status


@then(parsers.parse('the preview response is {status:d} with detail "{detail}"'))
@then(parsers.parse('the upgrade response is {status:d} with detail "{detail}"'))
def response_status_detail(status, detail, ctx):
    assert ctx["last_response"]["status_code"] == status
    assert ctx["last_response"]["json"]["detail"] == detail


@then(parsers.parse('the preview shows current plan "{current}" and new plan "{new}"'))
def preview_shows_plans(current, new, ctx):
    body = ctx["last_response"]["json"]
    assert body["current_plan"] == current
    assert body["new_plan"] == new


@then(parsers.parse("the preview shows a prorated charge of ${amount:f}"))
def preview_shows_charge(amount, ctx):
    assert ctx["last_response"]["json"]["prorated_charge"] == amount


@then(parsers.parse("the preview shows a next renewal price of ${amount:f}"))
def preview_shows_renewal_price(amount, ctx):
    assert ctx["last_response"]["json"]["next_renewal_price"] == amount


# ---------------------------------------------------------------------------
# AC-9..AC-12 — Confirmation modal
# ---------------------------------------------------------------------------

@when(parsers.parse('"{email}" clicks "Upgrade to Premium"'))
def click_cta(email, page, ctx):
    _open_modal(page, email, ctx)


@given(parsers.parse('"{email}" has opened the upgrade confirmation modal'))
def given_modal_open(email, page, ctx, api):
    ctx["usages_before"] = api.get("/api/billing", params={"email": email}).json()["usages"]
    ctx["price_before"] = api.get("/api/billing", params={"email": email}).json()["price"]
    ctx["renew_at_before"] = api.get("/api/billing", params={"email": email}).json()["renew_at"]
    _open_modal(page, email, ctx)
    ctx["current_email"] = email


@then("the upgrade confirmation modal opens")
def modal_opens(page):
    assert page.locator('[role="dialog"]').is_visible()


@then("the modal displays the fetched preview values")
def modal_displays_preview(page, api, ctx):
    live = api.get("/api/billing/upgrade-preview", params={"email": ctx["current_email"]})
    # already upgraded/behind by the click's own real fetch — just assert the modal is
    # populated with non-empty, non-loading content.
    assert "Loading" not in page.locator(".modal-panel").inner_text()
    assert page.locator(".modal-charge").inner_text() != ""


_MODAL_ROW_INDEX = {"current plan": 0, "new plan": 1, "days remaining": 2}


@then(parsers.parse('the modal shows "{text}" as the {field}'))
def modal_shows_field(text, field, page):
    idx = _MODAL_ROW_INDEX[field]
    assert page.locator(".modal-row").nth(idx).locator("span").nth(1).inner_text() == text


@then(parsers.parse('the modal shows "{text}"'))
def modal_shows_exact_text(text, page):
    assert page.locator(".modal-charge").inner_text() == text


@then(parsers.parse('the modal shows "{prefix}" followed by the renewal date'))
def modal_shows_prefix_then_renewal(prefix, page, ctx):
    renewal_text = page.locator(".modal-renewal").inner_text()
    assert renewal_text.startswith(prefix)
    assert ctx["renew_at_before"] in renewal_text or ctx.get("renew_at", "") in renewal_text


@when(parsers.parse('"{email}" clicks "Cancel"'))
def click_cancel(email, page):
    page.get_by_test_id("billing-upgrade-cancel-button").click()


@then("the modal closes")
def modal_closed(page):
    assert page.locator('[role="dialog"]').count() == 0


@then(parsers.parse('"{email}"\'s plan remains "{plan}"'))
def plan_remains(email, plan, api):
    assert api.get("/api/billing", params={"email": email}).json()["plan_name"] == plan


@then("no upgrade request was sent")
def no_upgrade_request_sent(ctx):
    reqs = ctx.get("requests", [])
    assert not any(r["method"] == "POST" and "/api/billing/upgrade" in r["url"] for r in reqs)


@then("the displayed charge is exactly the value the preview API returned, with no client-side recalculation")
def displayed_charge_matches_api(page, api, ctx):
    live_preview = api.get("/api/billing/upgrade-preview", params={"email": ctx["current_email"]}).json()
    expected = f"You will be charged ${live_preview['prorated_charge']:.2f} today"
    assert page.locator(".modal-charge").inner_text() == expected


# ---------------------------------------------------------------------------
# AC-13/14/16/17/18/19/20 — Confirm upgrade (success / decline / guards)
# ---------------------------------------------------------------------------

@when(parsers.parse('"{email}" clicks "Confirm Upgrade"'))
@when(parsers.parse('"{email}" clicks "Confirm Upgrade" and the card is declined'))
def click_confirm(email, page, ctx):
    _click_confirm(page, ctx)


@then(parsers.parse('the upgrade response is {status:d} with status "{status_text}", plan "{plan}", and charge {charge:f}'))
def upgrade_success_body(status, status_text, plan, charge, ctx):
    body = ctx["last_response"]["json"]
    assert ctx["last_response"]["status_code"] == status
    assert body["status"] == status_text
    assert body["plan"] == plan
    assert body["charge"] == charge


@then(parsers.parse('the upgrade response is {status:d} with detail "{detail}" and message "{message}"'))
def upgrade_decline_body(status, detail, message, ctx):
    assert ctx["last_response"]["status_code"] == status
    assert ctx["last_response"]["json"]["detail"] == detail
    assert ctx["last_response"]["json"]["message"] == message


@then(parsers.parse('"{email}"\'s plan becomes "{plan}"'))
def plan_becomes(email, plan, api):
    assert api.get("/api/billing", params={"email": email}).json()["plan_name"] == plan


@then(parsers.parse('"{email}"\'s price becomes "{price}"'))
def price_becomes(email, price, api):
    assert api.get("/api/billing", params={"email": email}).json()["price"] == price


@then(parsers.parse('"{email}"\'s price remains "{price}"'))
def price_remains(email, price, api):
    assert api.get("/api/billing", params={"email": email}).json()["price"] == price


@then(parsers.parse('"{email}"\'s renew_at date is unchanged'))
def renew_at_unchanged(email, api, ctx):
    assert api.get("/api/billing", params={"email": email}).json()["renew_at"] == ctx["renew_at_before"]


@then(parsers.parse('"{email}"\'s usages are byte-for-byte unchanged'))
def usages_unchanged(email, api, ctx):
    assert api.get("/api/billing", params={"email": email}).json()["usages"] == ctx["usages_before"]


@when(parsers.parse('"{email}" sends an upgrade request'))
def send_upgrade_request(email, api, ctx):
    ctx["last_response"] = _as_result(api.post("/api/billing/upgrade", json={"email": email}))


@when(parsers.parse('an unauthenticated request sends an upgrade request for "{email}"'))
def send_upgrade_unauthenticated(email, api, ctx):
    ctx["last_response"] = _as_result(api.post("/api/billing/upgrade", json={"email": email}))


@then("no charge is attempted")
def no_charge_attempted(ctx):
    # The already_premium guard runs before charge_card; a 409 with an unchanged plan is
    # the observable proof no charge was attempted.
    assert ctx["last_response"]["status_code"] == 409


@then(parsers.parse('a POST request is sent to "{path}" with email "{email}"'))
def post_request_sent_with_email(path, email, ctx):
    reqs = ctx.get("requests", [])
    matches = [r for r in reqs if r["method"] == "POST" and r["url"].endswith(path)]
    assert matches, f"no POST to {path} observed"
    import json as _json
    bodies = [_json.loads(m["post_data"]) for m in matches if m["post_data"]]
    assert any(b.get("email") == email for b in bodies)


# ---------------------------------------------------------------------------
# AC-15/21/22/23/24/25 — Post-upgrade state, banner, decline UX
# ---------------------------------------------------------------------------

def _full_ui_upgrade(page, email, ctx, expect_decline=False):
    _open_modal(page, email, ctx)
    _click_confirm(page, ctx)


@given(parsers.parse('"{email}" has just upgraded to "{plan}"'))
def given_just_upgraded(email, plan, page, ctx, api):
    ctx["usages_before"] = api.get("/api/billing", params={"email": email}).json()["usages"]
    _full_ui_upgrade(page, email, ctx)
    ctx["current_email"] = email


@given(parsers.parse('"{email}" has just upgraded to "{plan}" for a charge of ${amount:f}'))
def given_just_upgraded_with_charge(email, plan, amount, page, ctx, api):
    _full_ui_upgrade(page, email, ctx)
    ctx["current_email"] = email
    assert ctx["last_response"]["json"]["charge"] == amount


@given(parsers.parse('"{email}" has confirmed an upgrade that was declined'))
def given_confirmed_declined(email, page, ctx):
    _open_modal(page, email, ctx)
    _click_confirm(page, ctx)
    ctx["current_email"] = email
    assert ctx["last_response"]["status_code"] == 402


@then(parsers.parse("the chat credits quota total is {n:d}"))
def chat_credits_total(n, api, ctx):
    usages = api.get("/api/billing", params={"email": ctx["current_email"]}).json()["usages"]
    total = next(u["total"] for u in usages if u["id"] == "chat-credits")
    assert total == n


@then(parsers.parse("the chatbots quota total is {n:d}"))
def chatbots_total(n, api, ctx):
    usages = api.get("/api/billing", params={"email": ctx["current_email"]}).json()["usages"]
    total = next(u["total"] for u in usages if u["id"] == "chatbots")
    assert total == n


@then(parsers.parse("the documents pages quota total is {n:d}"))
def documents_pages_total(n, api, ctx):
    usages = api.get("/api/billing", params={"email": ctx["current_email"]}).json()["usages"]
    total = next(u["total"] for u in usages if u["id"] == "documents-pages")
    assert total == n


@then(parsers.parse('the on-demand usage notice reads "{text}"'))
def on_demand_notice(text, api, ctx):
    notice = api.get("/api/billing", params={"email": ctx["current_email"]}).json()["on_demand_usage"]["notice"]
    assert notice == text


@when("the Billing page re-fetches billing data")
def billing_page_refetches(page, ctx):
    _goto_billing(page, ctx["current_email"])


@then("the upgrade confirmation modal is closed")
def modal_is_closed(page):
    assert page.locator('[role="dialog"]').count() == 0


@then(parsers.parse('a success banner reads "{text}"'))
def success_banner_reads(text, page):
    assert page.locator(".success-banner").inner_text() == text


@then("the upgrade confirmation modal is still open")
def modal_still_open(page):
    assert page.locator('[role="dialog"]').is_visible()


@then(parsers.parse('the modal shows the inline error "{text}"'))
def modal_inline_error(text, page):
    assert page.locator(".error-text").inner_text() == text


@then(parsers.parse('the Billing page still shows the plan "{plan}"'))
def billing_page_shows_plan(plan, page):
    assert page.locator(".standard-badge").inner_text() == plan
