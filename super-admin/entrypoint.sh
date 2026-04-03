#!/bin/bash

export PORT="${PORT:-8080}"

echo "=== Starting super-admin ==="
echo "PORT=$PORT"
echo "APP_ENV=${APP_ENV:-not set}"
echo "APP_KEY is $([ -n "$APP_KEY" ] && echo 'set' || echo 'NOT SET')"
echo "DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo 'set' || echo 'NOT SET')"

# Laravel setup (non-fatal)
php artisan config:clear || echo "config:clear failed"
php artisan route:clear || echo "route:clear failed"
php artisan view:clear || echo "view:clear failed"
php artisan migrate --force || echo "migrate failed"
php artisan db:seed --class=PlanSeeder --force || true
php artisan db:seed --class=TemplateSeeder --force || true
php artisan db:seed --class=PermissionSeeder --force || true
php artisan db:seed --class=SuperAdminSeeder --force || true
php artisan storage:link || true

echo "=== Starting server on port $PORT ==="

# exec keeps the process as PID 1 so the container stays alive
exec php artisan serve --host=0.0.0.0 --port="$PORT"
