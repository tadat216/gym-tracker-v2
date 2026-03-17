#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> ruff check"
uv run ruff check app/

echo "==> ruff format --check"
uv run ruff format --check app/

echo "✓ Backend lint passed"
