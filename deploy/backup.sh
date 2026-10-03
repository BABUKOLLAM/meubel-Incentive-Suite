#!/usr/bin/env bash
# Nightly Postgres dump into deploy/backups, keeping 30 days.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p deploy/backups
f="deploy/backups/incentive-$(date +%F).sql.gz"
docker compose exec -T db pg_dump -U incentive -d incentive | gzip > "$f"
find deploy/backups -name 'incentive-*.sql.gz' -mtime +30 -delete
echo "wrote $f"
