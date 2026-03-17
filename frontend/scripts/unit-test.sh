#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> vitest"
npx vitest run

echo "✓ Frontend unit tests passed"
