#!/usr/bin/env bash
# Launches the Spring Boot backend (port 8080) in the background, then the
# Vite frontend (port 5000) in the foreground so its logs show in the workflow
# console. Run with: bash dev.sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ---- Backend ----
mkdir -p "$ROOT/data" "$ROOT/uploads/vehicles" "$ROOT/uploads/gallery"

echo "[dev] Starting Spring Boot backend on :8080 ..."
(
  cd "$ROOT/backend"
  # Use offline mode after the first build so we don't redownload metadata.
  mvn -q -B -DskipTests spring-boot:run
) > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "[dev] Backend PID: $BACKEND_PID  (logs: /tmp/backend.log)"

# Make sure the backend is killed when this script exits.
trap "echo '[dev] stopping backend (pid '$BACKEND_PID')'; kill $BACKEND_PID 2>/dev/null || true" EXIT INT TERM

# ---- Frontend ----
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  echo "[dev] Installing frontend dependencies ..."
  npm install --no-audit --no-fund
fi
echo "[dev] Starting Vite frontend on :5000 ..."
exec npm run dev -- --host 0.0.0.0 --port 5000
