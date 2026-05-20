# NiatBaik Docker Production Deployment

## Overview

Replace the AAPanel bare-metal deployment guide (`panduan.md`) with a full Docker Compose production setup. AAPanel remains installed on the VPS solely for monitoring Docker containers.

## Architecture

```
Internet → Cloudflare (SSL) → VPS:80 → Nginx container → PHP-FPM container
                                                        → Worker container (queue)
                                                        → Scheduler container (cron)
                                                        → MySQL container
                                                        → Redis container
```

### Containers

| Container   | Base Image            | Role                              | Exposed Port   |
|-------------|-----------------------|-----------------------------------|----------------|
| `app`       | Custom PHP 8.3 FPM   | PHP-FPM application server        | 9000 (internal)|
| `nginx`     | nginx:alpine          | Reverse proxy + static files      | 80 → host      |
| `redis`     | redis:alpine          | Session, cache, queue backend     | 6379 (internal)|
| `mysql`     | mysql:8.4             | Database                          | 3306 (internal)|
| `worker`    | Same as `app`         | `queue:work redis`                | none           |
| `scheduler` | Same as `app`         | `schedule:run` every minute       | none           |

### Network

Single Docker network `niatbaik`. Only Nginx exposes port 80 to the host. All inter-container communication is internal via container names as hostnames.

## Multi-stage Dockerfile

Located at project root: `docker/Dockerfile`

### Stage 1: Composer dependencies

- Base: `composer:2` image
- Copy `composer.json`, `composer.lock`
- `composer install --no-dev --optimize-autoloader --no-scripts`
- Output: `/app/vendor`

### Stage 2: Frontend build

- Base: `node:20-alpine`
- Copy `package.json`, `package-lock.json`
- `npm ci`
- Copy frontend source (`resources/`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`)
- `npm run build`
- Output: `/app/public/build`

### Stage 3: Runtime

- Base: `php:8.3-fpm-alpine`
- Install extensions: `pdo_mysql`, `redis`, `bcmath`, `intl`, `opcache`, `gd`, `zip`, `exif`, `pcntl`
- Copy application source
- Copy `vendor/` from stage 1
- Copy `public/build/` from stage 2
- Configure PHP-FPM: `www.conf` tuning
- Configure OPcache for production
- Set working directory `/var/www/html`
- Run as `www-data` user

## Nginx Configuration

Located at: `docker/nginx/default.conf`

- `server_name _` (Cloudflare handles domain routing)
- `root /var/www/html/public`
- `try_files $uri $uri/ /index.php?$query_string`
- `fastcgi_pass app:9000`
- `client_max_body_size 10M`
- Static asset caching headers for `public/build/`

## Docker Compose

Located at project root: `docker-compose.prod.yml`

### Services

**app** (PHP-FPM):
- Build from `docker/Dockerfile`
- Volumes: bind mount storage + .env
- Depends on: mysql, redis
- Healthcheck: `php-fpm -t`

**nginx**:
- `nginx:alpine`
- Volume: share `public/` from app via named volume
- Ports: `80:80`
- Depends on: app
- Custom config: `docker/nginx/default.conf`

**mysql**:
- `mysql:8.4`
- Volume: named volume `mysql-data`
- Environment from `.env`: DB_DATABASE, DB_USERNAME, DB_PASSWORD
- Healthcheck: `mysqladmin ping`

**redis**:
- `redis:alpine`
- Volume: named volume `redis-data`
- Healthcheck: `redis-cli ping`

**worker**:
- Same image as app
- Command override: `php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600`
- Restart: `always`
- No port exposed
- Depends on: app, mysql, redis

**scheduler**:
- Same image as app
- Command override: shell loop — `while true; do php artisan schedule:run; sleep 60; done`
- Restart: `always`
- Depends on: app, mysql, redis

### Volumes

- `mysql-data` — named volume, persistent
- `redis-data` — named volume, persistent
- `app-public` — named volume, shared between app and nginx for static files

### Bind Mounts (to host)

- `/www/wwwroot/niatbaik/storage` → `/var/www/html/storage` (app, worker, scheduler)
- `/www/wwwroot/niatbaik/src/.env` → `/var/www/html/.env` (app, worker, scheduler)

## .env.production Changes

```env
DB_HOST=mysql
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379
```

All other values remain the same. `DB_HOST` and `REDIS_HOST` use Docker service names instead of `127.0.0.1`.

## PHP Configuration

`docker/php/opcache.ini`:
- `opcache.enable=1`
- `opcache.memory_consumption=128`
- `opcache.max_accelerated_files=10000`
- `opcache.validate_timestamps=0` (production — no stat check)

`docker/php/php.ini`:
- `upload_max_filesize=10M`
- `post_max_size=12M`
- `memory_limit=256M`
- `max_execution_time=300`

## File Structure

```
/home/ekalliptus/dev/niatbaik/
├── docker/
│   ├── Dockerfile
│   ├── nginx/
│   │   └── default.conf
│   └── php/
│       ├── opcache.ini
│       └── php.ini
├── docker-compose.prod.yml
├── .env.production          (updated: DB_HOST=mysql, REDIS_HOST=redis)
├── deploy.sh                (updated: docker compose based)
├── panduan.md               (rewritten: Docker deployment guide)
└── src/                     (Laravel app — unchanged)
```

## Deploy Flow

### First deploy:
1. Clone repo to `/www/wwwroot/niatbaik`
2. `cp src/.env.production src/.env` — edit DB password, mail creds, APP_URL
3. `docker compose -f docker-compose.prod.yml build`
4. `docker compose -f docker-compose.prod.yml up -d`
5. `docker compose -f docker-compose.prod.yml exec app php artisan key:generate`
6. `docker compose -f docker-compose.prod.yml exec app php artisan migrate --force`
7. `docker compose -f docker-compose.prod.yml exec app php artisan storage:link`
8. Create admin user via tinker

### Subsequent deploys:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
docker compose -f docker-compose.prod.yml exec app php artisan view:cache
docker compose -f docker-compose.prod.yml exec app php artisan event:cache
```

## deploy.sh

Updated script wrapping the deploy commands above. Includes:
- `set -e` for fail-fast
- Git pull
- Docker build + up
- Artisan migrate + cache commands
- Status check at the end

## AAPanel Role

AAPanel is NOT used for:
- PHP, Nginx, MySQL, Redis installation or management
- Website configuration
- SSL certificates
- Cron jobs or Supervisor

AAPanel IS used for:
- Monitoring Docker containers (via Docker Manager plugin)
- VPS resource monitoring (CPU, RAM, disk)
- Optional: viewing logs

## Cloudflare Configuration

- DNS A record: `niatbaik.com` → VPS IP (proxied/orange cloud)
- DNS A record: `www.niatbaik.com` → VPS IP (proxied/orange cloud)
- SSL/TLS mode: **Full** (not Full Strict, since origin has no cert)
- Edge caching: default rules

## Panduan.md Rewrite

The existing `panduan.md` will be completely rewritten to document this Docker-based deployment flow. Same structure (numbered steps, tables, troubleshooting), but all steps reference Docker Compose commands instead of AAPanel configuration.

## Out of Scope

- CI/CD pipeline (GitHub Actions, etc.)
- Multi-server / load balancer setup
- S3/object storage for uploads
- Custom domain email (beyond SMTP config)
- Docker Swarm / Kubernetes
