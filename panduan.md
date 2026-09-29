# Panduan NIATBAIK.ORG — Arsitektur & Deploy

Platform donasi online. Produksi: `https://donasi.niatbaik.org`. Kode di VPS: `/www/wwwroot/niatbaik`.

---

## 1. Gambaran Proyek

### Stack

| Lapisan | Teknologi |
|---|---|
| Backend API | Go 1.22, Echo v4, GORM |
| Database | PostgreSQL 16 (container `postgres`) |
| Frontend | React 18 + TypeScript + Vite + Tailwind + zustand |
| Server frontend | Bun (`frontend/server.js`) — serve `dist/` + SPA fallback + inject GTM |
| Reverse proxy | Nginx (`docker/nginx/prod.conf`), port 80. TLS di Cloudflare |
| Orkestrasi | Docker Compose (`docker-compose.prod.yml`, `docker-compose.dev.yml`) |

Tidak ada Redis, queue worker, PHP, atau MySQL. Semua state di Postgres + volume upload.

### Alur request

```
Browser → Cloudflare (TLS) → nginx:80
  /api/*        → api:8080   (Go)
  /api/webhooks → api:8080   (tanpa rate limit, tanpa CSRF)
  /uploads/*    → api:8080   (file upload, Cache-Control immutable)
  /             → frontend:3000 (Bun, index.html + GTM)
  /assets/*     → frontend:3000 (JS/CSS hash, cache 1 tahun)
```

### Struktur repo

```
niatbaik/
├── backend/                 Go API
│   ├── cmd/server/main.go   entry point: load config → migrate → seed → router
│   ├── internal/
│   │   ├── config/          env → struct. Validate() tolak secret lemah di production
│   │   ├── database/        postgres.go (koneksi), migrate.go (AutoMigrate), seed.go
│   │   ├── model/           tabel GORM: user, campaign, donation, invoice, article, setting, …
│   │   ├── repository/      query DB
│   │   ├── service/         logika bisnis: payment, moota, flip, xendit, ipaymu, duitku, mailer, tracking
│   │   ├── handler/         HTTP handler per domain
│   │   ├── middleware/      jwt, role, ratelimit, cors, security, revision
│   │   ├── dto/             request/response struct + validasi
│   │   └── router/router.go semua route + grup role
│   ├── pkg/                 util: hash, jwt, mailer, upload, slug, pagination, realtime
│   ├── Dockerfile           multi-stage, binary statis
│   └── Makefile             dev / build / test / test-docker
├── frontend/
│   ├── src/
│   │   ├── router.tsx       semua route + guard RequireRole
│   │   ├── pages/public/    landing, campaign detail, berita, invoice
│   │   ├── pages/admin/     dashboard, campaigns, articles, members, settings, …
│   │   ├── pages/auth/      login, register, reset
│   │   ├── lib/nav.ts       menu sidebar per role + ROLE_META
│   │   ├── store/           zustand
│   │   └── types/api.ts     tipe API + Role
│   ├── public/              robots.txt, llms.txt, trust/
│   ├── server.js            Bun static server
│   └── Dockerfile
├── docker/nginx/prod.conf   vhost produksi
├── docker-compose.prod.yml  api, frontend, postgres, nginx
├── docker-compose.dev.yml   dev dengan hot reload
├── deploy.sh                deploy penuh (down → build → up). Jarang dipakai
├── redeploy.sh              deploy update. PAKAI INI
├── dev.sh                   helper dev lokal
└── panduan.md               file ini
```

### Role & hak akses

| Role | Akses |
|---|---|
| `admin` | Semua. Users, settings, gateway, withdrawal, trash |
| `cs` | Campaign, kategori, artikel, invoice (ubah status/note), fundraiser |
| `advertiser` | Campaign (pixel/tracking), invoice read-only, analytics, data studio |
| `writer` | Artikel/berita saja |
| `fundraiser` | Dashboard sendiri, campaign miliknya, earnings, withdrawal |
| `user` | Donatur biasa (login opsional) |

Grup middleware di `router.go`: `RequireAdmin`, `RequireCS` (admin+cs), `RequireStaff` (admin+cs+advertiser), `RequireEditorial` (admin+cs+writer), `RequireAdvertiser` (admin+advertiser). Frontend cermin di `router.tsx` + `nav.ts`. Kolom `users.role` adalah string — tambah role baru tidak perlu migrasi.

### Database

- Skema dibuat oleh `AutoMigrate` saat API start. Tidak ada file migrasi manual. Non-destruktif: tambah kolom/tabel, tidak pernah drop data.
- Seed idempoten. Admin pertama dibuat hanya jika belum ada user admin, dan di production hanya jika `SEED_ADMIN_PASSWORD` di-set. Akun demo CS/advertiser dilewati di production.
- Setting gateway (Moota, Flip, Xendit, iPaymu, Duitku, SMTP, Cekat AI, pixel) disimpan di tabel `settings`, diedit via halaman Settings. Env hanya untuk secret bootstrap.

### Pembayaran

Donasi → invoice → gateway (dipilih di Settings) → webhook `POST /api/webhooks/<gateway>` → tabel `processed_webhooks` (idempoten) → invoice paid → notifikasi + tracking pixel (GA/FB/TikTok server-side).

---

## 2. Setup VPS Pertama Kali

### Kebutuhan

- Ubuntu 22.04/24.04, min 1 GB RAM (2 GB disarankan; build Vite butuh memori)
- Domain di Cloudflare, proxied, SSL mode **Full**
- DNS: `A  donasi  <IP VPS>  Proxied`

### Instal Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker compose version
```

### Clone

```bash
mkdir -p /www/wwwroot && cd /www/wwwroot
git clone git@github.com:web-alf/niatbaik.git niatbaik
cd niatbaik
```

SSH key: `ssh-keygen -t ed25519 -C deploy@vps`, tambah `~/.ssh/id_ed25519.pub` ke GitHub → Settings → SSH keys.

### Environment

File: `.env.production` di root repo (gitignored, dibaca oleh service `api` dan `postgres`).

```bash
cp backend/.env.example .env.production
nano .env.production
```

Wajib diisi:

```env
APP_ENV=production
APP_PORT=8080

DB_HOST=postgres
DB_PORT=5432
DB_USER=niatbaik
DB_NAME=niatbaik
DB_PASSWORD=<acak, kuat>          # juga dipakai POSTGRES_PASSWORD
POSTGRES_PASSWORD=<sama dengan DB_PASSWORD>
DB_SSLMODE=disable                 # Postgres internal Docker, tanpa TLS

JWT_SECRET=<acak, ≥32 karakter>   # openssl rand -hex 32
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h

UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760

CORS_ORIGINS=https://donasi.niatbaik.org
FRONTEND_BASE_URL=https://donasi.niatbaik.org

SEED_ADMIN_PASSWORD=<password admin pertama>   # hapus setelah admin dibuat
```

Opsional (bisa juga diisi lewat halaman Settings): `MOOTA_API_KEY`, `MOOTA_WEBHOOK_SECRET`, `FLIP_SECRET_KEY`, `FLIP_VALIDATION_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_DATA_MANAGER_REFRESH_TOKEN`.

API **menolak start** di production jika `JWT_SECRET` default/<32 char atau `DB_PASSWORD=secret`.

### Jalankan

```bash
./deploy.sh prod main
```

Script: cek secret → fetch + hard reset ke `origin/main` → `down` → `build` → up postgres → tunggu ready → `up -d` semua → health check `/api/health`.

Cek:

```bash
docker compose -f docker-compose.prod.yml ps        # semua healthy
docker compose -f docker-compose.prod.yml logs --tail=30 api
```

Log API harus memuat `Database migrations completed`. Akses `https://donasi.niatbaik.org`, login `admin@niatbaik.org` + `SEED_ADMIN_PASSWORD`. Setelah login, hapus `SEED_ADMIN_PASSWORD` dari `.env.production`.

---

## 3. Deploy Update (rutin)

### Di laptop

```bash
cd frontend && npx tsc --noEmit -p tsconfig.json && cd ..   # type check
cd backend && go build ./... && go vet ./... && cd ..        # atau make test-docker
git add -A && git commit -m "..." && git push origin main
```

### Di VPS

```bash
cd /www/wwwroot/niatbaik
./redeploy.sh main
```

`redeploy.sh`:
1. Pastikan `DB_SSLMODE=disable` (hanya jika `DB_HOST=postgres`)
2. `git fetch` + `checkout -B main origin/main` + `reset --hard` — **tidak perlu `git pull` manual**
3. `docker compose build api frontend`
4. `up -d --force-recreate --no-deps nginx api frontend` — postgres **tidak disentuh**
5. Health check `/api/health` + cek `/uploads/` tidak balas HTML

Data aman karena:
- DB di volume `niatbaik_postgres-data`, tidak pernah `down -v`
- Upload di volume `niatbaik_api-uploads`, mount ke `/app/uploads` di api
- `.env.production` gitignored, dibackup ke `.env.production.predeploy.bak` sebelum reset
- Migrasi `AutoMigrate` hanya tambah, tidak drop

Kapan pakai `deploy.sh` (bukan `redeploy.sh`): perubahan di `docker-compose.prod.yml` (service/volume/port baru) atau image postgres.

---

## 4. Backup

```bash
cd /www/wwwroot/niatbaik
DC="docker compose -f docker-compose.prod.yml"
mkdir -p /root/backups
D=$(date +%F)

# Database
$DC exec -T postgres pg_dump -U niatbaik niatbaik | gzip > /root/backups/db-$D.sql.gz

# Upload gambar
docker run --rm -v niatbaik_api-uploads:/u:ro -v /root/backups:/b alpine \
  tar czf /b/uploads-$D.tgz -C /u .

# Env
cp .env.production /root/backups/env-$D
```

Restore DB:

```bash
gunzip -c /root/backups/db-YYYY-MM-DD.sql.gz | $DC exec -T postgres psql -U niatbaik niatbaik
```

Restore upload:

```bash
docker run --rm -v niatbaik_api-uploads:/u -v /root/backups:/b alpine \
  sh -c 'cd /u && tar xzf /b/uploads-YYYY-MM-DD.tgz'
```

Cron harian (`crontab -e`):

```
0 3 * * * cd /www/wwwroot/niatbaik && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U niatbaik niatbaik | gzip > /root/backups/db-$(date +\%F).sql.gz
```

---

## 5. Perintah Berguna

`DC="docker compose -f docker-compose.prod.yml"`

| Perintah | Fungsi |
|---|---|
| `$DC ps` | Status container |
| `$DC logs -f api` | Log API realtime |
| `$DC logs --tail=50 nginx` | Log nginx |
| `$DC exec postgres psql -U niatbaik` | Shell Postgres |
| `$DC exec api sh` | Shell container API |
| `$DC restart api` | Restart API (tanpa rebuild) |
| `$DC up -d --force-recreate nginx` | Reload nginx conf |
| `$DC build --no-cache api frontend` | Rebuild tanpa cache |
| `docker system prune -a` | Bersihkan image lama (disk penuh) |
| `curl -s localhost/api/health` | Cek API via nginx |

Ubah role user langsung di DB:

```sql
UPDATE users SET role='writer' WHERE email='x@y.z';
```

---

## 6. Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| API tidak start, log `JWT_SECRET must be…` | Secret lemah di `.env.production`. Ganti, `$DC up -d api` |
| API `sslmode` / `SSL is not enabled` | Tambah `DB_SSLMODE=disable` di `.env.production` |
| `password authentication failed` | `DB_PASSWORD` ≠ `POSTGRES_PASSWORD`, atau password diubah setelah volume dibuat. Samakan; jika volume baru, hapus volume atau `ALTER USER` |
| 502 di semua path | `$DC ps` — api/frontend belum healthy. `$DC logs api` |
| Gambar upload 404 / balas HTML | nginx pakai conf lama. `$DC up -d --force-recreate nginx` |
| nginx `unhealthy` padahal situs jalan | Inode bind-mount conf basi. Sama: force-recreate nginx |
| Perubahan frontend tidak muncul | Cache browser / Cloudflare. Purge cache Cloudflare; `$DC build frontend && $DC up -d frontend` |
| Build frontend OOM (`Killed`) | RAM kurang. Tambah swap: `fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile` |
| Webhook gateway tidak masuk | Cek URL webhook di dashboard gateway = `https://donasi.niatbaik.org/api/webhooks/<gateway>`. Lihat `$DC logs api \| grep webhook` |
| Email tidak terkirim | SMTP di Settings → tombol Test Email. Gmail butuh App Password |
| `git diff` "terminal is not fully functional" | `export TERM=xterm` atau `git --no-pager diff` |
| Login admin lupa password | Pakai Lupa Password (butuh SMTP aktif). Tanpa SMTP: `UPDATE users SET role='user' WHERE role='admin'`, set `SEED_ADMIN_PASSWORD`, `$DC restart api` → seed buat admin baru; lalu kembalikan role lama |

---

## 7. Dev Lokal

```bash
./dev.sh            # up: api :8080, frontend :3000 (hot reload), postgres :5432
./dev.sh logs:api
./dev.sh db         # psql
./dev.sh db:reset   # hapus data dev
./dev.sh clean      # hapus volume dev
```

Akun dev (seed, hanya `APP_ENV≠production`): `admin@niatbaik.org` / `admin123`, plus demo CS/advertiser.

Tanpa Docker: `cd backend && make dev` (butuh Postgres lokal + `.env`), `cd frontend && npm run dev`.

---

## 8. Docker Volumes

| Volume | Isi | Hilang jika |
|---|---|---|
| `niatbaik_postgres-data` | Seluruh database | `docker compose down -v` atau `docker volume rm` — **jangan** |
| `niatbaik_api-uploads` | Gambar campaign, artikel, logo | sama |

`redeploy.sh` dan `deploy.sh` tidak pernah menghapus volume.
