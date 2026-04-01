#!/bin/sh
set -e

# Use Railway's PORT or default to 8080
export PORT="${PORT:-8080}"

# Update Nginx to listen on the correct port
sed -i "s/listen 8080/listen $PORT/" /etc/nginx/http.d/default.conf

# Ensure hot file doesn't exist in production
rm -f /var/www/html/public/hot

# Run Laravel optimizations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Create storage link
php artisan storage:link || true

# Start supervisor (runs PHP-FPM + Nginx)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
