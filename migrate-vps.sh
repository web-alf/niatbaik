#!/bin/bash
set -e

# ============================================================
#  NIATBAIK.ORG — VPS Migration Script
#  Migrasi dari Laravel (main) ke Go+Bun (dev)
#
#  Jalankan di VPS:
#    curl -sL https://raw.githubusercontent.com/anrdart/niatbaik/dev/migrate-vps.sh | bash
#  Atau:
#    cd /path/to/niatbaik && bash migrate-vps.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}>> $1${NC}"; }
warn() { echo -e "${YELLOW}!! $1${NC}"; }
err()  { echo -e "${RED}!! $1${NC}"; exit 1; }
info() { echo -e "${CYAN}   $1${NC}"; }

echo ""
echo "============================================"
echo "  NIATBAIK.ORG — Migrasi VPS"
echo "  Laravel (main) → Go+Bun (dev)"
echo "============================================"
echo ""

# ---- Pre-flight ----
command -v docker >/dev/null || err "Docker not installed"
command -v git >/dev/null || err "Git not installed"
docker info >/dev/null 2>&1 || err "Docker daemon not running"

# ---- Find project directory ----
if [ -f "docker-compose.prod.yml" ]; then
    PROJECT_DIR="$(pwd)"
elif [ -f "/www/wwwroot/niatbaik/docker-compose.prod.yml" ]; then
    PROJECT_DIR="/www/wwwroot/niatbaik"
elif [ -f "/root/niatbaik/docker-compose.prod.yml" ]; then
    PROJECT_DIR="/root/niatbaik"
else
    err "Project not found. Run from project directory or set path manually."
fi

cd "$PROJECT_DIR"
log "Project directory: $PROJECT_DIR"

# ============================================================
# STEP 1: Stop old Laravel containers
# ============================================================
log "STEP 1: Stopping old Laravel containers..."

# Try old compose files
for f in docker-compose.prod.yml docker-compose.yml; do
    if [ -f "$f" ]; then
        docker compose -f "$f" down --remove-orphans 2>/dev/null || true
        docker compose --env-file src/.env -f "$f" down --remove-orphans 2>/dev/null || true
    fi
done

# Kill any stale nginx from AAPanel that blocks ports
# (only kill nginx started by docker, not AAPanel's nginx)
docker ps -q --filter "name=niatbaik" | xargs -r docker stop 2>/dev/null || true
docker ps -q --filter "name=niatbaik" | xargs -r docker rm 2>/dev/null || true

log "Old containers stopped."

# ============================================================
# STEP 2: Switch to dev branch
# ============================================================
log "STEP 2: Switching to dev branch..."

git fetch origin
git stash 2>/dev/null || true
git checkout dev
git pull origin dev

log "Now on branch: $(git branch --show-current)"

# ============================================================
# STEP 3: Setup .env.production
# ============================================================
log "STEP 3: Setting up environment..."

if [ ! -f ".env.production" ] || grep -q "GANTI_DENGAN" .env.production 2>/dev/null || ! grep -q "POSTGRES_PASSWORD" .env.production 2>/dev/null; then
    cp .env.production .env.production.bak 2>/dev/null || true

    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
    DB_PASSWORD=$(openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | xxd -p)

    printf '%s\n' \
      "APP_PORT=8080" \
      "APP_ENV=production" \
      "" \
      "DB_HOST=postgres" \
      "DB_PORT=5432" \
      "DB_USER=niatbaik" \
      "DB_PASSWORD=${DB_PASSWORD}" \
      "DB_NAME=niatbaik" \
      "" \
      "# PostgreSQL container needs this" \
      "POSTGRES_PASSWORD=${DB_PASSWORD}" \
      "" \
      "JWT_SECRET=${JWT_SECRET}" \
      "JWT_EXPIRY=24h" \
      "JWT_REFRESH_EXPIRY=168h" \
      "" \
      "UPLOAD_DIR=/app/uploads" \
      "MAX_UPLOAD_SIZE=10485760" \
      "" \
      "CORS_ORIGINS=https://donasi.niatbaik.org" \
      > .env.production

    log "Created .env.production with auto-generated secrets"
    info "DB_PASSWORD: $DB_PASSWORD"
    info "JWT_SECRET:  $JWT_SECRET"
    warn "SIMPAN password di atas! Tidak bisa dilihat lagi."
else
    log ".env.production already exists, keeping it."
fi

# ============================================================
# STEP 4: Build & Deploy
# ============================================================
log "STEP 4: Building Docker images..."

docker compose -f docker-compose.prod.yml build --parallel

log "Starting PostgreSQL..."
docker compose -f docker-compose.prod.yml up -d postgres

log "Waiting for database..."
for i in $(seq 1 30); do
    if docker compose -f docker-compose.prod.yml exec postgres pg_isready -U niatbaik -q 2>/dev/null; then
        log "Database ready!"
        break
    fi
    [ "$i" -eq 30 ] && warn "Database timeout — continuing anyway"
    sleep 1
done

log "Starting all services..."
docker compose -f docker-compose.prod.yml up -d

# ---- Health check ----
log "Checking health..."
sleep 5
for i in $(seq 1 15); do
    if curl -sf http://localhost:8090/api/health >/dev/null 2>&1; then
        log "API healthy!"
        break
    fi
    [ "$i" -eq 15 ] && warn "API not responding — check: docker compose -f docker-compose.prod.yml logs api"
    sleep 2
done

# ============================================================
# STEP 5: AAPanel nginx config
# ============================================================
log "STEP 5: AAPanel reverse proxy setup"

AAPANEL_CONF="/www/server/panel/vhost/nginx/donasi.niatbaik.org.conf"

echo ""
echo "============================================"
echo "  SETUP AAPANEL REVERSE PROXY"
echo "============================================"
echo ""
info "Buka AAPanel → Website → Add Site:"
info "  Domain: donasi.niatbaik.org"
info "  Type: Reverse Proxy"
info ""
info "Atau tambahkan config nginx berikut:"
echo ""
cat << 'NGINXEOF'
# /www/server/panel/vhost/nginx/donasi.niatbaik.org.conf
server {
    listen 80;
    listen 443 ssl http2;
    server_name donasi.niatbaik.org;

    # SSL (managed by AAPanel / Let's Encrypt)
    ssl_certificate    /www/server/panel/vhost/cert/donasi.niatbaik.org/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/donasi.niatbaik.org/privkey.pem;

    client_max_body_size 10M;

    # Reverse proxy ke Docker nginx (port 8090)
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    # Block sensitive paths
    location ~ /\. { deny all; }

    access_log /www/wwwlogs/donasi.niatbaik.org.log;
    error_log /www/wwwlogs/donasi.niatbaik.org.error.log;
}
NGINXEOF

echo ""

# ============================================================
# DONE
# ============================================================
echo ""
echo "============================================"
log "Migrasi selesai!"
echo "============================================"
echo ""
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "  Architecture:"
echo "  Internet → Cloudflare → AAPanel nginx :80/:443"
echo "                            ↓"
echo "                    Docker nginx :8090"
echo "                       /          \\"
echo "              /api/* → Go:8080    /* → Bun:3000"
echo "                        ↓"
echo "                  PostgreSQL:5432"
echo ""
echo "  Next steps:"
echo "  1. Setup AAPanel reverse proxy (config di atas)"
echo "  2. Enable SSL di AAPanel (Let's Encrypt / Cloudflare)"
echo "  3. Test: curl https://donasi.niatbaik.org/api/health"
echo "  4. Login: admin@niatbaik.org / admin123"
echo "     → SEGERA ganti password setelah login!"
echo ""
echo "  Logs   : docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart: docker compose -f docker-compose.prod.yml restart"
echo "  Stop   : docker compose -f docker-compose.prod.yml down"
echo ""
