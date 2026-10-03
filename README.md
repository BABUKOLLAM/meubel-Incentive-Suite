# Bpro incentive board for Meubel Grande and Royal Group

A single-file, self-contained web page that shows incentive in real time at every level of the group, drilling
from **Group → Company (Meubel Grande, Royal Group) → Branch → Team (Sales, Logistics, Back office, Management)
→ Individual**, with a month-end prediction, the chance of hitting target, what to push and what lags at each level.

Open `index.html` in any browser, or host the folder on any static web server. No build step, no dependencies beyond
Google Fonts. Every person, branch and number is a deterministic generated sample; the "as of" slider replays
October 2026 day by day. Hosted with the back end, the board scores the live month (or `BPRO_CONFIG.month`), with
the day count, labels, weekday pattern and archive labels following the calendar.

## Attributes scored

| Attribute | Sales | CRE | Logistics | Back office | Branch |
|---|:-:|:-:|:-:|:-:|:-:|
| Target vs achievement (SO value, monthly, pro-rated to the day) | 25 | | | | 25 |
| Conversion (bills ÷ customers attended) | 10 | | | | 10 |
| Customers attended | 5 | | | | |
| Average discount given / discount trend vs last month | 8 | | | | 5 |
| Margin on own sales / overall GP of the branch | 10 | | | | 15 |
| Upselling / cross-selling | 5 + 5 | | | | |
| Attendance | 6 | 10 | 10 | 10 | 4 |
| Late punches / early going | 3 + 2 | 5 + 5 | 5 + 5 | 5 + 5 | |
| Grooming (audit) | 4 | 5 | 5 | 5 | |
| Customer appreciations | 4 | 5 | 5 | | 3 |
| Google reviews per 10 bills (bills vs review ratio) | 6 | | | | 5 |
| Google review rating | | | | | 8 |
| Commitments communicated on time | 7 | 10 | 10 | | 3 |
| Activities done vs planned | | | 5 | 5 | 5 |
| Neatness | | | | 5 | 4 |
| Audit score | | | | 5 | 8 |
| Walk-out ratio (walk-ins that left without buying) | | | | | 5 |
| On-time delivery / damage-free delivery | | | 30 + 25 | | |
| On-time collection / documentation accuracy / customer calls on time | | | | 30 + 20 + 10 | |
| Walk-ins logged / follow-ups on time / logged walk-ins converted | | 15 + 25 + 20 | | | |

Each column sums to 100 points. Weights and targets live in `W` and `P` at the top of the script and are
placeholders for leadership to confirm.

## How a rupee is computed

- **Scorecard pay** = role pool × score ÷ 100 (score may reach 120 where achievement exceeds target).
  Pools: Sales ₹6,000, CRE ₹4,000, Logistics ₹4,000, Back office ₹4,000. Attendance under 85% gates it to zero.
- **CRE also earn the policy override**: 10% of the sales incentive on walk-ins they logged (paid by the company,
  not from the salesperson), plus the follow-up discipline bonus of ₹2,000: full at 95% on time, half at 85%.
- **Sales also earn the policy per-bill incentive** from the Corporate Incentive Structure draft:
  category rate (A 0.8%, B 0.5%, C 0%) × bill value × discount share (100/60/40/0%), closing-ratio bonus,
  paid only on delivery and payment, nothing on cancellation.
- **Team achievement for BMs, BIs and SMs** = pool (BM ₹15,000, SM/BI ₹10,000) × branch achievement
  (to 120%) × branch score ÷ 100, payable only when the branch reaches 90% of target.
- **Team pool** ₹20,000 per branch, shared equally by all staff when the branch reaches 100% of target with
  an audit score of 70 or more.

## Roles and sign-in

A "Signed in as" switch at the top stands in for the login (production uses the company SSO; no passwords live
in the page). Roles and what each sees:

| Role | Users | Sees | Settings |
|---|---|---|---|
| Super Admin | tech@bpropms.com | everything, including 🧭 Total view, 🛠 Admin, users and reset | edit |
| Admin | process@bpropms.com | everything including 🛠 Admin, except users and reset | edit |
| Consultant | drbabu@bpropms.com (Bpro consultant team) | every view including 🧭 Total view and 🛠 Admin | read-only |
| Managing Director / Director / HR | md@, director@ (Meubel Grande and Royal Group), hr@ | whole group: board, leaderboard, messages | none |
| Branch Manager | one per branch | own branch, its teams and people | none |
| Sales Manager | one per branch | own branch sales team and people | none |
| Employee | one sample salesperson per branch | own page and own message | none |

Scope is enforced: a request outside the role's scope lands on the role's home page, and the selector bar only
offers what the role may open. The Super Admin adds or removes users in ⚙️ Settings → Users.

## Total view (consultant team)

🧭 Total view puts the whole programme on one page for Bpro: client group achievement, outlay and its share of
SO value, GP, score, data feeds connected, settings state and people; companies and all branches with risk flags
(below 85%, management pool closed, GP under the line, audit under 70, staff gated); outlay by role and company;
policy compliance (over-30% bills, cancellations, attendance gate, discount vs GP); data sources with their
schedule; the message schedule with recipient counts; users and roles; and a consultant action list (confirm
placeholders, connect feeds, branches to visit, approvals to check, the month-end run).

## Admin console (back end)

🛠 Admin is the back-end entry and status window for the Bpro roles (Super Admin and Admin edit, Consultant
reads). Six tabs:

- **Policy versions**: the rule set in force and the ones waiting. Save the board's current settings as a new
  version, then move it Draft → Under review → Approved → communicated to the teams → Live. "Make live" applies
  that version to the whole board and is refused until the version is approved and marked communicated, as the
  policy requires. Any version can be loaded into the board to inspect it.
- **Adjustments ledger**: manual additions and deductions, clawback exemptions, written approvals for discounts
  above 30%, disputes and attendance regularisations, each with employee, amount, reference, reason, requester,
  approver and status. Approved additions and deductions flow into the person's expected total on the board and
  in their messages; an approved attendance regularisation marks the day present. Pending items block month close.
- **Wirings**: every integration with mode (not connected, sandbox, live), endpoint, auth type and the name of
  the secret held in the server vault, schedule, last run and result, with Test and Save: billing/ERP, CRM,
  biometric attendance, delivery app, accounts, Google Business Profile, audit and activity sheets, WhatsApp
  Business API, email, single sign-on.
- **Jobs and status**: live feeds, channels, sources still on sample, pending adjustments, policy state and audit
  count at a glance; the scheduled jobs (syncs, recompute, each message run, month close) with state, last run
  and result, and Run now for syncs.
- **Month close**: the nine-step checklist from freeze to payout file and next month's communication, each tick
  logged with who and when; the adjustments step stays blocked while the ledger has pending items.
- **Audit log**: every settings save, upload, user change, policy move, adjustment, wiring change, job run and
  close-step tick, newest first, with copy.

In this preview the console keeps its state in the browser so the flows can be tried end to end; in production it
is the server-side admin app over the same tables.

## Sales analytics window

📊 Sales analytics is a separate window for the Meubel sales picture, scoped by the same selector (group, company
or branch): SO value booked against the pro-rated target, bills and cancellations, average ticket, conversion,
walk-in to attended, average discount, margin, paid share, this week against last, upsell and cross-sell; SO value
by day with a 7-day average and by weekday; the walk-in to paid funnel; the payment pipeline (paid, delivered
awaiting payment, booked, cancelled); SO value by branch against pace; the product mix; the policy category mix;
the discount bands; and a salesperson table with CSV export. Every role except employees can open it; Branch and
Sales Managers see their own branch. Charts use one hue for a single series, the validated four-hue set for
stacked states, and the company colours for branch identity.

## Tooltips

Hover, focus or tap almost anything and a tooltip explains it: every KPI tile, every column heading, every
scorecard attribute (with its target or limit), achievement and status pills, ranks and movement arrows, badges,
chart bars and segments, the view buttons, the scope selectors, breadcrumbs, settings fields and admin state
chips. The glossary lives in `GLOSS`, `ATTR_TIP` and `PILL_TIP` beside the renderer; the pass runs after every
render, so a new card only needs a recognisable label. Escape or scrolling hides the tooltip.

## Everyday controls

The app bar carries the brand mark, the page title, the signed-in switch, the as-of slider, a theme button
(follows the device, or light, or dark; remembered) and a Manual button. The selector bar has a **Find** box:
type a branch or a person and the board jumps there, within the role's scope. A dismissible welcome card
explains the board on first use and offers the three places to start. Copies and downloads confirm with a toast,
a back-to-top button appears on long pages, views fade in (off under reduced motion), the current view is marked
for assistive tech, and a skip link leads to the content. On a phone the view buttons become a fixed bottom bar. Tables longer than 15 rows carry a pager (15, 30, 60 or
all rows); CSV exports always take every row.

## Selector bar

The bar at the top switches scope and view without drilling: Company, Branch, Team and Person dropdowns, and
four view buttons: Board, 🏆 Leaderboard, 📣 Messages, ⚙️ Settings. The breadcrumb trail underneath still
works for stepping back up.

## Messages centre

📣 Messages lists every audience × cadence × channel in one matrix and generates each on demand:

| Audience | Daily | Weekly | Monthly |
|---|---|---|---|
| Every employee | digest | digest | ★ personal summary |
| Sales team | ★ via the SM message | ★ weekly team message | digest |
| CRE team | digest | ★ weekly CRE message | ★ monthly CRE message |
| Logistics team | digest | ★ weekly team message | digest |
| Back office team | digest | ★ weekly team message | digest |
| Sales Manager | ★ daily team message | digest | digest |
| Branch Manager | ★ daily branch message | ★ weekly branch review | branch review |
| MD and Directors | group review | group review | ★ monthly group review |
| HR team | HR review | HR review | ★ monthly HR and payroll review |

Each cell exists as WhatsApp text and as an inline-styled HTML email. ★ marks the tailored templates; the rest
come from one digest engine that computes the team's own measures for the window (today, the last seven days
or the month), compares them with the previous window and the targets, ranks the team with movement, lists the
window's attention points and the priced pushes, and states the pool position. Copy one, open it in WhatsApp,
or copy every branch (or every person in a branch) at once.

## Monthly leaderboard

The 🏆 button opens the leaderboard for the current scope (group, company or branch) with tabs for Branches,
Sales, Logistics, Back office and Management. Rank is by scorecard, then expected incentive (management by
expected incentive). Each row shows movement against the rank seven days earlier. The group page also lists the
top three per role.

## Badge ladder

Recognition without a rupee attached. Every person's page carries a badge ladder, every leaderboard row shows
the badges earned, the personal WhatsApp summary lists them, and the group page carries a badge wall with the
holders of each:

| Badge | Earned when | Who |
|---|---|---|
| 🥇 Monthly champion | first in role across the group at month close | every role |
| 🔥 Streak | on pace today, 7 and 14 days ago (Sales: projection meets target; others: scorecard 85+) | scored roles, from the 15th |
| 🎯 Sharpshooter | conversion at or above 30% for the month | Sales, CRE |
| 🛡️ Discount guardian | no bill above the full-incentive discount band all month | Sales |
| 📦 Clean sheet | 100% damage-free deliveries | Logistics |
| 📞 Never missed | 100% follow-ups on time | CRE |
| 📑 Zero error | 100% documentation accuracy | Back office |
| ✨ Spotless | no absence, late punch or early going | everyone |
| 🌟 Five stars | branch Google rating 4.5+ with 2+ reviews per 10 bills | branch, BM and SM |
| 🤝 Full house | the branch is earning the team pool | every member |

A 100% record needs at least five events before it counts. Badges change nothing in the payout; the rules live in
`BADGES` and `badgesFor` beside the scorecard engine.

## Block colours

Every card belongs to a family, shown on its top edge, its heading tint and a heading dot: navy for position
(targets, achievement, scorecards), teal for charts, green for pushes, red for lags, gold for recognition
(leaderboards, badges), sea-green for messages, purple for history, blue for people, brown for policy and slate
for admin. Tiles take their status colour down the left edge; push and lag entries likewise; score and audit
cells are graded green, amber or red at 85 and 70. A colour key sits under every page. The mapping is
`FAMILIES` beside `render()` and is applied after each render, so new cards only need a recognisable heading.

## Figures and formats

Amounts are Indian rupees with Indian digit grouping (₹1,30,680); lakh and crore are written in words
(₹20.62 lakh, ₹1.07 crore); percentages carry one decimal. Every numeral is a lining figure (the display font's
old-style numerals are switched off), tabular in tiles and table columns so amounts align.

## Month history, statements and exports

- **History**: the group, every branch and every person carry a history card (achievement, score, GP, payout;
  score, achievement, incentive, badges) with the running month marked. Until the first real close the cards
  show three generated sample months, flagged as such. **Archive October 2026 into history** in 🛠 Admin → Month
  close (open on the last day) snapshots the closed month, including each branch's mid-month projection, so the
  prediction spread can be calibrated: Settings → Prediction constants shows the observed spread from the archive.
- **Statements**: one printable page per employee with every component of the month's incentive and the rule
  behind it, the dispute window and signature lines. **Statement** on a person's page prints their own;
  **Statements for every employee** in Month close prints all of them. Use the browser's print dialog to save as
  PDF; no library is involved.
- **Exports**: the payout file for payroll (one row per employee, every component, total confirmed and expected,
  rank and badges) and the adjustments ledger from the Admin console, and any leaderboard table from the
  🏆 view, all as UTF-8 CSV.
- **TV mode** on the leaderboard hides the header and controls, enlarges the table and rotates the tabs every 20
  seconds, for a screen in the branch. Esc leaves it.

## WhatsApp summary

Every person's page ends with a WhatsApp-ready message (bold and italic in WhatsApp markup): expected incentive,
target position and chance, scorecard and rank, what is going well, what lags with the rupees at stake, and the
pushes that move the number, with the provisional-until-delivered note. "Copy message" copies it; "Open in
WhatsApp" opens a wa.me draft. A team page carries all its members' messages with a copy-all. In production the
same text is sent on a schedule through the WhatsApp Business API.

## Daily WhatsApp for Sales Managers

Each branch's Sales team page, and the SM's own page, carry the evening message for the Sales Manager: today's
bookings and walk-ins against yesterday, the month position, the sales team leaderboard for the month with
medals and movement since yesterday (SO value, achievement, conversion, discount, score, today's bookings or
absence), attention points for the day (absences, late punches, bills above 30% discount, overdue deliveries,
cancellations), the pushes for tomorrow priced per person, and the SM's own pool status. In production it goes
out after close every evening through the WhatsApp Business API.

## Weekly WhatsApp for the logistics team

Each branch's Logistics team page, and every logistics person's page, carry the Saturday message for the team
group: this week's deliveries, on-time, damage-free and promises-communicated rates against last week and the
targets, the logistics leaderboard for the month with movement, the week's misses by person (late deliveries,
damages, absences, late punches, orders past their promised date), the pushes for next week with the deliveries
due, and the pool position with the reminder that a late or damaged delivery can cancel the sale for Sales and CRE.

## Weekly WhatsApp for the sales team

Each branch's Sales team page, every salesperson's page and the messages centre carry the Saturday message for
the sales team group: bookings and bills this week against last week, conversion of customers attended, average
discount, margin, upsell and cross-sell, the per-bill incentive booked and the amount forfeited to the discount
bands, the month position; the sales leaderboard with this week's bookings and movement; the week's leakages
(bills above 30%, forfeits to the 60% and 40% bands, cancellations, orders past their delivery date, absences and
late punches); and the pushes for next week: daily SO needed per person, who is within reach of the next
closing-ratio tier, discount discipline, upsell and cross-sell, and delivered orders to collect.

## Weekly WhatsApp for the CRE team

Each branch's CRE team page, and every CRE's page, carry the Saturday message for the team group: walk-ins
logged, follow-ups due and on time, walk-ins converted with the SO value and override earned, each against last
week; the branch month; the CRE leaderboard with follow-up bonus status and movement; the week's misses (late
follow-ups, absences, late punches, cancelled linked orders with the override lost, walk-ins not logged under a
CRE); and the pushes for next week: whether the full follow-up bonus is still reachable and how many misses are
allowed, provisional overrides to chase with sales, conversion against target, and the follow-ups scheduled.

## Weekly WhatsApp for the back office team

Each branch's Back office team page, and every back office person's page, carry the Saturday message for the
team group: this week's dues and on-time collection, documents processed and error-free rate, customer calls
made and on time, each against last week and the target; the branch audit and neatness; the back office
leaderboard for the month with movement; the week's misses by person (late collections, corrected documents,
late calls, absences, late punches); the pushes for next week including delivered orders awaiting payment and,
from the 24th, the month-end reconciliation and statement duty; and the pool position.

## Daily WhatsApp for Branch Managers

Each BM's page, the branch's Management team page and the messages centre carry the evening message for the
Branch Manager: today's bookings, bills and collections against yesterday; the month position, chance and GP;
rank among the company's branches against yesterday; one line per team for the day (Sales walk-ins, attended,
bills and top seller; CRE logged and follow-ups; Logistics deliveries on time and clean; Back office dues
collected); the day's attention points (absences, late punches, bills above 30%, cancellations, overdue
deliveries, damages, missed follow-ups, unlogged walk-ins); tomorrow's load (daily SO needed, deliveries and
follow-ups due, delivered orders awaiting payment, the biggest scorecard gap); and the BM's pool position.

## Weekly email for Branch Managers

The ✉️ button drafts the Monday email for any branch in the current scope: SO booked this week against last
week, month-to-date position and projection, branch score and rank in the company with their weekly movement,
the company branch leaderboard, the branch's Sales, Logistics and Back office leaderboards with rank movement,
the scorecard attributes that improved or slipped, up to four actions for next week, and the BM's own payout
position. The preview is the HTML email itself (inline styles, renders in Gmail and Outlook); it can be copied as
rich HTML or as plain text. In production it is generated from the tracker and sent every Monday morning to each
BM with the SM in copy, and a group version to leadership.

## Monthly email for the MD

The second tab under ✉️ drafts the MD's monthly review: group achievement, GP, score and incentive outlay as a
share of SO value; Meubel Grande against Royal Group; the full group branch leaderboard with weekly movement and
team-pool status; the top three per role across the group; every Branch Manager's pool status and expected
payout; outlay by role; policy health (cancellations after advance, bills above 30% discount with the incentive
forfeited, discount and GP against the bands, staff under the attendance gate, a watch list of branches heading
below 85%); and a numbered approval list. With "as of" at 31 it reads as the closed month for approval; earlier it
is the mid-month preview with projections. In production it is sent on the 1st after Accounts reconciles the
tracker, with a preview on the 16th.

## Settings and data inputs

⚙️ Settings is the back-end window for the sample:

- **Pools and gates**, **policy bands** (category thresholds and rates, discount bands and shares, closing-ratio
  tiers, CRE override, follow-up thresholds), **scorecard weights** per role with a live total that must be 100,
  **attribute targets and limits**, and **prediction constants**. Every change applies at once across the board,
  can be saved in the browser, copied as JSON, pasted or uploaded back, and reset to the policy defaults.
- **Data inputs**, one row per source: sales targets, orders and bills, customers attended, attendance punches,
  walk-ins, CRM follow-ups, delivery log, collection register, documentation log, customer call log, branch audit
  and Google figures, activities, appreciations, grooming. Each source can stay on sample data, take a manual
  CSV or JSON upload (a "Copy template" button gives the columns and an example row, and a roster copy gives the
  employee ids), or point at a link / API that returns the same columns. Uploaded rows replace the sample for the
  people or branches they name; the page re-computes immediately.

The artifact sandbox blocks outside calls, so "Fetch now" only works once the page is hosted on your own server.
There the same fetch runs on a schedule (every 15 minutes for orders and walk-ins, nightly for the rest) against
the billing system, CRM, biometric attendance, delivery app and accounts, and settings live in a back-end table
with an audit trail of who changed what and when.

## Monthly email for the HR team

The HR audience in 📣 Messages drafts the HR and payroll review: attendance and punctuality for the group and by
branch (working days, absences, late punches, early goings, staff under the attendance gate, grooming average,
appreciations, payout), the people to act on (under the gate, chronic late or early, spotless attendance,
grooming below 4), a punctuality leaderboard, the attendance regularisations and incentive disputes from the
adjustments ledger with their status, the payroll input by role with per-head figures, and an action list that
ends with the payroll handover after statements, the 7-day dispute window and MD approval. An HR user
(hr@meubelgrande.example) has group-wide board, leaderboard and messages access.

## Predictions

Month-end achievement is the pace so far extended to 31 days. The chance of hitting a target is a normal
approximation whose spread narrows as the month runs. Provisional per-bill incentive counts at a probability
(payment pending 95%, booked and due in-month 85%, due later 30%). Constants are in `PRED`.

## Turning the sample into the real thing

The generated universe in section 2 of the script is replaced by a feed from the master tracker (orders, CRM,
attendance punches, delivery log, collection register, audit and activity sheets, Google reviews). Sections 3 to 6
(computation, charts, drill-down, push and lags) stay as they are. Each employee's login opens the board at their
own node; managers open at their branch.

## Production back end

`backend/` turns the single page into a hosted system; `deploy/README.md` walks through a VPS install in about
thirty minutes with Docker Compose (Postgres, the Node back end, Caddy for HTTPS).

- **Sign-in** through Google Workspace or Microsoft 365 (OpenID Connect). Only emails on the `profiles` table
  may enter; the role, branch and person come from that table, so scope is decided on the server.
- **Shared state** (settings, policy versions, ledger, wirings, month close, audit log, archive, users) lives in
  Postgres as JSON documents. The page caches it in the browser and writes through on every save; client roles
  receive the ledger filtered to their scope and never the audit log or user list. Every change is also appended
  to an immutable `audit_events` table.
- **Data feeds**: one table per data input, keyed by month, with views the page reads as its link mode. Adapters
  in `backend/jobs/adapters` pull from the ERP, CRM, biometric, delivery, accounts and Google systems; a CSV inbox
  adapter works on day one with scheduled exports. The sync runs every 15 minutes.
- **Scheduled messages** are built on the server with the board's own engine (the same script, run against a
  stub DOM with the live data loaded), then sent through the WhatsApp Business API and SMTP, with every send
  logged. `DRY_RUN=1` logs without sending.
- **Operations**: health endpoint, jobs and messages logs, nightly `pg_dump` script, idempotent schema applied
  on start, `git pull && docker compose up -d --build` to update.

Without `config.js` on the server (for example the artifact preview or the file opened from disk) the page runs
exactly as before, on browser storage and sample data.

## Repository layout

```
index.html                 the whole board: styles, sample universe, computation, views, messages, settings, admin, history, statements, exports
backend/                   hosted back end: server.js, lib (db, auth, kv, sources, engine), jobs (sync, messages, adapters), send, public
deploy/                    VPS guide, Caddyfile, backup script
docker-compose.yml         Postgres + back end + Caddy
test/browser.test.js       headless Chromium walk: no page errors, no bad text, no phone overflow
CLAUDE.md                  conventions for anyone (or any agent) working on the repo
test/render.test.js        renders every view under every role with a stub DOM; fails on any exception, NaN or undefined
.github/workflows/check.yml  runs the render test and a secret scan on every push and pull request
```

Run the test locally with `node test/render.test.js` (Node 18 or later, no packages to install).

## Status

Sample build for leadership review. Pools, weights, targets and gates are the policy draft's placeholders until
leadership confirms them; data is generated until the feeds in Settings and Admin → Wirings are connected.

**Incentive board** - developed for Meubel Grande and Royal Group by Dr. Babu B., Team Bpro ·
[www.drbabu.in](https://www.drbabu.in) · [www.bpropms.com](https://www.bpropms.com).
