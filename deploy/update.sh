#!/usr/bin/env bash
# Update the running board to the latest code on GitHub. Run on the VPS from the install folder (default
# /opt/incentive), by hand or by the GitHub "deploy" workflow over SSH. It pulls, rebuilds and waits for health; the
# server does the rest: the first start of a new build announces it to every phone that switched update notifications
# on, and open boards show "A new version of the board is ready".
set -euo pipefail
cd "${1:-${INCENTIVE_DIR:-/opt/incentive}}"
before=$(git -c safe.directory="$PWD" rev-parse --short HEAD)
git -c safe.directory="$PWD" pull --ff-only
after=$(git -c safe.directory="$PWD" rev-parse --short HEAD)
echo "code: $before -> $after"
grep -q '^DB_APP_PASSWORD=.\+' .env || { sed -i '/^DB_APP_PASSWORD=/d' .env; echo "DB_APP_PASSWORD=$(openssl rand -hex 24)" >> .env; echo "added DB_APP_PASSWORD to .env"; }
chown -R 1000:1000 data 2>/dev/null || true
docker compose up -d --build
for i in $(seq 1 60); do docker compose exec -T app wget -qO- http://localhost:8080/api/health >/dev/null 2>&1 && break; sleep 2; done
docker compose exec -T app wget -qO- http://localhost:8080/api/version || { echo "the board did not come back: docker compose logs app"; exit 1; }
echo
docker image prune -f >/dev/null 2>&1 || true
echo "updated to $after"
