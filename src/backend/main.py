from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta

app = FastAPI(title="Billing & Tasks POC")

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


# Single source of truth for plan pricing/limits. CYCLE_LENGTH_DAYS is the ONLY place the 30-day
# cycle length appears in the proration path (ARCH-06) -- this cycle supports monthly billing only,
# annual billing is explicitly out of scope (REQ-NF-06).
CYCLE_LENGTH_DAYS = 30

PLAN_CATALOG = {
    "Standard": {
        "price": 20.0,
        "price_label": "$20/month",
        "limits": {"chat-credits": 2000, "chatbots": 3, "documents-pages": 1000},
    },
    "Premium": {
        "price": 40.0,
        "price_label": "$40/month",
        "limits": {"chat-credits": 5000, "chatbots": 10, "documents-pages": 5000},
    },
}


def _days_remaining(renew_at: str) -> int:
    """Whole days remaining until renew_at, clamped to [0, CYCLE_LENGTH_DAYS]. Compared as
    dates (not datetimes) so the result does not depend on the current time of day."""
    renew_date = datetime.strptime(renew_at, "%b %d, %Y").date()
    days = (renew_date - datetime.today().date()).days
    return max(0, min(CYCLE_LENGTH_DAYS, days))


def _prorated_charge(current_plan: str, target_plan: str, renew_at: str) -> float:
    """Prorated charge for upgrading from current_plan to target_plan, based on days
    remaining until renew_at in the current CYCLE_LENGTH_DAYS-day cycle."""
    days_remaining = _days_remaining(renew_at)
    price_delta = PLAN_CATALOG[target_plan]["price"] - PLAN_CATALOG[current_plan]["price"]
    return round(price_delta * days_remaining / CYCLE_LENGTH_DAYS, 2)


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


@app.post("/api/billing/upgrade")
def upgrade_plan(payload: UpgradeRequest, dry_run: bool = False):
    if payload.email not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    email = payload.email
    current_plan = billing_data[email]["plan_name"]

    # Idempotency guard: an already-Premium account can never be upgraded again, whether previewing
    # or applying. No plan/balance mutation occurs on this path.
    if current_plan == "Premium":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already on the Premium plan",
        )

    charge = _prorated_charge(current_plan, "Premium", billing_data[email]["renew_at"])
    days_remaining = _days_remaining(billing_data[email]["renew_at"])

    if dry_run:
        # Preview only -- never mutates plan or balance state (ARCH-03).
        return {
            "prorated_charge": charge,
            "current_plan": current_plan,
            "new_plan": "Premium",
            "days_remaining": days_remaining,
        }

    # Apply the upgrade: plan tier and its usage limits change; the on-demand balance is
    # deliberately left untouched (ARCH-04, REQ-F-06).
    premium = PLAN_CATALOG["Premium"]
    users[email]["plan"] = "Premium"
    users[email]["price"] = premium["price_label"]
    billing_data[email]["plan_name"] = "Premium"
    billing_data[email]["price"] = premium["price_label"]
    for usage in billing_data[email]["usages"]:
        new_total = premium["limits"].get(usage["id"])
        if new_total is not None:
            usage["total"] = new_total

    return {
        "applied_charge": charge,
        "plan": "Premium",
        "billing": billing_data[email],
    }


# Serve the built frontend if it exists (production build)
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.is_dir():
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
