# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Layout

Monorepo with two top-level directories:
- `backend/` — FastAPI + SQLModel + asyncpg (Python 3.12)
- `frontend/` — React 19 + Vite + TypeScript + Tailwind CSS v4

## Running the App

Docker Compose orchestrates all services with two profiles:

```bash
# Development (hot reload, test DB)
docker compose --profile dev up --build

# Production
docker compose --profile prod up --build
```

Copy `.env.example` files before first run:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

## Testing

### Backend
```bash
cd backend && pytest tests/ -v              # all tests
cd backend && pytest tests/test_auth.py -v  # single file
cd backend && pytest tests/test_auth.py::test_login_success -v  # single test
```
Requires the `postgres-test` container (port 5433) to be running.

### Frontend — Unit Tests
```bash
cd frontend && npx vitest run                                    # all tests
cd frontend && npx vitest run tests/unit/hooks/use-auth.test.tsx # single file
cd frontend && npx vitest run -t "login stores token"            # by test name
```

### Frontend — E2E Tests
```bash
cd frontend && npx playwright test
```

### Frontend — Lint & Type Check
```bash
cd frontend && npx eslint .
cd frontend && npx tsc --noEmit
```

### Backend — Lint
```bash
cd backend && uv run ruff check .
cd backend && uv run ruff format --check .
```

## Environment Variables

Backend uses Pydantic BaseSettings (`app/config.py`) which reads from the root `.env`. All config is centralized in the `Settings` class. The root `.env` contains both Postgres container config and backend application config. Frontend uses `VITE_API_URL` from `frontend/.env`.

## API Client Generation

After changing backend endpoints, regenerate the frontend API client:
```bash
scripts/generate-api.sh
```
This fetches the OpenAPI spec from the running backend and runs Orval to generate typed React Query hooks in `frontend/src/api/`. Do not hand-edit files in `frontend/src/api/`.

## Architecture

### Backend
- **Routes** in `app/routes/` — each router has a prefix (e.g., `/api/v1/auth`). Every endpoint needs an `operation_id` for Orval codegen.
- **Auth** — JWT tokens (PyJWT + bcrypt). Dependencies in `app/auth/dependencies.py` provide `get_current_user` and `get_current_admin`.
- **Database** — async SQLAlchemy engine + `async_sessionmaker`. Models in `app/models/`, Alembic migrations in `alembic/`.
- **Test fixtures** (`tests/conftest.py`) — provide `admin_client`, `user_client` (pre-authenticated httpx AsyncClients), `session` (auto-rolled-back), network guard blocking external calls.
- **Package management** — use `uv`, not pip.

### Frontend
- **Routing** — TanStack Router with file-based routes in `src/routes/`. Route tree auto-generated in `routeTree.gen.ts`.
- **State** — Zustand stores in `src/stores/`. Stores are plain JS objects accessible outside React via `getState()` (used in axios interceptors and route `beforeLoad`).
- **Data fetching** — TanStack Query via Orval-generated hooks. Custom axios mutator in `src/lib/axios.ts` translates fetch-style calls to axios.
- **Auth flow** — Zustand `auth-store` holds token → axios request interceptor attaches it → 401 response interceptor clears it. `useAuth` hook composes the store with `useLogin`/`useGetMe` query hooks.
- **Path alias** — `@/` maps to `src/` (configured in vite.config.ts, works in both app and test code).
- **UI components** — shadcn/ui (base-nova theme) in `src/ui/`. Add new ones with `npx shadcn@latest add <component>`.

### Frontend Component Pattern
Feature components follow hooks/views/container structure:
```
components/feature-name/
├── hooks/           # State & logic hooks (useLoginForm)
├── views/           # Pure rendering components (props only, no hooks)
├── types.ts         # Shared TypeScript interfaces
├── container.tsx    # Wires hooks → views
└── index.ts         # Public barrel exports
```

Views and containers use default exports with displayName:
```tsx
const MyView = (props: Props) => { ... };
MyView.displayName = "MyView";
export default MyView;
```
Barrel files re-export as named: `export { default as MyView } from "./my-view";`
