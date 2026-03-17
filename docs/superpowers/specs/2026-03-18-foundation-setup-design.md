# Gym Tracker V2 — Foundation Setup Design

## Overview

Foundation scaffolding for a full-stack gym tracking web app. Backend (FastAPI + SQLModel + asyncpg) and frontend (React + Vite + TypeScript + Tailwind + shadcn/ui) in a monorepo, orchestrated via Docker Compose with `dev` and `prod` profiles. Deployed on a VPS (2GB RAM, 15GB free disk) for ~10 users.

This spec covers **setup only** — config files, Docker, tooling, test wiring. No domain implementation (routes, models, services).

## Project Structure

```
gym-tracker-v2/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # Minimal FastAPI app: CORS, GET /api/v1/health
│   │   ├── config.py               # Pydantic BaseSettings, auto-loads .env
│   │   └── database.py             # Async engine, session factory, get_session
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py                  # Wired to async engine
│   │   └── versions/
│   ├── tests/
│   │   └── conftest.py             # Async test client, test DB session fixtures
│   ├── pyproject.toml
│   ├── Dockerfile                  # Multi-stage: dev + prod targets
│   ├── ruff.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                 # Minimal app with health check
│   │   ├── api/                    # Orval-generated API client (committed)
│   │   └── lib/
│   │       └── axios.ts            # Axios instance with base URL
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── orval.config.ts
│   ├── playwright.config.ts
│   ├── package.json
│   ├── Dockerfile                  # Multi-stage: dev (Vite) + prod (Nginx)
│   ├── nginx.conf
│   └── .env.example
│
├── docker/
│   └── init-db.sh                  # Creates dev + test databases
│
├── scripts/
│   └── generate-api.sh             # Fetch OpenAPI spec → run Orval → cleanup
│
├── docker-compose.yml              # Profiles: dev, prod
├── .env.example
├── .gitignore
├── CLAUDE.md
└── PLANS.md
```

Future domain folders (`auth/`, `muscles/`, `exercises/`, `workouts/`) will each contain `models.py`, `routes.py`, `service.py`. Tests will mirror this structure with `test_routes.py` and `test_service.py` per domain.

## Docker Compose Architecture

Single `docker-compose.yml` with two profiles.

### Services

| Service | Profile | Port | Description |
|---------|---------|------|-------------|
| `postgres` | (none — always runs) | 5432 | DB: `gym_tracker_dev` (dev), `gym_tracker` (prod) |
| `postgres-test` | dev | 5433 | Test DB: `gym_tracker_test` |
| `backend-dev` | dev | 8000 | uvicorn --reload, source mounted |
| `frontend-dev` | dev | 5173 | vite dev server, source mounted |
| `backend-prod` | prod | 8000 | uvicorn, 2 workers |
| `frontend-prod` | prod | 80 | Nginx serving built static files |

### Volumes

- `pgdata` — persistent Postgres data
- `pgdata-test` — test DB data (can be wiped freely)
- Dev profile mounts `./backend` and `./frontend` for hot-reload

### Commands

- Dev: `docker compose --profile dev up --build`
- Prod: `docker compose --profile prod up --build -d`

**Note**: Dev and prod profiles use the same ports (8000 for backend, etc.) — never run both profiles simultaneously.

## Dockerfiles

### Backend Dockerfile

Multi-stage with two targets:
- **`dev`**: Python base, install deps, run `uvicorn --reload`
- **`prod`**: Python base, install deps (no dev deps), run `uvicorn` with 2 workers

### Frontend Dockerfile

Multi-stage with two targets:
- **`dev`**: Node base, install deps, run `vite dev`
- **`prod`**: Node base, `npm run build`, then copy dist into Nginx image

## Database Init

`docker/init-db.sh` — mounted as `/docker-entrypoint-initdb.d/init-db.sh` on the `postgres` container. Runs on first start only (when pgdata volume is empty). Creates:
- `gym_tracker_dev` database
- `gym_tracker_test` is handled by the `postgres-test` container's `POSTGRES_DB` env var

## Environment Variables

### Root `.env.example` (docker-compose)

```
POSTGRES_USER=gymtracker
POSTGRES_PASSWORD=secret
POSTGRES_DB=gym_tracker
```

### Backend `.env.example`

```
# Dev default — prod deployment overrides to gym_tracker
DATABASE_URL=postgresql+asyncpg://gymtracker:secret@postgres:5432/gym_tracker_dev
TEST_DATABASE_URL=postgresql+asyncpg://gymtracker:secret@postgres-test:5432/gym_tracker_test
CORS_ORIGINS=http://localhost:5173
# Auth (placeholder — implemented in next phase)
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend `.env.example`

```
VITE_API_URL=http://localhost:8000/api/v1
```

### Config Pattern

`app/config.py` uses Pydantic `BaseSettings` to auto-load `.env`. All env vars are declared as typed fields. Import `settings` object anywhere — no `load_dotenv()` calls needed. Adding a new env var = adding a field to the Settings class.

### How env vars reach containers

- Backend and frontend containers use Docker Compose `env_file` directive pointing to their respective `.env` files
- Root `.env` is used by `docker-compose.yml` for Postgres container config

## API Generation Script

`scripts/generate-api.sh`:
1. Fetches `/openapi.json` from running backend
2. Runs Orval to generate typed API client into `frontend/src/api/`
3. Removes the downloaded `openapi.json` file after completion

Generated API client is **committed to git** — frontend builds don't depend on backend being available.

## Testing Setup

### Backend Tests

- **Runner**: pytest + pytest-asyncio (config in `pyproject.toml` under `[tool.pytest.ini_options]`)
- **Client**: `httpx.AsyncClient` against the FastAPI app
- **Database**: connects to `TEST_DATABASE_URL` (postgres-test container, host port 5433 / container port 5432)
- **Fixtures** in `conftest.py`: async test client, test DB session, table create/drop per session
- **Factories**: factory-boy for test data generation
- **Linting**: ruff

### Frontend Unit Tests

- **Runner**: Vitest (configured in `vite.config.ts`)
- **Environment**: jsdom
- **Utilities**: `@testing-library/react`
- **Mocks**: API calls mocked — tests component behavior in isolation

### Frontend E2E Tests

- **Runner**: Playwright
- **Target**: `http://localhost:5173` (real running frontend)
- **No mocks**: Browser → Frontend → Backend → Test DB (port 5433)
- **Flow**: seed test DB → run tests → wipe test DB

## Auth (Design Decision — Not Implemented in Foundation)

- JWT access token only, stored in localStorage
- 7-day expiry
- No self-registration — admin creates users
- Implementation deferred to next phase

## Resource Constraints

- VPS: 2GB RAM, 15GB free disk
- Prod uvicorn: 2 workers (conservative for RAM)
- Single Postgres instance shared across environments on VPS
- ~10 users

## Out of Scope

- Domain implementation (models, routes, services)
- MCP server
- Seed data for default muscle groups / exercises
- User registration flow
- UI pages and components
