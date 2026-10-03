# Go-live checklist

Tick each line in order. Owner in brackets. Commands run on the VPS from `/opt/incentive`.

## Week before

- [ ] Domain decided and its DNS A record points at the VPS (IT)
- [ ] VPS installed: `install.sh <domain> <email>`; `https://DOMAIN/api/health` answers `ok` (IT)
- [ ] One sign-in provider configured in `.env` and tested by signing in as tech@bpropms.com (IT, Bpro)
- [ ] WhatsApp template `incentive_update` submitted to Meta (see `whatsapp-template.md`) (Admin)
- [ ] SMTP relay chosen; SPF and DKIM records added for the sending domain; `SMTP_URL` and `MAIL_FROM` set (IT)
- [ ] Roster filled from HR records; `import.js roster --check` passes with no errors; loaded (HR, Admin)
- [ ] Profiles filled for leadership, HR, every BM and SM; loaded; each person tested one sign-in (HR, Admin)
- [ ] Exports scheduled from ERP, CRM and biometric into `data/inbox/` (or API adapters configured) (IT)
- [ ] `docker compose exec app node jobs/sync.js` loads every source with row counts (Admin)

## Three days before

- [ ] Leadership confirms pools, weights, targets and gates; saved as a policy version; approved; marked
      communicated; made live in 🛠 Admin → Policy versions (MD, Admin)
- [ ] Targets loaded for every salesperson for the month (Accounts)
- [ ] Spot check: three people's pages against the source systems (bills, punches, deliveries) (Bpro)
- [ ] Dry-run messages: `docker compose exec app node jobs/messages.js daily`, then read `messages_log`;
      every BM and SM has a phone; texts read correctly (Admin)

## Day one

- [ ] `DRY_RUN=0` in `.env`; `docker compose up -d` (Admin)
- [ ] BMs and SMs told how to open the board and to reply once to the WhatsApp number (MD)
- [ ] First 21:00 daily messages arrive; `messages_log` shows `sent` (Admin)
- [ ] Backup ran overnight: `ls deploy/backups` (IT)

## Month end

- [ ] 🛠 Admin → Month close checklist worked through; statements printed; payout file to payroll (Admin, Accounts)
- [ ] Archive the month into history (Admin)
- [ ] After three closes: set the prediction spread from the observed figure in Settings (Bpro)

## Known limits in this release

- The page receives the month's data for the whole group so ranks and leaderboards can be computed in the browser;
  views enforce scope, but a technical user could read colleagues' raw figures from the browser's developer tools.
  If that is not acceptable, limit employee sign-in to Branch Managers and above until server-side views are added.
- Message bodies are in English.
