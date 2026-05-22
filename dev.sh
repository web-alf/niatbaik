#!/bin/bash

# ============================================================
#  NIATBAIK.ORG — Local Development Script
#  Usage: ./dev.sh [command]
#
#  Commands:
#    up        Start all services (default)
#    down      Stop all services
#    restart   Restart all services
#    rebuild   Rebuild & restart (after code changes)
#    logs      Tail all logs
#    logs:api  Tail API logs only
#    logs:fe   Tail frontend logs only
#    db        Open PostgreSQL shell
#    db:reset  Drop & recreate database (WARNING: deletes data)
#    seed      Re-run database seeder
#    status    Show container status
#    clean     Stop + remove volumes (full reset)
#    help      Show this help
# ============================================================

set -e

COMPOSE_FILE="docker-compose.dev.yml"
DC="docker compose -f $COMPOSE_FILE"
CMD="${1:-up}"

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}>> $1${NC}"; }
warn() { echo -e "${YELLOW}!! $1${NC}"; }
info() { echo -e "${CYAN}   $1${NC}"; }

show_urls() {
    echo ""
    echo "  ┌─────────────────────────────────────┐"
    echo "  │  NIATBAIK.ORG — Dev Environment      │"
    echo "  ├─────────────────────────────────────┤"
    echo "  │  App      : http://localhost         │"
    echo "  │  Frontend : http://localhost:3000     │"
    echo "  │  API      : http://localhost:8080     │"
    echo "  │  Database : localhost:5432            │"
    echo "  ├─────────────────────────────────────┤"
    echo "  │  Admin    : admin@niatbaik.org       │"
    echo "  │  Password : admin123                 │"
    echo "  └─────────────────────────────────────┘"
    echo ""
}

wait_healthy() {
    log "Waiting for services..."
    for i in $(seq 1 30); do
        if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
            log "All services ready!"
            return 0
        fi
        sleep 1
    done
    warn "Timeout waiting for API — check: $DC logs api"
}

case "$CMD" in
    up)
        log "Starting dev environment..."
        $DC up -d --build
        wait_healthy
        show_urls
        info "Logs: ./dev.sh logs"
        info "Stop: ./dev.sh down"
        ;;

    down)
        log "Stopping all services..."
        $DC down
        log "Done."
        ;;

    restart)
        log "Restarting all services..."
        $DC restart
        wait_healthy
        show_urls
        ;;

    rebuild)
        log "Rebuilding & restarting..."
        $DC down
        $DC build --parallel --no-cache
        $DC up -d
        wait_healthy
        show_urls
        ;;

    rebuild:api)
        log "Rebuilding API only..."
        $DC build --no-cache api
        $DC up -d api
        sleep 3
        wait_healthy
        ;;

    rebuild:fe)
        log "Rebuilding frontend only..."
        $DC build --no-cache frontend
        $DC up -d frontend
        log "Frontend rebuilt: http://localhost:3000"
        ;;

    logs)
        $DC logs -f --tail=50
        ;;

    logs:api)
        $DC logs -f --tail=50 api
        ;;

    logs:fe)
        $DC logs -f --tail=50 frontend
        ;;

    logs:db)
        $DC logs -f --tail=50 postgres
        ;;

    db)
        log "Opening PostgreSQL shell..."
        $DC exec postgres psql -U niatbaik -d niatbaik
        ;;

    db:reset)
        warn "This will DELETE all data!"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            log "Resetting database..."
            $DC exec postgres psql -U niatbaik -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            log "Restarting API (re-runs migrations + seed)..."
            $DC restart api
            sleep 3
            wait_healthy
            log "Database reset complete."
        else
            warn "Cancelled."
        fi
        ;;

    status)
        $DC ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        ;;

    clean)
        warn "This will STOP everything and DELETE all volumes (database, uploads)!"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            log "Cleaning up..."
            $DC down -v --remove-orphans
            log "All clean. Run './dev.sh up' to start fresh."
        else
            warn "Cancelled."
        fi
        ;;

    shell:api)
        log "Opening shell in API container..."
        $DC exec api sh
        ;;

    shell:fe)
        log "Opening shell in frontend container..."
        $DC exec frontend sh
        ;;

    help|--help|-h)
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up            Start all services (default)"
        echo "  down          Stop all services"
        echo "  restart       Restart all services"
        echo "  rebuild       Full rebuild (no cache) & restart"
        echo "  rebuild:api   Rebuild API only"
        echo "  rebuild:fe    Rebuild frontend only"
        echo "  logs          Tail all logs"
        echo "  logs:api      Tail API logs"
        echo "  logs:fe       Tail frontend logs"
        echo "  logs:db       Tail database logs"
        echo "  db            Open PostgreSQL shell"
        echo "  db:reset      Drop & recreate database"
        echo "  status        Show container status"
        echo "  clean         Full cleanup (delete volumes)"
        echo "  shell:api     Shell into API container"
        echo "  shell:fe      Shell into frontend container"
        echo "  help          Show this help"
        echo ""
        ;;

    *)
        warn "Unknown command: $CMD"
        echo "Run './dev.sh help' for available commands."
        exit 1
        ;;
esac
