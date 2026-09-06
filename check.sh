#!/usr/bin/env bash
set -euo pipefail

echo "==> [frontend] Installing dependencies..."
npm ci

echo "==> [frontend] Linting..."
npm run lint

echo "==> [frontend] Type-checking + building..."
npm run build

echo "==> [frontend] All checks passed."
