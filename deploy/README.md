# Deploying the incentive board on a VPS

**Quick path**: on a fresh Ubuntu VPS, as root, with the domain's A record already pointing at it:

```bash
curl -fsSL https://raw.githubusercontent.com/BABUKOLLAM/meubel-Incentive-Suite/main/deploy/install.sh | bash -s -- incentive.meubelgrande.com tech@bpropms.com
```

It installs Docker and the firewall, clones the code, writes `.env` with fresh secrets, starts everything in dry-run
mode, loads the Bpro administrators and schedules the nightly backup. Then follow `GO-LIVE.md`. The manual steps
below are the same thing done by hand.

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
openssl rand -hex 24          # paste as DB_APP_PASSWORD (the app's restricted database login)
nano .env                     # DOMAIN, ACME_EMAIL, the two secrets, and at least one sign-in provider
```

Sign-in provider:

- **Google Workspace**: Google Cloud Console → APIs & Services → Credentials → OAuth client (Web). Authorised
  redirect URI `https://DOMAIN/api/auth/callback/google`. Paste the client id and secret into `.env`.
- **Microsoft 365**: Entra admin centre → App registrations → New (single tenant). Put the directory (tenant) id in
  `OIDC_MICROSOFT_TENANT`; `common` is refused because it would admit any Microsoft tenant. Redirect URI (Web)
  `https://DOMAIN/api/auth/callback/microsoft`. Add a client secret. Paste id, secret and tenant id.

## 3. Start

```bash
mkdir -p data/inbox && chown -R 1000:1000 data   # the app runs as the node user, uid 1000
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

Then the roster and the branch logins, from the templates in `deploy/templates/` (copy, fill, put in
`/opt/incentive/data/`):

```bash
docker compose exec app node tools/import.js roster   /data/roster.csv --check   # validates, loads nothing
docker compose exec app node tools/import.js roster   /data/roster.csv
docker compose exec app node tools/import.js profiles /data/profiles.csv --check
docker compose exec app node tools/import.js profiles /data/profiles.csv
```

The board builds its branches and people from the roster: real names, starting empty until the feeds arrive.
Branch Managers, Sales Managers and employees need a profiles row with `branch_id` (and `person_id`, the roster id,
for SM and employees) so the board opens at the right place.

## 5. Data feeds

Fastest start: scheduled exports dropped as CSV into `/opt/incentive/data/inbox/<source>.csv` (the exact
columns are in the board's Data inputs → Copy template). The sync job reads them every 15 minutes and moves each
loaded file to `inbox/done/`, so a file is never imported twice or into the next month. Name a file
`<source>-YYYY-MM.csv` to load a specific month (a late correction to last month, for example). An empty file is
refused and the month's rows are kept. For APIs,
copy `backend/jobs/adapters/http-json.example.js` to `http-json.js`, set the URLs in `.env`, rebuild.

Check: `docker compose exec app node jobs/sync.js` prints what was loaded; the board's Settings → Data inputs
shows each source as `api` with the row count; 🛠 Admin → Jobs shows the log.

## 6. Messages

Messages are only logged until `DRY_RUN=0` is set on purpose (a missing value is a dry run). Check the first ones
in `messages_log`:

```bash
docker compose exec app node jobs/messages.js daily
docker compose exec db psql -U incentive -d incentive -c "select at,audience,channel,recipient,status,error from messages_log order by id desc limit 20"
```

WhatsApp: a Meta Business account, a phone number id, a permanent token, and an approved template named
`incentive_update` with one body parameter (Meta approval takes one to three days; submit early). Employees who
reply to the number re-open the 24-hour window in which full messages are sent as plain text; outside it the
template goes out with the headline and the board link. Email: any SMTP relay (SendGrid, Amazon SES, Google
Workspace) as `SMTP_URL`, with SPF and DKIM set for the sending domain.

Then set `DRY_RUN=0` and `docker compose up -d`. Each message goes out once per run and recipient (the
`message_sends` table), so a re-run or a restart does not send twice; a failed send is retried on the next run.
The monthly round on the 1st reports the month that has just ended, scored to its last day.

## 7. Backups and upkeep

```bash
# nightly dump, keep 30 days (add to root's crontab: 30 1 * * * /opt/incentive/deploy/backup.sh)
/opt/incentive/deploy/backup.sh
```

Restore: `gunzip -c deploy/backups/incentive-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U incentive -d incentive`.

Monitoring: `https://DOMAIN/api/health` for an uptime check; the Total view shows feed freshness; `jobs_log`
records every scheduled run and failure.

## Upgrading an existing server

`git pull && sudo deploy/install.sh <domain> <email>` adds what a newer release needs to `.env` and restarts. By hand:

1. Add `DB_APP_PASSWORD=$(openssl rand -hex 24)` to `.env`: the app now connects as a restricted database role,
   created by the one-shot `migrate` service, and never sees the owner's password.
2. Microsoft sign-in: put the tenant id in `OIDC_MICROSOFT_TENANT` (`common` is refused).
3. `chown -R 1000:1000 data` (the app container runs as the unprivileged node user).
4. `docker compose up -d --build`. Migrations in `backend/db/migrations` are applied once each and recorded in
   `schema_migrations`; `docker compose logs migrate` shows which ran.


## Updating: one command, or automatic from GitHub

On the server, `sudo /opt/incentive/deploy/update.sh` pulls the latest code, rebuilds, waits until the board answers
and prints the release it is now running. Nothing else is needed: new migrations run on their own, and the first
start of a new build tells every phone that switched update notifications on (see below).

To deploy on every push to `main` instead, once the checks pass, add these under GitHub → the repository →
Settings → Secrets and variables → Actions:

| Secret | What to put in it |
|---|---|
| `VPS_HOST` | the server's address, for example `board.meubelgrande.in` or its IP |
| `VPS_SSH_KEY` | a private key made for this purpose (`ssh-keygen -t ed25519 -f deploy_key -N ""`); put `deploy_key.pub` into the server user's `~/.ssh/authorized_keys` |
| `VPS_USER` | optional, the login (default `root`; another user needs passwordless `sudo` for `deploy/update.sh`) |
| `VPS_PORT` | optional, the SSH port (default 22) |
| `VPS_HOST_KEY` | optional but recommended: the output of `ssh-keyscan -t ed25519 <host>`, so the connection is checked against the server's real key |
| `VPS_DIR` | optional, the install folder (default `/opt/incentive`) |

The **deploy** workflow then runs `deploy/update.sh` over SSH after every green **check** run on `main`, and can
be started by hand from the Actions tab (Run workflow). Without `VPS_HOST` and `VPS_SSH_KEY` it ends with a notice
and deploys nothing.

## Update notifications on phones

The hosted board installs as an app (Android: the browser's *Install app* / *Add to Home screen*; iPhone: Safari →
Share → *Add to Home Screen*) and keeps the last copy for a weak connection, with a note when it is offline.

- **Banner**: every open board checks the server's build every five minutes and whenever it comes back to the
  screen; when a new release is running it shows *A new version of the board is ready* with **Update now**.
- **Push message**: *🔕 Get updates* in the header switches notifications on for that device (on iPhone, from the
  Home Screen app, iOS 16.4 or later). The first start of a new build sends one message to every such device; its
  text is the first line of `deploy/RELEASE.md`, so edit that line with each release. `PUSH_ON_DEPLOY=0` in `.env`
  turns the automatic message off.
- **Announcements**: Admin → Jobs and status → *Announce to phones* sends any title and message to every device
  that switched updates on; each send is written to the audit log.
- The signing keys (VAPID) are made on first use and kept in the database, so there is nothing to configure;
  `VAPID_SUBJECT=mailto:you@company` sets the contact address push services see. Devices that uninstall or block
  notifications are removed automatically.

## What is still sample until the feeds arrive

Once a roster is loaded the sample universe is gone: every person and branch is real and starts empty, and each
feed fills its part. Until a roster is loaded the hosted board still shows the sample. When hosted, the engine scores the live month in India (day count, labels and the as-of day follow the calendar);
`BOARD_MONTH=YYYY-MM` on the server, or `BPRO_CONFIG.month` in `config.js`, pins a different month, for example to
re-run a close.
