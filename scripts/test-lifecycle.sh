#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/scripts" "$tmp/bin"
cp "$root/levantar.sh" "$root/limpiar.sh" "$root/cargar-ejemplos.sh" "$tmp/"
cp "$root/scripts/setup.sh" "$tmp/scripts/"
cp "$root/scripts/ejemplos.sql" "$tmp/scripts/"
cat > "$tmp/bin/docker" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" >> "$TEST_LOG"
exit "${DOCKER_EXIT:-0}"
EOF
chmod +x "$tmp/bin/docker"
export PATH="$tmp/bin:$PATH" TEST_LOG="$tmp/docker.log"
printf 'existing\n' > "$tmp/.env"
(cd / && sh "$tmp/levantar.sh")
grep -q 'up -d --build' "$TEST_LOG"
(cd / && sh "$tmp/cargar-ejemplos.sh")
grep -q 'exec -T db psql -v ON_ERROR_STOP=1 -U emonplan -d emonplan' "$TEST_LOG"
if DOCKER_EXIT=1 sh "$tmp/cargar-ejemplos.sh"; then exit 1; fi
printf 'no\n' | sh "$tmp/limpiar.sh"
test -f "$tmp/.env"
if printf 'BORRAR\n' | DOCKER_EXIT=1 sh "$tmp/limpiar.sh"; then exit 1; fi
test -f "$tmp/.env"
printf 'BORRAR\n' | sh "$tmp/limpiar.sh"
test ! -e "$tmp/.env"
grep -q 'down --volumes --rmi local --remove-orphans' "$TEST_LOG"
