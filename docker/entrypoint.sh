#!/bin/sh

# Use Railway's PORT or default to 8080
export PORT="${PORT:-8080}"

# Update Nginx to listen on the correct port
sed -i "s/listen 8080/listen $PORT/" /etc/nginx/http.d/default.conf

# Ensure hot file doesn't exist in production
rm -f /var/www/html/public/hot

# Run Laravel optimizations (non-fatal)
php artisan config:cache || echo "config:cache failed, continuing..."
php artisan route:cache || echo "route:cache failed, continuing..."
php artisan view:cache || echo "view:cache failed, continuing..."

# Run migrations (non-fatal)
php artisan migrate --force || echo "migrate failed, continuing..."

# Create storage link
php artisan storage:link || true

# Start supervisor (runs PHP-FPM + Nginx)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
