# Docker Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production Docker Compose setup for NiatBaik (PHP-FPM + Nginx + MySQL + Redis + Worker + Scheduler), replace the AAPanel deployment guide.

**Architecture:** Multi-stage Dockerfile builds a slim PHP 8.3 FPM image with compiled frontend assets. Nginx container serves static files and proxies PHP to FPM. Worker and scheduler reuse the same image with command overrides. Cloudflare handles SSL; only port 80 is exposed.

**Tech Stack:** Docker, Docker Compose, PHP 8.3 FPM Alpine, Nginx Alpine, MySQL 8.4, Redis Alpine, Vite/Node 20

**Spec:** `docs/superpowers/specs/2026-05-20-docker-deployment-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `docker/Dockerfile` | Create | Multi-stage build: composer deps → npm build → PHP-FPM runtime |
| `docker/nginx/default.conf` | Create | Nginx vhost: static files + fastcgi proxy to app:9000 |
| `docker/php/php.ini` | Create | PHP runtime config (upload limits, memory, execution time) |
| `docker/php/opcache.ini` | Create | OPcache production settings |
| `docker-compose.prod.yml` | Create | All 6 services, volumes, network, healthchecks |
| `src/.env.production` | Modify | Change DB_HOST and REDIS_HOST to container names |
| `deploy.sh` | Rewrite | Docker-based deploy script |
| `panduan.md` | Rewrite | Full Docker deployment guide in Bahasa Indonesia |
| `.gitignore` | Modify | Ignore storage bind mount artifacts if needed |
| `.dockerignore` | Create | Exclude vendor, node_modules, .git from build context |

---

### Task 1: Create .dockerignore

**Files:**
- Create: `.dockerignore` (at repo root, next to `docker-compose.prod.yml`)

- [ ] **Step 1: Create `.dockerignore`**

```
.git
.github
.claude
docs
src/vendor
src/node_modules
src/storage/logs/*
src/storage/framework/cache/*
src/storage/framework/sessions/*
src/storage/framework/views/*
src/.env
src/.env.backup
src/.phpunit.result.cache
*.sql
legacy
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore for production build"
```

---

### Task 2: Create PHP configuration files

**Files:**
- Create: `docker/php/php.ini`
- Create: `docker/php/opcache.ini`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p docker/php
```

- [ ] **Step 2: Create `docker/php/php.ini`**

```ini
[PHP]
upload_max_filesize = 10M
post_max_size = 12M
memory_limit = 256M
max_execution_time = 300
expose_php = Off
date.timezone = Asia/Jakarta
```

- [ ] **Step 3: Create `docker/php/opcache.ini`**

```ini
[opcache]
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 0
opcache.save_comments = 1
opcache.fast_shutdown = 1
```

- [ ] **Step 4: Commit**

```bash
git add docker/php/
git commit -m "chore: add PHP and OPcache production config"
```

---

### Task 3: Create Nginx configuration

**Files:**
- Create: `docker/nginx/default.conf`

- [ ] **Step 1: Create directory**

```bash
mkdir -p docker/nginx
```

- [ ] **Step 2: Create `docker/nginx/default.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/html/public;

    index index.php index.html;

    charset utf-8;
    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
    }

    location /build/ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add docker/nginx/
git commit -m "chore: add Nginx production config for Docker"
```

---

### Task 4: Create multi-stage Dockerfile

**Files:**
- Create: `docker/Dockerfile`

- [ ] **Step 1: Create `docker/Dockerfile`**

The build context will be `src/` (set in docker-compose.prod.yml). All paths in COPY are relative to `src/`.

```dockerfile
# ============================================================
# Stage 1: Composer dependencies
# ============================================================
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# ============================================================
# Stage 2: Frontend build
# ============================================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY resources/ resources/
COPY vite.config.js postcss.config.js tailwind.config.js ./
COPY public/ public/
RUN npm run build

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache \
        icu-libs \
        libpng \
        libjpeg-turbo \
        libwebp \
        freetype \
        libzip \
        linux-headers \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        freetype-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        bcmath \
        intl \
        opcache \
        gd \
        zip \
        exif \
        pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/*

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/99-opcache.ini

WORKDIR /var/www/html

COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

RUN mkdir -p storage/logs \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
```

Note on COPY paths: The build context is `src/` but the Dockerfile is at `docker/Dockerfile`. The `COPY docker/php/...` lines work because docker-compose sets `context: .` (repo root) — see Task 5. All other COPY commands (`COPY . .`, `COPY composer.json`, etc.) copy from repo root context, so the Dockerfile must account for the `src/` prefix. We'll handle this in Task 5 by setting the build context to repo root and adjusting paths.

**Revised approach — build context is repo root (`.`):**

```dockerfile
# ============================================================
# Stage 1: Composer dependencies
# ============================================================
FROM composer:2 AS vendor

WORKDIR /app

COPY src/composer.json src/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# ============================================================
# Stage 2: Frontend build
# ============================================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm ci

COPY src/resources/ resources/
COPY src/vite.config.js src/postcss.config.js src/tailwind.config.js ./
COPY src/public/ public/
RUN npm run build

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache \
        icu-libs \
        libpng \
        libjpeg-turbo \
        libwebp \
        freetype \
        libzip \
        linux-headers \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        freetype-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        bcmath \
        intl \
        opcache \
        gd \
        zip \
        exif \
        pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/*

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/99-opcache.ini

WORKDIR /var/www/html

COPY --chown=www-data:www-data src/ .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

RUN mkdir -p storage/logs \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
```

- [ ] **Step 2: Verify Dockerfile syntax locally**

```bash
docker build --check -f docker/Dockerfile .
```

If `--check` not available (older Docker), just verify no syntax errors:
```bash
docker build --no-cache --progress=plain -f docker/Dockerfile . 2>&1 | head -5
```

Expected: build starts without parse errors. Cancel with Ctrl+C after confirming.

- [ ] **Step 3: Commit**

```bash
git add docker/Dockerfile
git commit -m "feat: add multi-stage production Dockerfile"
```

---

### Task 5: Create docker-compose.prod.yml

**Files:**
- Create: `docker-compose.prod.yml` (at repo root)

- [ ] **Step 1: Create `docker-compose.prod.yml`**

```yaml
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: runtime
    restart: unless-stopped
    volumes:
      - ./src/.env:/var/www/html/.env:ro
      - app-storage:/var/www/html/storage
      - app-public:/var/www/html/public
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - niatbaik
    healthcheck:
      test: ["CMD-SHELL", "php-fpm -t 2>/dev/null || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - app-public:/var/www/html/public:ro
    depends_on:
      - app
    networks:
      - niatbaik

  mysql:
    image: mysql:8.4
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - niatbaik
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${DB_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - niatbaik
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: runtime
    restart: unless-stopped
    command: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
    volumes:
      - ./src/.env:/var/www/html/.env:ro
      - app-storage:/var/www/html/storage
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - niatbaik

  scheduler:
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: runtime
    restart: unless-stopped
    command: sh -c "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"
    volumes:
      - ./src/.env:/var/www/html/.env:ro
      - app-storage:/var/www/html/storage
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - niatbaik

networks:
  niatbaik:
    driver: bridge

volumes:
  mysql-data:
  redis-data:
  app-storage:
  app-public:
```

Note: `app-public` is a named volume populated by the `app` container at build time (the Dockerfile COPYs built assets into `/var/www/html/public`). Nginx mounts it read-only to serve static files. `app-storage` is a named volume for Laravel storage shared between app, worker, and scheduler.

For first deploy on VPS, if you want storage on the host filesystem instead of a named volume, replace the `app-storage` volume with a bind mount:
```yaml
# Replace in app, worker, scheduler:
- /www/wwwroot/niatbaik/storage:/var/www/html/storage
```
The default plan uses named volumes for simplicity. The panduan will document the bind-mount alternative.

- [ ] **Step 2: Validate compose syntax**

```bash
docker compose -f docker-compose.prod.yml config --quiet
```

Expected: no output (valid). If errors, fix and re-run.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add production Docker Compose (6 services)"
```

---

### Task 6: Update .env.production

**Files:**
- Modify: `src/.env.production` (lines 24-25 DB_HOST, lines 49-50 REDIS_HOST)

- [ ] **Step 1: Update DB_HOST and REDIS_HOST**

Change `DB_HOST=127.0.0.1` to `DB_HOST=mysql`:

```
DB_HOST=mysql
```

Change `REDIS_HOST=127.0.0.1` to `REDIS_HOST=redis`:

```
REDIS_HOST=redis
```

Also update the comments to remove AAPanel references:

Line 22-23: Change:
```
# Database — sesuaikan dengan database yang dibuat di AAPanel
```
To:
```
# Database — sesuaikan dengan docker-compose.prod.yml
```

Line 46-47: Change:
```
# Redis — password kosong kalau Redis default AAPanel
```
To:
```
# Redis — default tanpa password di Docker
```

- [ ] **Step 2: Commit**

```bash
git add src/.env.production
git commit -m "chore: update .env.production for Docker (container hostnames)"
```

---

### Task 7: Rewrite deploy.sh

**Files:**
- Rewrite: `deploy.sh`

- [ ] **Step 1: Replace contents of `deploy.sh`**

```bash
#!/bin/bash
set -e

COMPOSE_FILE="docker-compose.prod.yml"
DC="docker compose -f $COMPOSE_FILE"

cd "$(dirname "$0")"

echo ">> Pulling latest code..."
git pull origin main

echo ">> Building Docker images..."
$DC build

echo ">> Starting containers..."
$DC up -d

echo ">> Waiting for database..."
$DC exec app sh -c 'until php artisan db:monitor --databases=mysql 2>/dev/null; do sleep 2; done' || sleep 10

echo ">> Running migrations..."
$DC exec app php artisan migrate --force

echo ">> Caching config..."
$DC exec app php artisan config:cache
$DC exec app php artisan route:cache
$DC exec app php artisan view:cache
$DC exec app php artisan event:cache

echo ">> Restarting worker..."
$DC restart worker scheduler

echo ""
echo ">> Deploy selesai!"
$DC ps
```

- [ ] **Step 2: Commit**

```bash
git add deploy.sh
git commit -m "chore: rewrite deploy.sh for Docker Compose"
```

---

### Task 8: Rewrite panduan.md

**Files:**
- Rewrite: `panduan.md`

- [ ] **Step 1: Replace entire contents of `panduan.md`**

```markdown
# Panduan Deploy NiatBaik di VPS (Docker)

## Kebutuhan

- VPS Ubuntu 22.04 / 24.04 LTS (minimal 1GB RAM, 1 vCPU)
- Docker & Docker Compose sudah terinstal
- Domain sudah diarahkan ke IP VPS via Cloudflare (proxied)
- AAPanel (opsional) — hanya untuk monitoring

---

## 1. Instal Docker

Jika Docker belum terinstal:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Verifikasi:

```bash
docker --version
docker compose version
```

---

## 2. Instal AAPanel (Opsional — Monitoring Only)

```bash
wget -O install.sh https://www.aapanel.com/script/install_7.0_en.sh && bash install.sh aapanel
```

Setelah instal:
- Buka AAPanel di browser
- **App Store** → instal **Docker Manager** plugin
- Plugin ini akan menampilkan container Docker yang berjalan

> **Catatan**: Jangan instal Nginx/PHP/MySQL/Redis di AAPanel — semua sudah di Docker.

---

## 3. Clone Repository

```bash
mkdir -p /www/wwwroot
cd /www/wwwroot

git clone https://USERNAME:TOKEN@github.com/anrdart/niatbaik.git niatbaik
cd niatbaik
```

> **Tips SSH Key**: Generate di VPS:
> ```bash
> ssh-keygen -t ed25519 -C "deploy@vps"
> cat ~/.ssh/id_ed25519.pub
> ```
> Tambahkan public key di GitHub → Settings → SSH Keys.
> Lalu clone pakai: `git clone git@github.com:anrdart/niatbaik.git niatbaik`

---

## 4. Konfigurasi Environment

```bash
cp src/.env.production src/.env
nano src/.env
```

Yang **wajib diganti**:

```env
APP_URL=https://niatbaik.com

DB_DATABASE=niatbaik
DB_USERNAME=niatbaik
DB_PASSWORD=GANTI_PASSWORD_DB

MAIL_USERNAME=emailkamu@gmail.com
MAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx
MAIL_FROM_ADDRESS=noreply@niatbaik.com
```

> **Penting**: `DB_HOST=mysql` dan `REDIS_HOST=redis` sudah benar — jangan diubah ke IP. Ini nama container Docker.

---

## 5. Build & Jalankan

```bash
cd /www/wwwroot/niatbaik

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Cek status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Semua container harus `running` dan `healthy`.

---

## 6. Inisialisasi Aplikasi

```bash
DC="docker compose -f docker-compose.prod.yml"

# Generate app key
$DC exec app php artisan key:generate

# Jalankan migrasi database
$DC exec app php artisan migrate --force

# Link storage
$DC exec app php artisan storage:link

# Optimasi cache
$DC exec app php artisan config:cache
$DC exec app php artisan route:cache
$DC exec app php artisan view:cache
$DC exec app php artisan event:cache
```

---

## 7. Cloudflare DNS & SSL

1. Login ke Cloudflare
2. Tambahkan DNS record:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `niatbaik.com` | IP VPS | Proxied (orange) |
| A | `www` | IP VPS | Proxied (orange) |

3. **SSL/TLS** → pilih mode **Full**
4. Akses `https://niatbaik.com` — harus sudah jalan

---

## 8. Buat Admin Pertama

```bash
DC="docker compose -f docker-compose.prod.yml"
$DC exec app php artisan tinker
```

```php
$user = \App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@niatbaik.com',
    'password' => bcrypt('GANTI_PASSWORD_ADMIN'),
    'role' => 'admin',
    'email_verified_at' => now(),
]);
```

Akses admin panel di `https://niatbaik.com/master`.

---

## Deploy Update

Setiap ada update kode:

```bash
cd /www/wwwroot/niatbaik
bash deploy.sh
```

Atau manual:

```bash
cd /www/wwwroot/niatbaik
DC="docker compose -f docker-compose.prod.yml"

git pull origin main
$DC build
$DC up -d
$DC exec app php artisan migrate --force
$DC exec app php artisan config:cache
$DC exec app php artisan route:cache
$DC exec app php artisan view:cache
$DC exec app php artisan event:cache
$DC restart worker scheduler
```

---

## Perintah Berguna

| Perintah | Fungsi |
|----------|--------|
| `$DC ps` | Lihat status semua container |
| `$DC logs app` | Lihat log PHP-FPM |
| `$DC logs nginx` | Lihat log Nginx |
| `$DC logs worker` | Lihat log queue worker |
| `$DC logs -f app` | Follow log realtime |
| `$DC exec app sh` | Masuk shell container app |
| `$DC exec app php artisan tinker` | Jalankan Tinker |
| `$DC down` | Stop semua container |
| `$DC up -d` | Start semua container |
| `$DC restart worker` | Restart queue worker |
| `$DC build --no-cache` | Rebuild tanpa cache |

> **Catatan**: `$DC` = `docker compose -f docker-compose.prod.yml`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| 502 Bad Gateway | `$DC logs app` — cek PHP-FPM error. `$DC ps` — pastikan `app` healthy |
| 500 error | `$DC exec app cat storage/logs/laravel.log` — biasanya .env salah |
| Container restart loop | `$DC logs <nama>` — cek error. Biasanya DB belum ready |
| CSS/JS tidak muncul | `$DC build --no-cache` — rebuild frontend assets |
| Queue tidak jalan | `$DC logs worker` — cek error |
| Redis error | `$DC ps` — pastikan redis healthy. `$DC restart redis` |
| Upload gagal | Cek `client_max_body_size` di `docker/nginx/default.conf` |
| Permission denied (storage) | `$DC exec app chown -R www-data:www-data storage bootstrap/cache` |
| Database connection refused | Pastikan `DB_HOST=mysql` di `.env` (bukan 127.0.0.1) |
| Build error (npm) | `$DC build --no-cache` — atau cek `package-lock.json` valid |
| Disk penuh | `docker system prune -a` — hapus image/container lama |

---

## Struktur di VPS

```
/www/wwwroot/niatbaik/               <- root project
├── docker/                          <- Docker config
│   ├── Dockerfile                   <- multi-stage build
│   ├── nginx/
│   │   └── default.conf             <- Nginx vhost
│   └── php/
│       ├── php.ini                  <- PHP settings
│       └── opcache.ini              <- OPcache settings
├── docker-compose.prod.yml          <- production compose
├── deploy.sh                        <- deploy script
├── panduan.md                       <- file ini
└── src/                             <- Laravel app
    ├── .env                         <- konfigurasi aktif
    ├── .env.production              <- template
    └── ...
```

## Docker Volumes

| Volume | Isi | Persist |
|--------|-----|---------|
| `mysql-data` | Database MySQL | Ya |
| `redis-data` | Redis data | Ya |
| `app-storage` | Laravel storage (uploads, logs, cache) | Ya |
| `app-public` | Static files (CSS/JS compiled) | Ya (rebuild saat deploy) |

Untuk backup database:
```bash
DC="docker compose -f docker-compose.prod.yml"
$DC exec mysql mysqldump -u root -p"$DB_PASSWORD" niatbaik > backup.sql
```
```

- [ ] **Step 2: Commit**

```bash
git add panduan.md
git commit -m "docs: rewrite deployment guide for Docker"
```

---

### Task 9: Update .gitignore

**Files:**
- Modify: `.gitignore` (repo root)

- [ ] **Step 1: Ensure Docker-related files are not ignored**

Current `.gitignore` at repo root:
```
src/vendor/
src/node_modules/
src/.env
*.sql
legacy/
```

No changes needed — Docker files (`docker/`, `docker-compose.prod.yml`) are not ignored. Confirm by checking:

```bash
git status --short docker/ docker-compose.prod.yml .dockerignore
```

Expected: new files show as `??` (untracked), not ignored.

- [ ] **Step 2: Mark complete** (no commit needed if no changes)

---

### Task 10: Full build test

This task is for local verification before pushing.

- [ ] **Step 1: Validate all config files**

```bash
docker compose -f docker-compose.prod.yml config --quiet && echo "Compose: OK"
```

- [ ] **Step 2: Test Docker build**

```bash
docker build -f docker/Dockerfile -t niatbaik-test . 2>&1 | tail -5
```

Expected: build completes with `Successfully tagged niatbaik-test`.

- [ ] **Step 3: Verify image size**

```bash
docker images niatbaik-test --format "{{.Size}}"
```

Expected: under 200MB.

- [ ] **Step 4: Clean up test image**

```bash
docker rmi niatbaik-test
```

- [ ] **Step 5: Final commit — all files together if any missed**

```bash
git status
```

If any unstaged files remain, add and commit. Otherwise skip.
