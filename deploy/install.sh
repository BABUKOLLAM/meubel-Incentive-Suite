#!/usr/bin/env bash
# One-command install on a fresh Ubuntu 22.04 / 24.04 VPS, as root:
#   curl -fsSL https://raw.githubusercontent.com/BABUKOLLAM/meubel-Incentive-Suite/main/deploy/install.sh | bash -s -- incentive.meubelgrande.com tech@bpropms.com
# Arguments: the domain (its DNS A record must already point at this server) and an email for the certificate.
# Installs Docker and the firewall, clones the code to /opt/incentive, writes .env with fresh secrets, loads the
# first administrators, and starts the stack in dry-run mode. Re-running it updates the code and keeps .env.
set -euo pipefail

DOMAIN="${1:-}"; ACME="${2:-}"
REPO="${REPO:-https://github.com/BABUKOLLAM/meubel-Incentive-Suite.git}"
DIR="${DIR:-/opt/incentive}"
if [ -z "$DOMAIN" ] || [ -z "$ACME" ]; then echo "usage: install.sh <domain> <email for the certificate>"; exit 2; fi
if [ "$(id -u)" != "0" ]; then echo "run as root (sudo -i)"; exit 2; fi

echo "== 1/6 checking that $DOMAIN points here"
MYIP="$(curl -fsS https://api.ipify.org || true)"
DNSIP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
if [ -n "$MYIP" ] && [ "$MYIP" != "$DNSIP" ]; then
  echo "   warning: $DOMAIN resolves to '${DNSIP:-nothing}', this server is $MYIP."
  echo "   The certificate will fail until the A record points here. Continuing; Caddy retries on its own."
fi

echo "== 2/6 packages, Docker and firewall"
apt-get update -qq && apt-get install -y -qq ca-certificates curl git ufw >/dev/null
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
ufw allow OpenSSH >/dev/null && ufw allow 80 >/dev/null && ufw allow 443 >/dev/null && ufw --force enable >/dev/null

echo "== 3/6 code in $DIR"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone --depth 1 "$REPO" "$DIR"; fi
cd "$DIR"
mkdir -p data/inbox deploy/backups

echo "== 4/6 settings"
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|; s|^ACME_EMAIL=.*|ACME_EMAIL=$ACME|" .env
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|; s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 32)|" .env
  chmod 600 .env
  echo "   wrote .env (secrets generated). Add a sign-in provider next: nano $DIR/.env"
else
  echo "   .env exists, left as it is"
fi

echo "== 5/6 starting (dry run: messages are logged, not sent)"
docker compose up -d --build
for i in $(seq 1 60); do docker compose exec -T app wget -qO- http://localhost:8080/api/health >/dev/null 2>&1 && break; sleep 2; done
docker compose exec -T app wget -qO- http://localhost:8080/api/health || { echo "back end did not come up: docker compose logs app"; exit 1; }
echo

echo "== 6/6 first administrators"
docker compose exec -T db psql -U incentive -d incentive -q -c "insert into profiles(email,name,role) values
 ('tech@bpropms.com','Bpro Tech','superadmin'),('process@bpropms.com','Bpro Process','admin'),('drbabu@bpropms.com','Dr. Babu B.','consultant')
 on conflict (email) do nothing;"
(crontab -l 2>/dev/null | grep -v deploy/backup.sh; echo "30 1 * * * $DIR/deploy/backup.sh >> $DIR/deploy/backups/backup.log 2>&1") | crontab -

cat <<EOF

Installed. Next:
  1. Sign-in: add OIDC_GOOGLE_* or OIDC_MICROSOFT_* to $DIR/.env, then: cd $DIR && docker compose up -d
  2. People:  copy deploy/templates/*.csv, fill them, put them in $DIR/data/, then
              docker compose exec app node tools/import.js roster   /data/roster.csv --check
              docker compose exec app node tools/import.js roster   /data/roster.csv
              docker compose exec app node tools/import.js profiles /data/profiles.csv
  3. Data:    drop exports as $DIR/data/inbox/<source>.csv (orders.csv, attendance.csv, ...)
  4. Open:    https://$DOMAIN
The go-live checklist is deploy/GO-LIVE.md.
EOF
