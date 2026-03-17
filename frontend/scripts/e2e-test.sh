#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> playwright"
npx playwright test

echo "✓ Frontend e2e tests passed"
