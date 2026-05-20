# Panduan Deploy NiatBaik di VPS (AAPanel)

## Kebutuhan

- VPS Ubuntu 22.04 / 24.04 LTS (minimal 1GB RAM, 1 vCPU)
- AAPanel sudah terinstal
- Domain sudah diarahkan ke IP VPS (A record)

---

## 1. Instal AAPanel

Jika AAPanel belum terinstal:

```bash
# Ubuntu / Debian
wget -O install.sh https://www.aapanel.com/script/install_7.0_en.sh && bash install.sh aapanel
```

Setelah instal, catat URL panel, username, dan password yang muncul di terminal.

---

## 2. Instal Software di AAPanel

Buka AAPanel di browser, lalu ke **App Store** → instal:

| Software       | Versi        | Catatan                    |
|----------------|--------------|----------------------------|
| Nginx          | 1.24+        | Pilih Compile Install      |
| PHP            | 8.3          | **Wajib 8.3+**             |
| MySQL          | 8.0          | atau 8.4                   |
| Redis          | 7.x          | untuk session/cache/queue  |
| phpMyAdmin     | 5.x          | opsional, untuk kelola DB  |

### Instal PHP Extensions

AAPanel → **App Store** → klik **Setting** di PHP 8.3 → tab **Extensions** → instal:

- `redis`
- `fileinfo`
- `opcache`
- `bcmath`
- `intl`
- `exif` (opsional, untuk gambar)

### Konfigurasi PHP

Di PHP 8.3 **Setting** → tab **Configuration**:

```
upload_max_filesize = 10M
post_max_size = 12M
max_execution_time = 300
memory_limit = 256M
```

### Disable Functions

Di PHP 8.3 **Setting** → tab **Disable Functions** → **hapus** fungsi-fungsi ini dari daftar disabled:

- `putenv`
- `proc_open`
- `pcntl_signal`
- `pcntl_alarm`
- `pcntl_async_signals`

Fungsi ini dibutuhkan Laravel untuk queue worker dan Artisan.

---

## 3. Buat Database

AAPanel → **Database** → **Add Database**:

| Field    | Nilai                    |
|----------|--------------------------|
| Name     | `niatbaik`               |
| Username | `niatbaik`               |
| Password | *(generate password kuat)* |
| Encoding | `utf8mb4`                |
| Access   | `Local`                  |

**Catat password-nya** — nanti dipakai di `.env`.

---

## 4. Buat Website di AAPanel

AAPanel → **Website** → **Add Site**:

| Field       | Nilai                                       |
|-------------|---------------------------------------------|
| Domain      | `niatbaik.com` (tambahkan `www.niatbaik.com`) |
| Root Dir    | `/www/wwwroot/niatbaik`                     |
| PHP Version | PHP-83                                      |
| Database    | *(sudah dibuat di step 3)*                  |

Setelah dibuat, klik **Settings** pada website → tab **Site Directory**:

- **Running directory**: ubah ke `/src/public`
- Centang **Anti-cross-site attack (open_basedir)**: **matikan** (bisa konflik dengan Laravel)

---

## 5. Clone Repository

SSH ke VPS:

```bash
cd /www/wwwroot/niatbaik

# Hapus file default AAPanel
rm -f .htaccess 404.html index.html .user.ini

# Clone repo (private — pakai SSH key atau personal access token)
git clone https://USERNAME:TOKEN@github.com/anrdart/niatbaik.git .
```

> **Tips SSH Key**: Kalau mau pakai SSH key, generate di VPS:
> ```bash
> ssh-keygen -t ed25519 -C "deploy@vps"
> cat ~/.ssh/id_ed25519.pub
> ```
> Tambahkan public key di GitHub → Settings → SSH Keys.
> Lalu clone pakai: `git clone git@github.com:anrdart/niatbaik.git .`

---

## 6. Instal Dependensi

```bash
cd /www/wwwroot/niatbaik/src

# Instal Composer (jika belum ada)
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Instal dependensi PHP
composer install --no-dev --optimize-autoloader

# Instal Node.js (jika belum ada)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instal & build frontend
npm ci
npm run build
```

---

## 7. Konfigurasi Environment

```bash
cd /www/wwwroot/niatbaik/src

# Copy file production
cp .env.production .env
```

Edit `.env` — yang **wajib diganti**:

```bash
nano .env
```

```env
# Generate key dulu (step 8), atau isi manual
APP_URL=https://niatbaik.com

# Sesuaikan dengan database di step 3
DB_DATABASE=niatbaik
DB_USERNAME=niatbaik
DB_PASSWORD=password_dari_step_3

# Mail — pakai Gmail App Password
# Buat di: https://myaccount.google.com/apppasswords
MAIL_USERNAME=emailkamu@gmail.com
MAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx
MAIL_FROM_ADDRESS=noreply@niatbaik.com
```

---

## 8. Inisialisasi Aplikasi

```bash
cd /www/wwwroot/niatbaik/src

# Generate app key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate --force

# Link storage (agar upload file bisa diakses publik)
php artisan storage:link

# Optimasi cache untuk production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## 9. Set Permission

```bash
cd /www/wwwroot/niatbaik/src

# Set owner ke www (user AAPanel)
chown -R www:www /www/wwwroot/niatbaik
chmod -R 755 /www/wwwroot/niatbaik
chmod -R 775 storage bootstrap/cache
```

---

## 10. Konfigurasi Nginx (AAPanel)

AAPanel → **Website** → klik nama site → **Settings** → tab **Nginx Conf**.

Ganti isi config dengan:

```nginx
server {
    listen 80;
    server_name niatbaik.com www.niatbaik.com;
    root /www/wwwroot/niatbaik/src/public;

    index index.php index.html;

    charset utf-8;
    client_max_body_size 10M;

    # Logging AAPanel
    access_log /www/wwwlogs/niatbaik.com.log;
    error_log /www/wwwlogs/niatbaik.com.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-83.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

> **Catatan**: Path socket PHP bisa berbeda tergantung versi AAPanel:
> - AAPanel lama: `/tmp/php-cgi-83.sock`
> - AAPanel baru: `/www/server/php/83/tmp/php-cgi.sock`
>
> Cek path aktif:
> ```bash
> ls /tmp/php-cgi-*.sock /www/server/php/83/tmp/php-cgi.sock 2>/dev/null
> ```

Klik **Save** lalu **Restart** Nginx di AAPanel.

---

## 11. SSL / HTTPS

AAPanel → **Website** → klik nama site → **Settings** → tab **SSL**:

1. Pilih **Let's Encrypt**
2. Pilih domain: `niatbaik.com` dan `www.niatbaik.com`
3. Klik **Apply** (pastikan domain sudah pointing ke IP VPS)
4. Centang **Force HTTPS**

---

## 12. Queue Worker (Supervisor)

### Opsi A: AAPanel Supervisor Plugin

AAPanel → **App Store** → cari **Supervisor Manager** → **Install**.

Setelah terinstal, buka Supervisor Manager → **Add Daemon**:

| Field          | Nilai                                                                    |
|----------------|--------------------------------------------------------------------------|
| Name           | `niatbaik-worker`                                                        |
| Run User       | `www`                                                                    |
| Run Dir        | `/www/wwwroot/niatbaik/src`                                              |
| Start Command  | `php /www/wwwroot/niatbaik/src/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600` |
| Processes      | `2`                                                                      |

### Opsi B: Supervisor Manual

Jika plugin tidak tersedia:

```bash
apt install -y supervisor
```

Buat file `/etc/supervisor/conf.d/niatbaik-worker.conf`:

```ini
[program:niatbaik-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /www/wwwroot/niatbaik/src/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www
numprocs=2
redirect_stderr=true
stdout_logfile=/www/wwwroot/niatbaik/src/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start niatbaik-worker:*
```

---

## 13. Cron Job (Task Scheduler)

AAPanel → **Cron** → **Add Cron**:

| Field     | Nilai                                                                    |
|-----------|--------------------------------------------------------------------------|
| Type      | Shell Script                                                             |
| Name      | `NiatBaik Scheduler`                                                     |
| Period    | Every 1 Minute                                                           |
| Script    | `cd /www/wwwroot/niatbaik/src && /www/server/php/83/bin/php artisan schedule:run >> /dev/null 2>&1` |

> **Catatan**: Path PHP bisa dicek dengan `which php` atau lihat di AAPanel → App Store → PHP 8.3 → Setting.

---

## 14. Buat Admin Pertama

```bash
cd /www/wwwroot/niatbaik/src
php artisan tinker
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

Setiap ada update kode baru:

```bash
cd /www/wwwroot/niatbaik/src

git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Restart queue worker
supervisorctl restart niatbaik-worker:*
```

Atau buat script `/www/wwwroot/niatbaik/deploy.sh`:

```bash
#!/bin/bash
set -e

cd /www/wwwroot/niatbaik/src

echo ">> Pulling latest code..."
git pull origin main

echo ">> Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo ">> Building frontend..."
npm ci && npm run build

echo ">> Running migrations..."
php artisan migrate --force

echo ">> Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo ">> Restarting queue worker..."
supervisorctl restart niatbaik-worker:*

echo ">> Deploy selesai!"
```

```bash
chmod +x /www/wwwroot/niatbaik/deploy.sh
```

Jalankan: `bash /www/wwwroot/niatbaik/deploy.sh`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| 500 error | Cek `storage/logs/laravel.log` — biasanya permission atau `.env` salah |
| Halaman blank | `php artisan config:clear && php artisan cache:clear` |
| CSS/JS tidak muncul | Pastikan `npm run build` sudah jalan, cek ada `public/build/manifest.json` |
| "open_basedir restriction" | Matikan di AAPanel → Website → Settings → Site Directory → uncheck open_basedir |
| Queue tidak jalan | Cek Supervisor Manager status, cek `storage/logs/worker.log` |
| Redis error | AAPanel → App Store → Redis → cek status Running |
| Upload gagal | Cek `client_max_body_size` di Nginx conf, cek `upload_max_filesize` di PHP settings |
| "putenv() disabled" | AAPanel → PHP Settings → Disable Functions → hapus `putenv` dari daftar |
| Permission denied | `chown -R www:www /www/wwwroot/niatbaik && chmod -R 775 src/storage src/bootstrap/cache` |
| PHP socket not found | Cek path: `ls /tmp/php-cgi-*.sock /www/server/php/83/tmp/php-cgi.sock 2>/dev/null` |
| Artisan command error | Pastikan PHP CLI pakai versi 8.3: `/www/server/php/83/bin/php artisan ...` |

---

## Struktur Direktori di VPS

```
/www/wwwroot/niatbaik/          ← root project (AAPanel site dir)
├── src/                        ← Laravel app
│   ├── public/                 ← document root (running directory)
│   │   ├── build/              ← Vite compiled assets
│   │   ├── storage → ../storage/app/public
│   │   └── index.php           ← entry point
│   ├── storage/
│   │   ├── app/public/         ← uploaded files
│   │   ├── logs/               ← laravel.log, worker.log
│   │   └── framework/          ← cache, sessions, views
│   ├── .env                    ← konfigurasi aktif
│   ├── .env.production         ← template production
│   └── artisan                 ← CLI Laravel
├── deploy.sh                   ← script deploy otomatis
└── panduan.md                  ← file ini
```
