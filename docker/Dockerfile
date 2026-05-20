# Stage 1: Composer dependencies
FROM composer:2 AS vendor

WORKDIR /app

COPY src/composer.json src/composer.lock ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-interaction

# Stage 2: Frontend build
FROM node:20-alpine AS frontend

WORKDIR /app

COPY src/package.json src/package-lock.json ./

RUN npm ci

COPY src/resources/ resources/
COPY src/vite.config.js src/postcss.config.js src/tailwind.config.js ./
COPY src/public/ public/

RUN npm run build

# Stage 3: Production runtime
FROM php:8.4-fpm-alpine AS runtime

# Install runtime system deps
RUN apk add --no-cache \
    icu-libs \
    libpng \
    libjpeg-turbo \
    libwebp \
    freetype \
    libzip \
    linux-headers

# Install build deps, compile PHP extensions, then remove build deps
RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        freetype-dev \
        libzip-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        bcmath \
        intl \
        opcache \
        gd \
        zip \
        exif \
        pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/*

# Copy PHP config
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/99-opcache.ini

WORKDIR /var/www/html

# Copy app source
COPY --chown=www-data:www-data src/ .

# Copy built vendor and frontend assets
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Ensure writable dirs exist with correct ownership
RUN mkdir -p \
        storage/logs \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
