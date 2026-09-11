"""Shared fixtures for the Behaviour Gate (B1/B2/B3, common/behavior-spec.md).

Every scenario gets a fresh, isolated backend: the FastAPI app's in-memory dicts
(users/billing_data/tasks_data) are reset and a real uvicorn server is started on an
ephemeral port in a background thread of THIS process. Running in-process (rather than as
a subprocess) is what lets Given-steps arrange fixture data (e.g. "15 days remain in the
billing cycle") directly against `main`'s module state when the public API has no such
endpoint, while When/Then steps still go through the real HTTP surface (httpx for API
scenarios, a real Chromium via Playwright for UI scenarios) — exactly the same server,
so both kinds of steps observe the same state.
"""
import copy
import shutil
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

import httpx
import pytest
import uvicorn
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "src" / "backend"
FRONTEND_DIR = REPO_ROOT / "src" / "frontend"
THIS_DIR = Path(__file__).resolve().parent

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(THIS_DIR))
import main as app_module  # noqa: E402

_INITIAL_USERS = copy.deepcopy(app_module.users)
_INITIAL_BILLING = copy.deepcopy(app_module.billing_data)
_INITIAL_TASKS = copy.deepcopy(app_module.tasks_data)


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def frontend_built():
    """Build the React app once per session so main.py's existing static mount can serve
    it. Reuses the project's own src/frontend/node_modules (common/eval-framework.md
    Section 2.3: "reuse the project's existing environment, never create a second one") —
    safe here because the Behaviour Gate is running NATIVELY on this host (the Podman
    route was verified unusable on this machine's network, see runtime-artifacts/audit.md
    "Behaviour Gate - Podman Containerisation Verified Unusable"), so there is no
    container/host OS mismatch risk to isolate against."""
    subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=True, shell=(sys.platform == "win32"))
    return FRONTEND_DIR / "dist"


class _ServerThread(threading.Thread):
    def __init__(self, server: uvicorn.Server):
        super().__init__(daemon=True)
        self.server = server

    def run(self):
        self.server.run()


@pytest.fixture()
def live_server(frontend_built):
    """Fresh backend per scenario: reset in-memory state, serve on a new ephemeral port."""
    app_module.users.clear()
    app_module.users.update(copy.deepcopy(_INITIAL_USERS))
    app_module.billing_data.clear()
    app_module.billing_data.update(copy.deepcopy(_INITIAL_BILLING))
    app_module.tasks_data.clear()
    app_module.tasks_data.update(copy.deepcopy(_INITIAL_TASKS))

    port = _free_port()
    config = uvicorn.Config(app_module.app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    thread = _ServerThread(server)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            httpx.get(base_url + "/api/billing", params={"email": "nobody@nowhere.invalid"}, timeout=1)
            break
        except httpx.TransportError:
            time.sleep(0.1)
    else:
        raise RuntimeError("live_server did not become ready in time")

    yield base_url

    server.should_exit = True
    thread.join(timeout=10)


@pytest.fixture()
def api(live_server):
    with httpx.Client(base_url=live_server, timeout=10) as client:
        yield client


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture()
def page(browser, live_server):
    context = browser.new_context(base_url=live_server)
    pg = context.new_page()
    yield pg
    context.close()


@pytest.fixture()
def ctx():
    """Free-form per-scenario state shared across a scenario's Given/When/Then steps."""
    return {}
