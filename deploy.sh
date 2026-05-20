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
