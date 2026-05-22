#!/bin/bash
set -e

# ============================================================
#  NIATBAIK.ORG — Production Deploy Script
#  Stack: Go API + Bun Frontend + PostgreSQL + Nginx
# ============================================================

COMPOSE_FILE="docker-compose.dev.yml"
DC="docker compose -f $COMPOSE_FILE"
BRANCH="${1:-dev}"

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}>> $1${NC}"; }
warn() { echo -e "${YELLOW}!! $1${NC}"; }
err()  { echo -e "${RED}!! $1${NC}"; exit 1; }

# ---- Pre-flight checks ----
command -v docker >/dev/null || err "Docker not installed"
docker info >/dev/null 2>&1 || err "Docker daemon not running"

echo ""
echo "============================================"
echo "  NIATBAIK.ORG — Deploy to $BRANCH"
echo "============================================"
echo ""

# ---- Pull latest ----
log "Pulling latest code from $BRANCH..."
git pull origin "$BRANCH" || warn "Git pull failed, deploying current state"

# ---- Stop old containers ----
log "Stopping containers..."
$DC down --remove-orphans 2>/dev/null || true

# ---- Build ----
log "Building Docker images..."
$DC build --parallel

# ---- Start database first ----
log "Starting PostgreSQL..."
$DC up -d postgres
log "Waiting for database to be ready..."
until $DC exec postgres pg_isready -U niatbaik -q 2>/dev/null; do
    sleep 1
done
log "Database ready!"

# ---- Start all services ----
log "Starting all services..."
$DC up -d

# ---- Health check ----
log "Checking API health..."
sleep 3
for i in $(seq 1 10); do
    if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
        log "API is healthy!"
        break
    fi
    if [ "$i" -eq 10 ]; then
        warn "API health check failed — check logs with: docker compose -f $COMPOSE_FILE logs api"
    fi
    sleep 2
done

# ---- Show status ----
echo ""
echo "============================================"
log "Deploy selesai!"
echo "============================================"
echo ""
$DC ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "  Frontend : http://localhost:3000"
echo "  API      : http://localhost:8080/api/health"
echo "  Full app : http://localhost (via nginx)"
echo "  Database : localhost:5432"
echo ""
echo "  Logs     : $DC logs -f"
echo "  Stop     : $DC down"
echo ""
