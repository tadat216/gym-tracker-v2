# Gym Tracker v2

## Project Layout

Monorepo with two top-level directories:
- `backend/` — FastAPI + SQLModel + asyncpg (Python 3.12)
- `frontend/` — React + Vite + TypeScript + Tailwind CSS v4

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
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Testing

### Backend
```bash
cd backend && pytest tests/ -v
```
Requires the `postgres-test` container (port 5433) to be running.

### Frontend — Unit Tests
```bash
cd frontend && npx vitest run
```

### Frontend — E2E Tests
```bash
cd frontend && npx playwright test
```

## Environment Variables

Backend uses Pydantic BaseSettings (`app/config.py`) which reads from `backend/.env`. All config is centralized in the `Settings` class.

## API Client Generation

After changing backend endpoints, regenerate the frontend API client:
```bash
scripts/generate-api.sh
```
This fetches the OpenAPI spec from the running backend and runs Orval to generate typed React Query hooks in `frontend/src/api/`.
