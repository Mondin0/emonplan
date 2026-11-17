#!/bin/sh
set -eu
cd "$(dirname "$0")"
sh scripts/setup.sh
docker compose -p emonplan -f compose.yaml up -d --build
docker compose -p emonplan -f compose.yaml ps
echo 'Abrí http://localhost:8080 (o el puerto configurado en .env). Las credenciales están en .env.'
