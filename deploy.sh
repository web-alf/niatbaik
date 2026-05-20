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
supervisorctl restart niatbaik-worker:* || echo "!! Supervisor not running, skip restart"

echo ">> Deploy selesai!"
