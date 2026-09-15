"""Unit tests for the pre-existing auth/users/tasks endpoints in main.py.

Story 1.1 (mid-cycle subscription upgrade) touches main.py, which pulls the whole
file into the delta-scoped unitCoverage gate (tests/.evals/scripts/run-static-evals.sh
coverage_delta) — not just the billing-upgrade code this story added. These endpoints
predate the story but had no test coverage at all; this closes that real gap with
genuine behavioural tests, not padding.
"""
import main as app_module
from fastapi.testclient import TestClient

client = TestClient(app_module.app)


def register(email: str, password: str = "pw") -> None:
    resp = client.post(
        "/api/auth/register",
        json={"name": "Test", "email": email, "password": password},
    )
    assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

def test_login_success_returns_access_token_and_user_without_password():
    email = "login-happy@example.com"
    register(email, password="correct-pw")

    resp = client.post("/api/auth/login", json={"email": email, "password": "correct-pw"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"] == email
    assert body["user"]["email"] == email
    assert "password" not in body["user"]


def test_login_wrong_password_returns_401():
    email = "login-wrong-pw@example.com"
    register(email, password="correct-pw")

    resp = client.post("/api/auth/login", json={"email": email, "password": "wrong-pw"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid credentials"}


def test_login_unknown_email_returns_401():
    resp = client.post("/api/auth/login", json={"email": "nobody-login@example.com", "password": "pw"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid credentials"}


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

def test_register_duplicate_email_returns_400():
    email = "register-dup@example.com"
    register(email)

    resp = client.post(
        "/api/auth/register",
        json={"name": "Test Again", "email": email, "password": "pw"},
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Account already exists"}


# ---------------------------------------------------------------------------
# GET /api/users/me
# ---------------------------------------------------------------------------

def test_users_me_unauthenticated_returns_401():
    resp = client.get("/api/users/me", params={"email": "nobody-me@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


# ---------------------------------------------------------------------------
# GET /api/billing
# ---------------------------------------------------------------------------

def test_billing_unauthenticated_returns_401():
    resp = client.get("/api/billing", params={"email": "nobody-billing@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


# ---------------------------------------------------------------------------
# GET /api/tasks
# ---------------------------------------------------------------------------

def test_tasks_get_returns_seeded_task_for_registered_user():
    email = "tasks-get-happy@example.com"
    register(email)

    resp = client.get("/api/tasks", params={"email": email})
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Explore the dashboard"


def test_tasks_get_unauthenticated_returns_401():
    resp = client.get("/api/tasks", params={"email": "nobody-tasks-get@example.com"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}


# ---------------------------------------------------------------------------
# POST /api/tasks
# ---------------------------------------------------------------------------

def test_tasks_post_creates_new_task_for_registered_user():
    email = "tasks-post-happy@example.com"
    register(email)

    resp = client.post("/api/tasks", json={"email": email, "title": "Write the report"})
    assert resp.status_code == 200
    new_task = resp.json()
    assert new_task["title"] == "Write the report"
    assert new_task["status"] == "pending"
    # Seeded task has id 1, so the new one must not collide with it.
    assert new_task["id"] == 2

    tasks = client.get("/api/tasks", params={"email": email}).json()
    assert len(tasks) == 2


def test_tasks_post_unauthenticated_returns_401():
    resp = client.post("/api/tasks", json={"email": "nobody-tasks-post@example.com", "title": "x"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Not authenticated"}
