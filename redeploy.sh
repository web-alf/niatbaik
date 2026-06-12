#!/bin/bash
set -e

# ============================================================
#  NIATBAIK.ORG — Redeploy (app + nginx) without touching the DB
#  For pushing code/nginx/bundle changes to a running prod stack.
#
#  What it does:
#    1. Ensures DB_SSLMODE=disable in .env.production (API↔Postgres over the
#       internal Docker network has no TLS).
#    2. Pulls the latest code (fetch + hard reset to origin/<branch>).
#    3. Rebuilds the api + frontend images (Go binary + JS bundle are baked in).
#    4. FORCE-RECREATES nginx, api, frontend — required because a bind-mounted
#       nginx.conf keeps the OLD file's inode after an in-place edit, so a plain
#       reload/restart serves the stale config. Recreate re-binds the new file.
#    5. Health-checks the API.
#
#  Postgres is left running (data + volume untouched).
#
#  Usage:
#    ./redeploy.sh                 # prod, branch main
#    ./redeploy.sh main            # explicit branch
#    NB_GIT_REMOTE=https://github.com/web-alf/niatbaik.git ./redeploy.sh
# ============================================================

BRANCH="${1:-main}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
NB_GIT_REMOTE="${NB_GIT_REMOTE:-}"

DC="docker compose -f $COMPOSE_FILE"
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}>> $1${NC}"; }
warn() { echo -e "${YELLOW}!! $1${NC}"; }
err()  { echo -e "${RED}!! $1${NC}"; exit 1; }

# ---- Pre-flight ----
command -v docker >/dev/null || err "Docker not installed"
docker info >/dev/null 2>&1 || err "Docker daemon not running"
[ -f "$COMPOSE_FILE" ] || err "$COMPOSE_FILE not found — run this from the repo root."
[ -f "$ENV_FILE" ] || err "$ENV_FILE not found. Create it with real secrets first."

echo ""
echo "============================================"
echo "  NIATBAIK.ORG — Redeploy [prod] from $BRANCH"
echo "============================================"
echo ""

# ---- 1. Ensure DB_SSLMODE=disable ----
# Postgres in the Docker network speaks plaintext; the app defaults to sslmode=require
# in production, which would fail. Force disable unless the operator already set it.
if grep -qE '^DB_SSLMODE=' "$ENV_FILE"; then
    CUR="$(grep -E '^DB_SSLMODE=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
    log "DB_SSLMODE already set to '${CUR}' — leaving as is."
else
    cp -f "$ENV_FILE" "${ENV_FILE}.bak"
    printf '\nDB_SSLMODE=disable\n' >> "$ENV_FILE"
    log "Added DB_SSLMODE=disable to $ENV_FILE (backup: ${ENV_FILE}.bak)"
fi

# ---- 2. Pull latest code ----
if [ -n "$NB_GIT_REMOTE" ]; then
    log "Pointing origin at $NB_GIT_REMOTE"
    git remote set-url origin "$NB_GIT_REMOTE"
fi
log "Origin: $(git remote get-url origin)"
cp -f "$ENV_FILE" "${ENV_FILE}.predeploy.bak"   # extra safety net before reset
log "Fetching origin/$BRANCH..."
git fetch origin "$BRANCH" || err "git fetch failed — check remote URL / credentials"
log "Hard-resetting to origin/$BRANCH..."
git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
# .env.production is gitignored, so reset never touches it; restore from backup only
# if it somehow vanished.
[ -f "$ENV_FILE" ] || cp -f "${ENV_FILE}.predeploy.bak" "$ENV_FILE"

# ---- 3. Rebuild app images (no cache surprises: bundle/binary baked at build) ----
log "Building api + frontend images..."
$DC build api frontend

# ---- 4. Recreate nginx + api + frontend (force, to pick up new conf inode/image) ----
log "Recreating nginx, api, frontend..."
$DC up -d --force-recreate --no-deps nginx api frontend

# ---- 5. Health check ----
log "Checking API health..."
sleep 3
OK=0
for i in $(seq 1 20); do
    if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
        log "API healthy!"; OK=1; break
    fi
    sleep 2
done
[ "$OK" -eq 1 ] || warn "API health check failed — inspect: $DC logs --tail=50 api"

# ---- 6. Quick uploads-route sanity (the bug this redeploy fixes) ----
# Confirms nginx now serves /uploads via the API, not the SPA fallback.
log "Verifying /uploads route via nginx..."
CT="$(curl -s -o /dev/null -w '%{content_type}' "http://localhost:80/uploads/" 2>/dev/null || true)"
if echo "$CT" | grep -qi 'text/html'; then
    warn "/uploads/ still returns HTML — nginx may not have picked up the new conf. Try: $DC up -d --force-recreate nginx"
else
    log "/uploads/ routed to API (content-type: ${CT:-n/a})."
fi

echo ""
echo "============================================"
log "Redeploy selesai!"
echo "============================================"
$DC ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $DC ps
echo ""
echo "  Site : https://donasi.niatbaik.org"
echo "  Logs : $DC logs -f api"
echo ""
