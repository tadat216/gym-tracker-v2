#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Default to localhost:5433 for running outside Docker Compose
export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql+asyncpg://gymtracker:secret@localhost:5433/gym_tracker_test}"

echo "==> pytest"
uv run pytest tests/ -v

echo "✓ Backend tests passed"
