#!/bin/bash
set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "Fetching OpenAPI spec from $BACKEND_URL..."
curl -s "$BACKEND_URL/openapi.json" -o "$FRONTEND_DIR/openapi.json"

echo "Generating API client..."
cd "$FRONTEND_DIR"
npx orval

echo "Cleaning up..."
rm -f "$FRONTEND_DIR/openapi.json"

echo "Done! API client generated in frontend/src/api/"
