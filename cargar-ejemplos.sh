#!/bin/sh
set -eu
cd "$(dirname "$0")"
docker compose -p emonplan -f compose.yaml exec -T db \
  psql -v ON_ERROR_STOP=1 -U emonplan -d emonplan < scripts/ejemplos.sql
echo 'Datos de ejemplo cargados o ya existentes.'
