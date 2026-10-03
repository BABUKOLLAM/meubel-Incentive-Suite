# Deploying the incentive board on a VPS

One Ubuntu VPS (2 vCPU, 2 GB RAM is plenty), one domain, about thirty minutes. Everything runs in Docker:
Postgres, the Node back end that serves the page and runs the jobs, and Caddy for HTTPS.

## 1. Server

```bash
# as root on Ubuntu 22.04 / 24.04
apt update && apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sh
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

Point the DNS A record of your domain (for example `incentive.meubelgrande.com`) at the server's IP first;
Caddy fetches the certificate on first start and needs the name to resolve.

## 2. Code and settings

```bash
git clone https://github.com/BABUKOLLAM/meubel-Incentive-Suite.git /opt/incentive
cd /opt/incentive
cp .env.example .env
openssl rand -hex 32          # paste as SESSION_SECRET
openssl rand -hex 24          # paste as DB_PASSWORD
nano .env                     # DOMAIN, ACME_EMAIL, the two secrets, and at least one sign-in provider
```

Sign-in provider:

- **Google Workspace**: Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Authorised
  redirect URI `https://DOMAIN/api/auth/callback/google`. Paste the client id and secret into `.env`.
- **Microsoft 365**: Entra admin centre → App registrations → New. Redirect URI (Web)
  `https://DOMAIN/api/auth/callback/microsoft`. Add a client secret. Paste id, secret and tenant id.

## 3. Start

```bash
docker compose up -d --build
docker compose logs -f app      # wait for "incentive board back end on :8080"
curl -s https://DOMAIN/api/health
```

The schema is applied on every start, so updates are `git pull && docker compose up -d --build`.

## 4. People

Only emails on the `profiles` table can sign in. Load the first administrators, then the roster.

```bash
docker compose exec db psql -U incentive -d incentive -c "
insert into profiles(email,name,role) values
 ('tech@bpropms.com','Bpro Tech','superadmin'),
 ('process@bpropms.com','Bpro Process','admin'),
 ('drbabu@bpropms.com','Dr. Babu B.','consultant'),
 ('md@meubelgrande.com','Managing Director','md'),
 ('hr@meubelgrande.com','HR team','hr')
on conflict (email) do nothing;"
```

Roster and branch logins are loaded through the API as JSON (after signing in as super admin, from the browser
console or with a cookie-carrying client), or straight into the tables with `psql \copy` from a CSV with the
columns `id,name,role,branch,branch_id,company,phone,email,joined,left_on`. Branch Managers, Sales Managers
and employees need a `profiles` row with `branch_id` (and `person_id` for SM and employees) so the board opens at
the right place.

## 5. Data feeds

Fastest start: scheduled exports dropped as CSV into `/opt/incentive/data/inbox/<source>.csv` (the exact
columns are in the board's Data inputs → Copy template). The sync job reads them every 15 minutes. For APIs,
copy `backend/jobs/adapters/http-json.example.js` to `http-json.js`, set the URLs in `.env`, rebuild.

Check: `docker compose exec app node jobs/sync.js` prints what was loaded; the board's Settings → Data inputs
shows each source as `api` with the row count; 🛠 Admin → Jobs shows the log.

## 6. Messages

Leave `DRY_RUN=1` until the first messages look right in `messages_log`:

```bash
docker compose exec app node jobs/messages.js daily
docker compose exec db psql -U incentive -d incentive -c "select at,audience,channel,recipient,status,error from messages_log order by id desc limit 20"
```

WhatsApp: a Meta Business account, a phone number id, a permanent token, and an approved template named
`incentive_update` with one body parameter (Meta approval takes one to three days; submit early). Employees who
reply to the number re-open the 24-hour window in which full messages are sent as plain text; outside it the
template goes out with the headline and the board link. Email: any SMTP relay (SendGrid, Amazon SES, Google
Workspace) as `SMTP_URL`, with SPF and DKIM set for the sending domain.

Then set `DRY_RUN=0` and `docker compose up -d`.

## 7. Backups and upkeep

```bash
# nightly dump, keep 30 days (add to root's crontab: 30 1 * * * /opt/incentive/deploy/backup.sh)
/opt/incentive/deploy/backup.sh
```

Restore: `gunzip -c deploy/backups/incentive-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U incentive -d incentive`.

Monitoring: `https://DOMAIN/api/health` for an uptime check; the Total view shows feed freshness; `jobs_log`
records every scheduled run and failure.

## What is still sample until the feeds arrive

The engine keeps the sample universe for anything no source has supplied yet, so the board is never empty. As
each feed lands, its rows replace the sample for the people and branches they name. When hosted, the engine scores the live month in India (day count, labels and the as-of day follow the calendar);
`BOARD_MONTH=YYYY-MM` on the server, or `BPRO_CONFIG.month` in `config.js`, pins a different month, for example to
re-run a close.
