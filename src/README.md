# StreamPlex (demo app)

A small full-stack demo app: FastAPI backend serving a mock auth/billing API, and a
React (Vite) frontend for signing in and viewing a subscription's billing details.

> Note: this documents the application code under `src/`. The root [`README.md`](../README.md)
> documents the AIRE workflow framework used to build this repo.

## Structure

```
src/
├── backend/           FastAPI app, in-memory mock data (no database)
│   ├── main.py
│   └── requirements.txt
└── frontend/           React 19 + Vite app
    ├── src/
    │   ├── App.jsx              Routes: /login, /billing (protected)
    │   ├── context/AuthContext.jsx   Auth state, login/register/logout
    │   └── pages/
    │       ├── Login.jsx        Sign in / sign up form
    │       └── Billing.jsx      Plan, renewal date, usage breakdown
    └── vite.config.js   Dev-server proxy: /api -> http://localhost:8000
```

## Backend

- **Framework**: FastAPI
- **Storage**: in-memory Python dicts (`users`, `billing_data`) — resets on restart, no database
- **Endpoints**:
  - `POST /api/auth/login` — `{ email, password }` -> `{ access_token, user }`
  - `POST /api/auth/register` — `{ name, email, password }` -> `{ access_token, user }`
  - `GET /api/users/me?email=` — current user profile
  - `GET /api/billing?email=` — plan, renewal date, feature usage
- Also serves the built frontend (`frontend/dist/`) as static files when present, so a single
  process can run both API and UI in production.

### Run

```bash
cd src/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Frontend

- **Stack**: React 19, React Router 7, Vite 8, Oxlint
- **Auth**: token is just the user's email, stored in `localStorage`; `AuthContext` fetches
  `/api/users/me` on load to restore the session and redirects to `/login` when missing
- **Pages**: `Login` (sign in / sign up toggle) and `Billing` (protected route, shown after login)
- **Premium upgrade (in progress, Epic 4702)**: Standard subscribers see an **Upgrade to Premium** button in
  the Billing title row. It opens `components/UpgradeDialog.jsx`, a modal dialog with the plan comparison
  and Premium benefits that closes on Cancel, Escape or a backdrop click and returns focus to the button.
  The prorated charge and the confirm step arrive in later stories.

### Run

```bash
cd src/frontend
npm install
npm run dev       # starts Vite, proxies /api to localhost:8000
npm run build      # production build to dist/
npm run lint       # oxlint
```

## Tests

Tests live in the repo-root `tests/` tree, not under `src/`.

| Suite | Location | Run |
|---|---|---|
| Frontend unit tests (Vitest + React Testing Library) | `tests/unit/frontend/` | `cd src/frontend && npx vitest run --config vitest.config.js` (add `--coverage` for a report) |
| Behaviour specs (Gherkin in `spec/behavior/`) | `tests/behavior/` | `podman build -t aire-behavior:local -f tests/.evals/behavior/Containerfile .` then `podman run --rm -v "<repo>:/work:Z" -v /work/src/frontend/node_modules -e AIRE_STORY_KEY=story-1.1 aire-behavior:local "sh tests/.evals/behavior/run.sh b1"` |
| Browser tests (Playwright) | `tests/e2e/` | `npx playwright test tests/e2e/ --headed` from the repo root (`playwright.config.ts` starts both servers if they are not running; the backend needs `src/backend/.venv`) |

## Running both together

1. Start the backend on port 8000 (see above).
2. Start the frontend dev server (`npm run dev` in `src/frontend`) — it proxies `/api/*` calls
   to the backend.
3. Open the printed Vite URL and sign in with the seeded demo account:
   `tpg@example.com` / `password`.

For a production-style single-process run, build the frontend (`npm run build`) so its
`dist/` output is picked up and served by the FastAPI app.
