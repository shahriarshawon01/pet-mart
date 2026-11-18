# Build targets:
#   app      Laravel API + admin panel (php-fpm + nginx + queue worker + scheduler)   [default]
#   pet-web  PetMart customer site (React SPA served by nginx)
#
#   docker compose build            builds both (see docker-compose.yml)
#   docker build --target pet-web --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 .

# ----------------------------------
# Stage: admin panel assets (Laravel Mix, Vue 2)
# ----------------------------------
FROM node:20-alpine AS admin-assets
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run prod

# ----------------------------------
# Stage: customer site build (React + Vite)
# ----------------------------------
FROM node:20-alpine AS pet-web-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Baked into the JS bundle at build time. Set it to the public API URL of each environment.
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ----------------------------------
# Target: pet-web (static SPA)
# ----------------------------------
FROM nginx:1.27-alpine AS pet-web
COPY docker/pet-web.conf /etc/nginx/conf.d/default.conf
COPY --from=pet-web-build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# ----------------------------------
# Stage: PHP dependencies (production only)
# ----------------------------------
FROM composer:2.7 AS composer-builder
WORKDIR /app

# gd is required by the app (image processing); installed here so composer's platform check passes
RUN apk add --no-cache freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd exif

COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-progress

# ----------------------------------
# Target: app (default, must stay the last stage)
# ----------------------------------
FROM php:8.3-fpm-alpine AS app

RUN set -eux; \
  apk add --no-cache \
    nginx bash supervisor curl shadow netcat-openbsd mysql-client \
    icu-libs libzip libpng oniguruma libxml2 freetype libjpeg-turbo libwebp; \
  apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS linux-headers \
    icu-dev libzip-dev libpng-dev oniguruma-dev libxml2-dev \
    freetype-dev libjpeg-turbo-dev libwebp-dev; \
  docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
  docker-php-ext-install \
    intl pdo pdo_mysql mysqli mbstring zip xml opcache bcmath gd exif; \
  apk del .build-deps; \
  php -r 'exit(function_exists("imagewebp") && function_exists("exif_read_data") ? 0 : 1);'

WORKDIR /var/www/html
COPY . .

COPY --from=admin-assets /app/public/js /var/www/html/public/js
COPY --from=admin-assets /app/public/css /var/www/html/public/css
COPY --from=admin-assets /app/public/mix-manifest.json /var/www/html/public/mix-manifest.json
COPY --from=composer-builder /app/vendor /var/www/html/vendor

# Clear stale bootstrap cache and re-discover production-only packages
RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php bootstrap/cache/routes-*.php \
    && php artisan package:discover --ansi

RUN set -eux; \
  mkdir -p storage/app/public storage/framework/views storage/framework/cache/data storage/framework/sessions storage/logs bootstrap/cache; \
  rm -rf public/storage; \
  php artisan storage:link; \
  chown -R 33:33 storage bootstrap; \
  chmod -R 775 storage bootstrap/cache; \
  \
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled; \
  rm -f /etc/nginx/conf.d/default.conf /etc/nginx/http.d/default.conf || true; \
  \
  mkdir -p /var/lib/nginx/logs /var/lib/nginx/tmp/client_body; \
  touch /var/lib/nginx/logs/error.log; \
  chown 33:33 /var/lib/nginx/logs/error.log; \
  mkdir -p /var/cache/nginx /var/run /run; \
  \
  mkdir -p /tmp/nginx/client_body /tmp/nginx/proxy /tmp/nginx/fastcgi /tmp/nginx/uwsgi /tmp/nginx/scgi; \
  \
  chown -R 33:33 \
    /var/lib/nginx /var/cache/nginx /var/run /run /tmp/nginx /etc/nginx

RUN { \
    echo "upload_max_filesize = 200M"; \
    echo "post_max_size = 200M"; \
    echo "memory_limit = 512M"; \
    echo "max_execution_time = 300"; \
    echo "max_input_time = 300"; \
  } > /usr/local/etc/php/conf.d/99-uploads.ini

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/sites-available/default.conf
RUN ln -sf /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf

COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# uid 33 has no home directory; tinker, composer and other CLI tools need a writable HOME
ENV HOME=/tmp

USER 33:33

EXPOSE 8080
CMD ["/usr/local/bin/startup.sh"]
