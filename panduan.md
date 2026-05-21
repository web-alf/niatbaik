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

docker compose --env-file src/.env -f docker-compose.prod.yml build
docker compose --env-file src/.env -f docker-compose.prod.yml up -d
```

Cek status:

```bash
docker compose --env-file src/.env -f docker-compose.prod.yml ps
```

Semua container harus `running` dan `healthy`.

---

## 6. Inisialisasi Aplikasi

```bash
DC="docker compose --env-file src/.env -f docker-compose.prod.yml"

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
| A | `donasi` | IP VPS | Proxied (orange) |

3. **SSL/TLS** → pilih mode **Full**
4. Akses `https://donasi.niatbaik.org` — harus sudah jalan

---

## 8. Buat Admin Pertama

```bash
DC="docker compose --env-file src/.env -f docker-compose.prod.yml"
$DC exec app php artisan tinker
```

```php
$user = \App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@niatbaik.org',
    'password' => bcrypt('#MakinBaik2030'),
    'role' => 'admin',
    'email_verified_at' => now(),
]);
```

Akses admin panel di `https://donasi.niatbaik.org/dashboard/manage`.

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
DC="docker compose --env-file src/.env -f docker-compose.prod.yml"

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
DC="docker compose --env-file src/.env -f docker-compose.prod.yml"
$DC exec mysql mysqldump -u root -p"$DB_PASSWORD" niatbaik > backup.sql
```
