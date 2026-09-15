from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Billing & Tasks POC")

PLANS: dict[str, dict[str, Any]] = {
    "Standard": {"price": 20.0, "label": "$20/month"},
    "Premium": {"price": 40.0, "label": "$40/month"},
}
DAYS_IN_CYCLE = 30
PREMIUM_QUOTAS = {
    "usages": [
        {
            "id": "chat-credits",
            "label": "Chat credits",
            "used": 0,
            "total": 10000,
            "help": "Messages used this billing cycle.",
        },
        {
            "id": "chatbots",
            "label": "Chatbots",
            "used": 0,
            "total": 10,
            "help": "Active chatbot agents out of the included limit.",
        },
        {
            "id": "documents-pages",
            "label": "Documents pages",
            "used": 0,
            "total": 5000,
            "help": "You can add 5000 more pages of your documents.",
        },
    ]
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory mock store (no database)
users = {
    "tpg@example.com": {
        "id": 1,
        "name": "TPG",
        "email": "tpg@example.com",
        "password": "password",
        "plan": "Standard",
        "price": "$20/month",
        "renew_at": (datetime.today() + timedelta(days=30)).strftime("%b %d, %Y"),
    }
}

billing_data = {
    "tpg@example.com": {
        "plan_name": "Standard",
        "price": "$20/month",
        "renew_at": (datetime.today() + timedelta(days=30)).strftime("%b %d, %Y"),
        "usages": [
            {
                "id": "chat-credits",
                "label": "Chat credits",
                "used": 100,
                "total": 2000,
                "help": "Messages used this billing cycle.",
            },
            {
                "id": "chatbots",
                "label": "Chatbots",
                "used": 1,
                "total": 3,
                "help": "Active chatbot agents out of the included limit.",
            },
            {
                "id": "documents-pages",
                "label": "Documents pages",
                "used": 15,
                "total": 1000,
                "help": "You can add 985 more pages of your documents.",
            },
        ],
        "included_usage": {
            "title": "Your included usage",
            "items": [
                {"id": "daily", "label": "Daily quota", "used_percent": 5, "resets_in": "23 hours"},
                {"id": "weekly", "label": "Weekly quota", "used_percent": 10, "resets_in": "5 days"},
            ],
            "help": "Usage included in your plan.",
        },
        "on_demand_usage": {
            "title": "On-demand usage",
            "remaining_balance": "$18.00",
            "your_usage": "$0.00",
            "help": "Additional usage charges beyond your included quota.",
            "notice": "On-demand credit is not available in standard plan for usage beyond your included quota.",
        },
    }
}

tasks_data = {
    "tpg@example.com": [
        {"id": 1, "title": "Review monthly invoice", "status": "pending", "due": "Today"},
        {"id": 2, "title": "Add team member", "status": "completed", "due": "Yesterday"},
        {"id": 3, "title": "Update billing address", "status": "pending", "due": "In 2 days"},
    ]
}


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class TokenRequest(BaseModel):
    token: str


class TaskCreateRequest(BaseModel):
    email: str
    title: str


class UpgradeRequest(BaseModel):
    email: str


def compute_prorated_charge(renew_at: str) -> tuple[int, float]:
    """Days remaining in the cycle and the prorated Standard->Premium charge for that many days."""
    try:
        renew_at_date = datetime.strptime(renew_at, "%b %d, %Y").replace(tzinfo=timezone.utc)
    except ValueError:
        # Fail closed (SECURITY-15): renew_at is always server-generated, but a malformed value
        # must never surface a raw ValueError/traceback to the caller — return a clean, generic
        # error instead of letting it propagate as an unhandled 500.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Billing data unavailable")
    # Compare calendar dates, not instants: renew_at carries no time-of-day (it round-trips
    # through "%b %d, %Y"), so diffing it against datetime.today()'s current time-of-day would
    # undercount days_remaining by one for any time after midnight. .date() strips both sides
    # to whole calendar days, matching the epic's worked example (15 days remaining -> $10.00)
    # regardless of what time the request happens to arrive.
    days_remaining = max(1, (renew_at_date.date() - datetime.now(timezone.utc).date()).days)
    daily_delta = (PLANS["Premium"]["price"] - PLANS["Standard"]["price"]) / DAYS_IN_CYCLE
    prorated_charge = round(daily_delta * days_remaining, 2)
    return days_remaining, prorated_charge


def charge_card(email: str, amount: float) -> dict:
    if email.startswith("fail"):
        return {"status": "card_declined", "message": "Your card was declined."}
    return {"status": "success"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    user = users.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": payload.email, "user": {k: v for k, v in user.items() if k != "password"}}


@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    if payload.email in users:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already exists")
    users[payload.email] = {
        "id": len(users) + 1,
        "name": payload.name,
        "email": payload.email,
        "password": payload.password,
        "plan": "Standard",
        "price": "$20/month",
        "renew_at": (datetime.today() + timedelta(days=30)).strftime("%b %d, %Y"),
    }
    billing_data[payload.email] = {
        "plan_name": "Standard",
        "price": "$20/month",
        "renew_at": (datetime.today() + timedelta(days=30)).strftime("%b %d, %Y"),
        "usages": [
            {
                "id": "chat-credits",
                "label": "Chat credits",
                "used": 0,
                "total": 2000,
                "help": "Messages used this billing cycle.",
            },
            {
                "id": "chatbots",
                "label": "Chatbots",
                "used": 0,
                "total": 3,
                "help": "Active chatbot agents out of the included limit.",
            },
            {
                "id": "documents-pages",
                "label": "Documents pages",
                "used": 0,
                "total": 1000,
                "help": "You can add 1000 more pages of your documents.",
            },
        ],
        "included_usage": {
            "title": "Your included usage",
            "items": [
                {"id": "daily", "label": "Daily quota", "used_percent": 5, "resets_in": "23 hours"},
                {"id": "weekly", "label": "Weekly quota", "used_percent": 10, "resets_in": "5 days"},
            ],
            "help": "Usage included in your plan.",
        },
        "on_demand_usage": {
            "title": "On-demand usage",
            "remaining_balance": "$0.00",
            "your_usage": "$0.00",
            "help": "Additional usage charges beyond your included quota.",
            "notice": "On-demand credit is not available in standard plan for usage beyond your included quota.",
        },
    }
    tasks_data[payload.email] = [
        {"id": 1, "title": "Explore the dashboard", "status": "completed", "due": "Today"},
    ]
    return {"access_token": payload.email, "user": {k: v for k, v in users[payload.email].items() if k != "password"}}


@app.get("/api/users/me")
def me(email: str):
    user = users.get(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return {k: v for k, v in user.items() if k != "password"}


@app.get("/api/billing")
def billing(email: str):
    if email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return billing_data.get(email, billing_data["tpg@example.com"])


@app.get("/api/billing/upgrade-preview")
def billing_upgrade_preview(email: str):
    if email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    account: dict[str, Any] = billing_data.get(email, billing_data["tpg@example.com"])
    if account["plan_name"] == "Premium":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already_premium")
    days_remaining, prorated_charge = compute_prorated_charge(account["renew_at"])
    return {
        "current_plan": "Standard",
        "new_plan": "Premium",
        "days_remaining": days_remaining,
        "prorated_charge": prorated_charge,
        "next_renewal_price": PLANS["Premium"]["price"],
        "renew_at": account["renew_at"],
    }


@app.post("/api/billing/upgrade")
def billing_upgrade(payload: UpgradeRequest):
    email = payload.email
    if email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    account: dict[str, Any] = billing_data.get(email, billing_data["tpg@example.com"])
    if account["plan_name"] == "Premium":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already_premium")

    _, prorated_charge = compute_prorated_charge(account["renew_at"])
    result = charge_card(email, prorated_charge)
    if result["status"] == "card_declined":
        return JSONResponse(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            content={"detail": "card_declined", "message": result["message"]},
        )

    users[email]["plan"] = "Premium"
    users[email]["price"] = PLANS["Premium"]["label"]
    account["plan_name"] = "Premium"
    account["price"] = PLANS["Premium"]["label"]
    account["usages"] = [dict(usage) for usage in PREMIUM_QUOTAS["usages"]]
    account["on_demand_usage"]["notice"] = "On-demand credit is available on your Premium plan."

    return {"status": "success", "plan": "Premium", "charge": prorated_charge}


@app.get("/api/tasks")
def tasks(email: str):
    if email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return tasks_data.get(email, [])


@app.post("/api/tasks")
def add_task(payload: TaskCreateRequest):
    if payload.email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_tasks = tasks_data.setdefault(payload.email, [])
    new_id = max((t["id"] for t in user_tasks), default=0) + 1
    new_task = {"id": new_id, "title": payload.title, "status": "pending", "due": "Today"}
    user_tasks.append(new_task)
    return new_task


# Serve the built frontend if it exists (production build)
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.is_dir():
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
