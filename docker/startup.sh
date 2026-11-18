#!/bin/sh
# Container entrypoint for the `app` image.
#
# Configuration comes only from the container environment (docker compose env_file: .env.docker).
# No .env file is written and there are no fallback passwords: a missing value stops the container.
#
# Seeding is deliberately NOT done here. ModuleSeeder truncates modules, permissions and
# role permissions, so seeding on every start would wipe the admin panel's role settings.
# Seed once, by hand, on a fresh database:
#   docker compose exec app php artisan db:seed --force
set -eu

cd /var/www/html

require() {
  eval "value=\${$1:-}"
  if [ -z "$value" ]; then
    echo "ERROR: $1 is not set. Copy .env.docker.example to .env.docker and fill it in." >&2
    exit 1
  fi
}

for var in APP_KEY APP_URL DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD; do
  require "$var"
done

DB_PORT="${DB_PORT:-3306}"
echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
tries=0
until nc -z -w5 "$DB_HOST" "$DB_PORT"; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "ERROR: MySQL did not become reachable." >&2
    exit 1
  fi
  sleep 3
done

# With more than one app container, set RUN_MIGRATIONS=false and run migrations once per release:
#   docker compose run --rm app php artisan migrate --force
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running migrations..."
  php artisan migrate --force
fi

echo "Caching config, routes and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting supervisor (php-fpm, nginx, queue worker, scheduler)..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
