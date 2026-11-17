#!/bin/sh
set -eu
if [ -e .env ]; then
  echo '.env already exists; keeping existing credentials.'
  exit 0
fi
umask 077
db_password=$(openssl rand -hex 24)
owner_password=$(openssl rand -hex 20)
cat > .env <<EOF
POSTGRES_PASSWORD=$db_password
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=$owner_password
PORT=8080
EOF
echo 'Created .env with random credentials. Read OWNER_EMAIL and OWNER_PASSWORD there to log in.'
