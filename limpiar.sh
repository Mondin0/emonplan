#!/bin/sh
set -eu
cd "$(dirname "$0")"
printf 'Esto borrará todos los datos y credenciales de EmonPlan. Escribí BORRAR para continuar: '
read -r confirmation || exit 1
if [ "$confirmation" != BORRAR ]; then
  echo 'Limpieza cancelada.'
  exit 0
fi
POSTGRES_PASSWORD=unused OWNER_EMAIL=unused OWNER_PASSWORD=unused \
  docker compose -p emonplan -f compose.yaml down --volumes --rmi local --remove-orphans
rm -f .env
echo 'Instalación local de EmonPlan eliminada.'
