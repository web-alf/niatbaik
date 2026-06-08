#!/bin/bash
# ============================================================
#  Inject testing seed data into the running PostgreSQL container.
#  Run from the project root on the VPS:
#    bash backend/seed_testing.sh         # prod (default)
#    bash backend/seed_testing.sh dev     # dev compose
# ============================================================
set -e
ENV="${1:-prod}"
COMPOSE_FILE="docker-compose.${ENV}.yml"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo ">> Injecting seed into PostgreSQL ($ENV)..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U niatbaik -d niatbaik < backend/seed_testing.sql

echo ">> Done. Restart API to refresh any cached aggregates (optional):"
echo "   docker compose -f $COMPOSE_FILE restart api"
