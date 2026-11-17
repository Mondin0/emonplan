#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
docker info >/dev/null
export COMPOSE_PROJECT_NAME="emonplan-e2e-$(openssl rand -hex 12)"
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export OWNER_EMAIL="e2e@example.invalid"
export OWNER_PASSWORD="$(openssl rand -hex 24)"
export PORT=0

# Only the randomly named project and its own volumes are removed.
cleanup() { docker compose -f compose.yaml --env-file /dev/null down --volumes --remove-orphans; }
trap cleanup EXIT HUP INT TERM
docker compose -f compose.yaml --env-file /dev/null up -d --build --wait --wait-timeout 180
E2E_ADDRESS="$(docker compose -f compose.yaml --env-file /dev/null port frontend 8080)"
export E2E_URL="http://$E2E_ADDRESS"
node scripts/test-e2e.mjs
