#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

echo "Build frontend..."
npm run build

echo "Deploy frontend preview..."
bash "${ROOT_DIR}/ops/deploy-preview.sh"

echo "Deploy plugin..."
bash "${ROOT_DIR}/ops/deploy-plugin.sh"

echo "Deploy completo OK"
