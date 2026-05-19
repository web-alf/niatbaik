# Panduan Instalasi NiatBaik di VPS

## Kebutuhan Server

- Ubuntu 22.04 / 24.04 LTS
- PHP 8.3+
- MySQL 8.0+
- Redis
- Nginx
- Node.js 20+ & NPM
- Composer 2
- Git
- Supervisor (untuk queue worker)
- Certbot (untuk SSL)

---

## 1. Instalasi Dependensi Server

```bash
sudo apt update && sudo apt upgrade -y

# PHP 8.3 + ekstensi
sudo add-apt-repository ppa:ondrej/php -y
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-redis \
    php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \
    php8.3-gd php8.3-intl php8.3-readline

# MySQL
sudo apt install -y mysql-server

# Redis
sudo apt install -y redis-server

# Nginx
sudo apt install -y nginx

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Supervisor
sudo apt install -y supervisor

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## 2. Setup Database

```bash
sudo mysql -u root <<SQL
CREATE DATABASE niatbaik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'niatbaik'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON niatbaik.* TO 'niatbaik'@'localhost';
FLUSH PRIVILEGES;
SQL
```

---

## 3. Clone & Setup Aplikasi

```bash
cd /var/www
sudo git clone https://github.com/anrdart/niatbaik.git
sudo chown -R www-data:www-data /var/www/niatbaik
cd /var/www/niatbaik/src

# Install dependensi PHP
composer install --no-dev --optimize-autoloader

# Install & build frontend
npm ci
npm run build

# Copy environment
cp .env.example .env
```

---

## 4. Konfigurasi Environment

Edit `/var/www/niatbaik/src/.env`:

```env
APP_NAME=NiatBaik
APP_ENV=production
APP_DEBUG=false
APP_URL=https://niatbaik.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=niatbaik
DB_USERNAME=niatbaik
DB_PASSWORD=GANTI_PASSWORD_KUAT

SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email@niatbaik.com
MAIL_PASSWORD=app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@niatbaik.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 5. Inisialisasi Aplikasi

```bash
cd /var/www/niatbaik/src

# Generate app key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate --force

# Optimasi untuk production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Link storage
php artisan storage:link

# Set permission
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 6. Konfigurasi Nginx

Buat file `/etc/nginx/sites-available/niatbaik`:

```nginx
server {
    listen 80;
    server_name niatbaik.com www.niatbaik.com;
    root /var/www/niatbaik/src/public;

    index index.php;

    charset utf-8;
    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan site:

```bash
sudo ln -s /etc/nginx/sites-available/niatbaik /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL (HTTPS)

```bash
sudo certbot --nginx -d niatbaik.com -d www.niatbaik.com
```

Certbot otomatis mengatur auto-renewal.

---

## 8. Queue Worker (Supervisor)

Buat file `/etc/supervisor/conf.d/niatbaik-worker.conf`:

```ini
[program:niatbaik-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/niatbaik/src/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/niatbaik/src/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start niatbaik-worker:*
```

---

## 9. Cron Job (Task Scheduler)

```bash
sudo crontab -u www-data -e
```

Tambahkan:

```
* * * * * cd /var/www/niatbaik/src && php artisan schedule:run >> /dev/null 2>&1
```

---

## 10. Buat Admin Pertama

```bash
cd /var/www/niatbaik/src
php artisan tinker
```

```php
$user = \App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@niatbaik.com',
    'password' => bcrypt('password_admin_kuat'),
    'role' => 'admin',
    'email_verified_at' => now(),
]);
```

Akses admin panel di `https://niatbaik.com/master`.

---

## Deploy Update

Setiap kali ada update kode:

```bash
cd /var/www/niatbaik/src

git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

sudo supervisorctl restart niatbaik-worker:*
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| 500 error | Cek `storage/logs/laravel.log`, pastikan permission `storage/` dan `bootstrap/cache/` |
| Halaman blank | `php artisan config:clear && php artisan cache:clear` |
| CSS/JS tidak muncul | Pastikan `npm run build` sudah jalan, cek `public/build/manifest.json` ada |
| Queue tidak jalan | `sudo supervisorctl status`, cek log di `storage/logs/worker.log` |
| Redis error | `sudo systemctl status redis`, pastikan redis running |
| Upload gagal | Cek `client_max_body_size` di Nginx, cek `upload_max_filesize` di php.ini |
