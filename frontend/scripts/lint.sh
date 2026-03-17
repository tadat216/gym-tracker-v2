#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> eslint"
npx eslint .

echo "==> tsc --noEmit"
npx tsc --noEmit

echo "✓ Frontend lint passed"
