FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    libzip-dev zip unzip libicu-dev libonig-dev \
    libpq-dev libcurl4-openssl-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip intl curl xml \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application (includes pre-built frontend assets)
COPY . .

# Finish composer
RUN composer dump-autoload --optimize \
    && composer run-script post-autoload-dump || true

# Create necessary directories
RUN mkdir -p storage/framework/{sessions,views,cache} \
    && mkdir -p storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE ${PORT:-8080}

CMD php artisan config:clear; \
    php artisan route:clear; \
    php artisan view:clear; \
    php artisan storage:link || true; \
    php artisan migrate --force; \
    php artisan db:seed --class=PlanSeeder --force || true; \
    php artisan db:seed --class=TemplateSeeder --force || true; \
    php artisan db:seed --class=PermissionSeeder --force || true; \
    php artisan db:seed --class=SuperAdminSeeder --force || true; \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
