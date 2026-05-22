#!/bin/bash
set -e

# ============================================================
#  NIATBAIK.ORG — Deploy Script
#  Usage:
#    ./deploy.sh              → deploy production (default)
#    ./deploy.sh dev          → deploy development
#    ./deploy.sh prod main    → deploy production from main branch
# ============================================================

ENV="${1:-prod}"
BRANCH="${2:-dev}"

if [ "$ENV" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    ENV_FILE=""
else
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
fi

DC="docker compose -f $COMPOSE_FILE"
cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}>> $1${NC}"; }
warn() { echo -e "${YELLOW}!! $1${NC}"; }
err()  { echo -e "${RED}!! $1${NC}"; exit 1; }

# ---- Pre-flight ----
command -v docker >/dev/null || err "Docker not installed"
docker info >/dev/null 2>&1 || err "Docker daemon not running"

if [ "$ENV" = "prod" ] && [ ! -f "$ENV_FILE" ]; then
    err ".env.production not found! Copy from template:\n   cp .env.production.example .env.production\n   Then edit with real values."
fi

echo ""
echo "============================================"
echo "  NIATBAIK.ORG — Deploy [$ENV] from $BRANCH"
echo "============================================"
echo ""

# ---- Pull ----
log "Pulling latest from $BRANCH..."
git pull origin "$BRANCH" || warn "Git pull failed, deploying current state"

# ---- Stop ----
log "Stopping old containers..."
$DC down --remove-orphans 2>/dev/null || true

# ---- Build ----
log "Building images..."
$DC build --parallel

# ---- Database first ----
log "Starting PostgreSQL..."
$DC up -d postgres
log "Waiting for database..."
for i in $(seq 1 30); do
    if $DC exec postgres pg_isready -U niatbaik -q 2>/dev/null; then
        log "Database ready!"
        break
    fi
    [ "$i" -eq 30 ] && warn "Database timeout"
    sleep 1
done

# ---- Start all ----
log "Starting all services..."
$DC up -d

# ---- Health check ----
log "Checking API health..."
sleep 3
for i in $(seq 1 15); do
    if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
        log "API healthy!"
        break
    fi
    [ "$i" -eq 15 ] && warn "API health check failed — check: $DC logs api"
    sleep 2
done

# ---- Status ----
echo ""
echo "============================================"
log "Deploy selesai! [$ENV]"
echo "============================================"
echo ""
$DC ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
if [ "$ENV" = "prod" ]; then
    echo "  Site   : https://donasi.niatbaik.org"
    echo "  API    : https://donasi.niatbaik.org/api/health"
else
    echo "  Site   : http://localhost"
    echo "  API    : http://localhost:8080/api/health"
    echo "  FE     : http://localhost:3000"
    echo "  DB     : localhost:5432"
fi
echo ""
echo "  Logs   : $DC logs -f"
echo "  Stop   : $DC down"
echo "  Status : $DC ps"
echo ""
