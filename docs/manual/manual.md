# Incentive Board Manual

Oct 3, 2026 · @BABU

## Incentive Board for Meubel Grande and Royal Group

&#91;image: Bpro\]

**Settings manual and user manual** for administrators and top management, release 1.2, October 2026.

One board pays every role from the same written policy, shows each person their incentive as it builds through the month, and sends the right summary to the right person on WhatsApp or email. This manual explains the whole programme, then walks through every screen: the lenses for leadership, the settings and data inputs for administrators, and the back-end console for the Bpro team.

| Reader | Start at | Then |
| --- | --- | --- |
| MD, Directors, HR | The programme at a glance, Lenses, Top management quick guide | Leaderboard, Messages, FAQ |
| Branch and Sales Managers | Lenses (branch, team, individual), Predictions, Messages | Leaderboard and gamification |
| Administrators (tech@bpropms.com, process@bpropms.com) | Settings manual, Data inputs, Admin console | Operating rhythm, RAQ, Sticky notes |
| Consultant team | Total view, Admin console, Operating rhythm | Everything else |

Designed and developed by **Dr. Babu B., Team Bpro Consulting & Technologies** · [www.drbabu.in](https://www.drbabu.in) · [www.bpropms.com](https://www.bpropms.com). Prepared for Meubel Grande and Royal Group. The live board is at https://claude.ai/artifact/HHjKj4Kdhd256YJDCWPTdJ and the source at https://github.com/BABUKOLLAM/meubel-Incentive-Suite.

## 📑 Contents

| # | Section | Who should read it | Lens |
| --- | --- | --- | --- |
| 1 | 🧭 The programme at a glance | Everyone | Overview |
| 2 | 🔍 Lenses: Group → Company → Branch → Team → Individual | Everyone | Board |
| 3 | 🔐 Roles and sign-in | Administrators, HR | Access |
| 4 | 🧮 The scorecard explained | Top management, administrators | Rules |
| 5 | 🔮 Predictions, further push and what lags | Managers, top management | Board |
| 6 | 🏆 Leaderboard and gamification | Everyone | Leaderboard |
| 7 | 📣 Messages centre | Administrators, BMs, HR | Messages |
| 8 | ⚙️ Settings manual | Administrators | Settings |
| 9 | 📥 Data inputs: CSV, link and API | Administrators, Accounts, IT | Settings |
| 10 | 🛠 Admin console | Super Admin, Admin, consultant | Admin |
| 11 | 📅 Operating rhythm | Administrators, HR, Accounts | Calendar |
| 12 | 👑 Top management quick guide | MD, Directors, HR | Decisions |
| 13 | ❓ FAQ | Everyone | Help |
| 14 | 🤔 RAQ: rarely asked questions | The curious | Help |
| 15 | 📌 Sticky notes, troubleshooting, glossary, version history, colophon | Everyone | Reference |

**How to read this manual.** Each section opens with a 📌 sticky note that says the one thing to remember, then a 🔍 lens that says what to look at on the screen, then the procedure. Screenshots are from the sample build, so the names, branches and rupee figures are generated and will differ from the live board. A 🎮 marker flags the gamification elements, a ⚠️ marker flags a policy rule that cannot be overridden on screen.

## 🧭 1. The programme at a glance

> 📌 **Sticky note.** The board turns the Corporate Incentive Structure (19 September 2026 draft) into one number every employee can see every day: *what I will earn this month if I keep going like this, what I can still do about it, and what is holding me back.*

**What it is.** The Bpro incentive board is a single web page, hosted on the group's own server, that reads the master tracker (orders, CRM, attendance punches, delivery log, collection register, audit sheets, Google reviews) and computes the incentive of every person, team, branch and company of Meubel Grande and Royal Group as the month runs. The same engine writes every WhatsApp message and every email the programme sends, so a figure on the board, in a message and in a month-end statement is always the same figure.

**Why it exists.** The policy draft defines pools, per-bill rates, discount bands, gates and team achievements. Rules on paper reward nobody until the month is over. The board makes the rules live: a salesperson who gives a 22% discount sees the forfeited share of that bill the same evening, a Branch Manager sees the branch slipping under 85% ten days before the month closes, and the MD sees outlay as a share of SO value before approving payout.

**The one-page policy, as the board applies it**

| Rule | Value in the sample build | Where it is set |
| --- | --- | --- |
| Scorecard pools, monthly | Sales ₹6,000 · CRE ₹4,000 · Logistics ₹4,000 · Back office ₹4,000 | ⚙️ Settings → Pools and gates |
| Management pools | BM ₹15,000 · SM and BI ₹10,000, paid on branch achievement, open at 90% of target | Settings → Pools and gates |
| Team pool | ₹20,000 per branch, shared equally at 100% of target with audit ≥ 70 | Settings → Pools and gates |
| Attendance gate | Below 85% attendance the scorecard pay is zero | Settings → Pools and gates |
| Per-bill incentive (Sales) | Category A ≥ ₹60,000 at 0.8% · B ≥ ₹25,000 at 0.5% · C at 0% | Settings → Policy bands |
| Discount bands | Up to 12% full · up to 20% 60% · up to 30% 40% · above 30% nothing | Settings → Policy bands |
| Closing-ratio bonus | +10% at 30% conversion · +5% at 20% | Settings → Policy bands |
| CRE override | 10% of the sales incentive on walk-ins the CRE logged, paid by the company | Settings → Policy bands |
| CRE follow-up bonus | ₹2,000 full at 95% on time, half at 85% | Settings → Pools and gates |
| Payment rule | Per-bill incentive is paid only on delivery and payment; a cancellation pays nothing | ⚠️ fixed in the engine |

**How data becomes rupees and messages.** Feeds land in the tracker, the engine scores every attribute against its target, weights the scores into a scorecard out of 100, applies pools and gates, adds the per-bill incentive and any approved adjustment, and projects the month end. The views, the leaderboard and the messages centre all read that one result. The diagram below shows the path.

&#91;embedded content: data path · 7 feeds, one tracker, one engine, 4 outputs\]

Settings and the Admin console sit above the engine: they change the rules, never the data. Nothing on the right is computed twice.

**What is sample and what is real.** Every person, branch and number in the screenshots is generated. The *as of* slider replays October 2026 day by day so the flows can be rehearsed. Pools, weights and targets are the policy draft's placeholders until leadership confirms them in Settings, and the figures go live when the feeds in 🛠 Admin → Wirings are connected.

> 🎮 **Gamification in one line.** Medals, rank movement arrows, chance-of-target percentages, priced pushes, spotless-attendance call-outs and a ten-badge ladder with a group badge wall are built in. None of them changes a rupee; section 6 has the rules.

## 🔍 2. Lenses: Group → Company → Branch → Team → Individual

> 📌 **Sticky note.** Every lens has the same four panels in the same order: *position* (booked, expected, chance), *leaderboard*, *further push* and *what lags*. Learn one lens and you know them all.

**The selector bar.** The strip under the title switches scope without drilling: Company, Branch, Team and Person dropdowns, then four view buttons (Board, 🏆 Leaderboard, 📣 Messages, ⚙️ Settings) and, for Bpro roles, 🧭 Total and 🛠 Admin. The breadcrumb trail below it steps back up one level at a time. The *as of* slider on the right replays the month day by day; in production it is pinned to today.

&#91;image: The header: signed-in switch, selector bar, as-of slider and theme toggle\]

### 🧰 Everyday controls

**What to look at.** The app bar carries the brand mark, the page title, the signed-in switch, the as-of slider, a theme button (follows the device, or light, or dark; remembered per browser) and a Manual button. The selector bar has a **Find** box: type a branch or a person and the board jumps there, within the role's scope. A dismissible welcome card explains the board on first use and offers the three places to start. Copies and downloads confirm with a toast, a back-to-top button appears on long pages, and on a phone the view buttons become a fixed bottom bar. Tables longer than 15 rows carry a pager with a rows-per-page choice; exports always take every row.

### 🌐 Group lens

&#91;image: Group lens: Meubel Grande and Royal Group side by side with every branch's achievement\]

**What to look at.** The two company tiles and the branch achievement bars. Any bar under the 85% line is a branch whose management pool is at risk; a bar under 100% with audit under 70 means no team pool. The right-hand column lists the top three per role across the group, the group pushes and the group lags.

**Who uses it.** MD, Directors, HR, the Bpro team and administrators. It is the home page for the group roles.

### 🏢 Company lens

&#91;image: Company lens: one company's branches ranked, with outlay and policy health\]

**What to look at.** The company's achievement, expected month-end SO value and chance of target, then the branch leaderboard with movement arrows against seven days earlier. The *further push* list prices what each branch still needs per day; *what lags* names the attributes that cost the most scorecard points across the company.

### 🏬 Branch lens

&#91;image: Branch lens: the branch position, its teams, the BM and SM pool status\]

**What to look at.** The branch achievement against the 90% management gate and the 100% team-pool gate, GP against the 32% line, the branch scorecard (audit, neatness, Google rating, reviews per 10 bills, walk-out ratio, activities), and the team tiles. The BM and SM pool cards show whether the management pool is open and what it is worth at the current pace.

**Who uses it.** Branch Managers land here. Directors and the MD drill into it from the company lens.

### 👥 Team lens

&#91;image: Team lens, Sales: members ranked with SO value, conversion, discount and score\]

&#91;image: Team lens, CRE: walk-ins logged, follow-ups on time, conversions and override earned\]

**What to look at.** The member table is the team's live leaderboard: rank, movement, the team's own measures and the expected incentive. Below it sit the team's messages for the window (daily for Sales, weekly for CRE, Logistics and Back office) with copy-all, then the pushes priced per person and the lags per person. Sales Managers land on the Sales team lens.

### 🧑 Individual lens

&#91;image: Individual lens: expected incentive, chance, scorecard with every attribute, pushes, lags and the WhatsApp summary\]

**What to look at.** The headline tile is the expected incentive for the month with its provisional note. The scorecard lists every attribute with its value, target, points earned and points available, so the person can see exactly where the gap is. *Further push* says what to do next and what it is worth in rupees; *what lags* says what is costing the most. The page ends with the person's WhatsApp summary, ready to copy. Employees see only this page for themselves.

### 🧭 Total view (Bpro consultant team)

&#91;image: Total view: the whole programme on one page for the consultant team\]

**What to look at.** Group achievement, outlay and its share of SO value, data feeds connected, settings state, every branch with its risk flags, policy compliance, the message schedule with recipient counts, users and roles, and the consultant action list. It is the page to open before a client review.

### 📊 Sales analytics window

&#91;image: Sales analytics: the Meubel sales picture for the scope, from KPI tiles to the salesperson table\]

**What to look at.** A separate window for the sales picture, scoped by the same selector: SO value against the pro-rated target, bills and cancellations, average ticket, conversion, walk-in to attended, average discount, margin, paid share, this week against last, upsell and cross-sell. Below the tiles: SO value by day with a 7-day average and by weekday, the walk-in to paid funnel, the payment pipeline, SO value by branch against pace, the product mix, the policy category mix, the discount bands, and a salesperson table with CSV export. Every role except employees can open it; Branch and Sales Managers see their own branch.

### ⇆ Top bar or side bar

&#91;image: The same menu docked as a side bar, with the scope selectors above the view buttons\]

**What to look at.** The last button on the selector bar flips the whole menu between the top bar and a docked left side bar. The choice is remembered in the browser, and on a phone the side bar folds back to the top.

> 🔍 **Lens tip.** The movement arrows (▲ ▼) on every leaderboard compare with the rank seven days earlier on the board and with yesterday in the daily messages. A branch that is first but falling is a different conversation from a branch that is fourth but climbing.

## 🔐 3. Roles and sign-in

> 📌 **Sticky note.** Scope is enforced, not suggested. A Branch Manager who types another branch's address lands back on their own branch. The selector bar only offers what the role may open.

**Sign-in.** In production every user signs in through the group's single sign-on (configured in 🛠 Admin → Wirings → Single sign-on); no password lives in the page. In the sample build the *Signed in as* switch at the top left stands in for the login so that every role can be rehearsed.

| Role | Sample users | Home page | Can open | Settings |
| --- | --- | --- | --- | --- |
| 🛡 Super Admin | tech@bpropms.com | Group | Board, 🧭 Total, 🏆, 📣, ⚙️, 🛠 Admin, Users, Reset | Edit |
| 🔧 Admin | process@bpropms.com | Group | Board, 🧭 Total, 🏆, 📣, ⚙️, 🛠 Admin | Edit |
| 🧭 Consultant | drbabu@bpropms.com and the Bpro consultant team | Group | Board, 🧭 Total, 🏆, 📣, ⚙️, 🛠 Admin | Read only |
| 👑 Managing Director | md@ | Group | Board, 🏆, 📣 | None |
| 👑 Director | one per company | Group | Board, 🏆, 📣 | None |
| 🫶 HR | hr@ | Group | Board, 🏆, 📣 (HR audience) | None |
| 🏬 Branch Manager | one per branch | Own branch | Own branch, its teams and people, 🏆, 📣 for the branch | None |
| 👥 Sales Manager | one per branch | Own Sales team | Own Sales team and its people, 🏆, 📣 for the team | None |
| 🧑 Employee | every staff member | Own page | Own page and own message only | None |

&#91;image: A Branch Manager's view: the selector bar offers only the branch, its teams and its people\]

&#91;image: An employee's view: own scorecard, pushes, lags and WhatsApp summary, nothing else\]

### Procedure: add or remove a user (Super Admin only)

1. Sign in as Super Admin and open ⚙️ Settings → **Users**.
2. Enter the email, display name and role. For a Branch Manager, Sales Manager or employee also pick the branch and the person on the roster the login belongs to.
3. Save. The user appears in the *Signed in as* switch at once; in production the same row is what single sign-on maps the login to.
4. To remove, use the ✖ on the row. Removal is written to the audit log with who did it and when.

### Procedure: check what a role sees

1. Switch *Signed in as* to the user.
2. Try the selector bar: dropdowns outside the scope are absent, view buttons the role lacks are absent.
3. Try the address bar with another branch's state: the board redirects to the role's home page.

> ⚠️ **Policy rule.** Only Super Admin can add users or reset the board. Admin edits settings and the Admin console. Consultants read everything and edit nothing. Client roles never see Settings or Admin, which keeps the rule set in one pair of hands.

## 🧮 4. The scorecard explained

> 📌 **Sticky note.** Scorecard pay = role pool × score ÷ 100. Score is the weighted sum of every attribute's attainment against its target, out of 100, reaching 120 only where achievement beats target. Attendance under 85% makes it zero.

### 4.1 Attributes and weights per role

Every column sums to 100 points. The weights are editable in ⚙️ Settings → Scorecard weights and are the policy draft's placeholders until leadership confirms them.

| Attribute | Target | Sales | CRE | Logistics | Back office | Branch |
| --- | --- | :-: | :-: | :-: | :-: | :-: |
| Target vs achievement (SO value, pro-rated to the day) | 100% | 25 |  |  |  | 25 |
| Conversion (bills ÷ customers attended) | 30% | 10 |  |  |  | 10 |
| Customers attended | 50 a month | 5 |  |  |  |  |
| Average discount given | ≤ 12% | 8 |  |  |  |  |
| Discount trend vs last month | ≤ 0 pp |  |  |  |  | 5 |
| Margin on own sales | 30% | 10 |  |  |  |  |
| Overall GP of the branch | 32% |  |  |  |  | 15 |
| Upselling (bills with an upgrade) | 20% | 5 |  |  |  |  |
| Cross-selling (bills with an add-on) | 25% | 5 |  |  |  |  |
| Attendance | 95% | 6 | 10 | 10 | 10 | 4 |
| Late punches | ≤ 2 | 3 | 5 | 5 | 5 |  |
| Early going | ≤ 1 | 2 | 5 | 5 | 5 |  |
| Grooming (audit, out of 5) | 4.5 | 4 | 5 | 5 | 5 |  |
| Customer appreciations | 3 a month | 4 | 5 | 5 |  | 3 |
| Google reviews per 10 bills | 2 | 6 |  |  |  | 5 |
| Google review rating | 4.5 |  |  |  |  | 8 |
| Commitments communicated on time | 90% | 7 | 10 | 10 |  | 3 |
| Activities done vs planned | 100% |  |  | 5 | 5 | 5 |
| Neatness (out of 5) | 4.5 |  |  |  | 5 | 4 |
| Audit score | 85 |  |  |  | 5 | 8 |
| Walk-out ratio | ≤ 70% |  |  |  |  | 5 |
| On-time delivery | 92% |  |  | 30 |  |  |
| Damage-free delivery | 97% |  |  | 25 |  |  |
| On-time collection of dues | 95% |  |  |  | 30 |  |
| Documentation accuracy | 97% |  |  |  | 20 |  |
| Customer calls made on time | 90% |  |  |  | 10 |  |
| Walk-ins logged and handled | 60 a month |  | 15 |  |  |  |
| Follow-ups on time | 95% |  | 25 |  |  |  |
| Logged walk-ins converted | 30% |  | 20 |  |  |  |
| **Total** |  | **100** | **100** | **100** | **100** | **100** |

**Attainment.** For an *up* attribute, attainment = value ÷ target, capped at 100% (achievement alone may reach 120%). For a *down* attribute such as discount or late punches, attainment falls as the value passes the limit. Monthly counts marked *pro-rated* (customers attended, appreciations, walk-ins) are compared with the share of the month elapsed, so the fifth of the month is judged against a fifth of the target.

### 4.2 The rupee components

| Component | Who | Rule |
| --- | --- | --- |
| 🧮 Scorecard pay | Sales, CRE, Logistics, Back office | pool × score ÷ 100; ⚠️ zero under 85% attendance |
| 🧾 Per-bill incentive | Sales | category rate × bill value × discount share, plus the closing-ratio bonus; ⚠️ paid only when delivered and paid, nothing on cancellation |
| 🤝 CRE override | CRE | 10% of the sales incentive on walk-ins the CRE logged, paid by the company, not from the salesperson |
| 📞 Follow-up bonus | CRE | ₹2,000 at 95% follow-ups on time, ₹1,000 at 85% |
| 🏬 Team achievement | BM, SM, BI | pool × branch achievement (to 120%) × branch score ÷ 100; ⚠️ open only at 90% of branch target |
| 🎁 Team pool | Every staff member of the branch | ₹20,000 shared equally; ⚠️ only at 100% of target with audit ≥ 70 |
| ± Adjustments | Anyone named in the ledger | approved additions and deductions from 🛠 Admin → Adjustments flow into the expected total |

### 4.3 Worked example: a salesperson

A sales executive with a score of 84 on a ₹6,000 pool earns ₹5,040 scorecard pay. One bill of ₹1,40,000 list price at 10% discount is category A (0.8%), in the full band (100%), so it books ₹1,120 provisional per-bill incentive. The same bill at 22% discount would still be category A but in the 40% band: ₹448, with ₹672 forfeited. At 31% discount it pays nothing and the board flags it as an *over-30% bill*. A conversion of 32% for the month adds the 10% closing-ratio bonus on every paid bill. Nothing is paid until the order is delivered and the payment received; a cancellation after advance removes the bill from the total and the CRE's override with it.

### 4.4 Worked example: a Branch Manager

A branch at 96% of target with a branch score of 78 opens the management pool (above 90%). The BM's team achievement = ₹15,000 × 0.96 × 0.78 = ₹11,232. The SM on the same branch earns ₹10,000 × 0.96 × 0.78 = ₹7,488. Had the branch closed at 88%, both would be zero and the board would have shown the gap in rupees per day for the rest of the month.

### 4.5 Worked example: the team pool

A branch of 14 staff that closes at 101% with an audit score of 74 shares ₹20,000: ₹1,429 each, shown on every member's page as *team pool: open*. At 101% with audit 68 the pool is closed and the branch lens names the audit score as the lag.

> 🔍 **Lens.** On the individual page every attribute row shows *points earned / points available*. The biggest difference is the first item under *what lags*, and the push list prices what closing it is worth.

## 🔮 5. Predictions, further push and what lags

> 📌 **Sticky note.** The board never says *you will earn*. It says *at this pace you would earn*, and shows the chance. The chance tightens as the month runs: on the 5th it is a guess, on the 25th it is nearly a fact.

### 5.1 Month-end projection

Expected SO value = SO booked so far ÷ days elapsed × 31. Every rupee figure on the board that is labelled *expected* is computed from that projection through the same scorecard rules as the booked figure. A person, branch or company is *on pace* when the projection meets the target.

### 5.2 Chance of target

The chance is a normal approximation. The spread of the projection is a coefficient of variation (22% in the sample) scaled by the square root of the share of the month still to run, so the band narrows every day. At branch level the spread is 80% of a person's and at company level 60%, since many people's good and bad days cancel out. Chance = probability that the projected value lands above the target.

| Day of month | Share of month left | Spread multiplier | Reading |
| --- | --- | --- | --- |
| 5 | 84% | 0.92 | wide band, chance near 50% unless far ahead or behind |
| 15 | 52% | 0.72 | band halves, the number starts to mean something |
| 25 | 19% | 0.44 | narrow band, chance near 0% or 100% |
| 31 | 0% | 0 | closed month, chance is 0% or 100% |

### 5.3 Provisional per-bill incentive

A bill counts at a probability until it is delivered and paid, because the policy pays only then:

| Bill state | Counted at |
| --- | --- |
| Delivered, payment pending | 95% |
| Booked, delivery due in the month | 85% |
| Business not yet booked (the projected part) | 50% |
| Cancelled | 0%, removed from the total |

The constants live in ⚙️ Settings → Prediction constants and are to be recalibrated from the first three real months.

The panel also shows the spread observed between the mid-month projection and the closed figure across the months archived in 🛠 Admin → Month close (section 10.7). That observed figure, not the placeholder, is what the spread constant should be set to once three real months are in the archive.

### 5.4 Further push

The push list is the action list, priced. The engine computes, for the scope on screen:

- **Achievement push**: the gap to target divided by the days left, as rupees of SO value per day, with the chance of making it.
- **Attribute pushes**: for every attribute below target, the points it would add and the rupees those points are worth on the pool, sorted by rupees.
- **Policy pushes**: who is within reach of the next closing-ratio tier, bills to keep under the 12% band, delivered orders awaiting payment, CRE follow-ups needed to keep the full bonus, overdue deliveries.
- **Gate pushes**: a branch under 90% (management pool), under 100% or audit under 70 (team pool), a person under 85% attendance.

### 5.5 What lags

*What lags* is the same computation read the other way: the attributes costing the most points today, each with its value, target and the rupees at stake, and the policy leakages (bills over 30%, forfeits to the 60% and 40% bands, cancellations, late deliveries, missed follow-ups). A manager reading a team page sees the lags per person; the MD reading the group page sees the lags that recur across branches.

> 🔍 **Lens.** When *further push* and *what lags* name the same attribute, that is the one to act on today: it is both the cheapest point to win and the costliest point being lost.

> 🎮 **Gamification.** The chance percentage is the programme's progress bar. Teams that watch it move from 40% to 70% in a week behave differently from teams that see a target once a month.

## 🏆 6. Leaderboard and gamification

> 📌 **Sticky note.** Rank is by scorecard, then expected incentive. Movement is against seven days earlier on the board and against yesterday in the daily messages. Medals go to the top three of each role, in each branch, in each company and across the group.

&#91;image: The leaderboard: tabs for Branches, Sales, Logistics, Back office and Management, with medals and movement\]

### 6.1 What is built in

| 🎮 Element | Where | Rule |
| --- | --- | --- |
| 🥇 🥈 🥉 Medals | every leaderboard and every team message | top three by scorecard, then expected incentive; management by expected incentive |
| ▲ ▼ Movement arrows | every leaderboard | rank now against rank seven days ago (board) or yesterday (daily WhatsApp) |
| 🏅 Top three per role | group lens, MD monthly email | best Sales, CRE, Logistics, Back office and Management across the group |
| ✨ Spotless attendance | HR email, weekly team messages | no absence, late punch or early going in the window |
| 🏁 On pace | every lens | projection meets target; the headline turns green |
| 📈 Chance of target | every lens, every message | the normal-approximation probability of section 5 |
| 💰 Priced pushes | every lens, every message | each action shown with the rupees it is worth |
| 🎁 Pool status | branch lens, BM and SM messages | open / closed against the 90% and 100% gates with the gap in rupees per day |
| 🔔 Closing-ratio tiers | sales messages | who is within reach of +5% and +10% |

### 6.2 Reading the leaderboard

1. Choose the scope with the selector bar: group, company or branch.
2. Pick the tab: Branches, Sales, Logistics, Back office or Management. CRE members rank inside their branch's team lens.
3. Read rank, movement, the role's own measures and the expected incentive. Click a name to open the individual lens.
4. The group leaderboard also lists the top three per role; the MD monthly email carries the same table.

**Export and TV mode.** The bar under the table exports the visible table as CSV. **TV mode** hides the header and controls, enlarges the table and rotates the tabs every 20 seconds, for a screen in the branch; sign in a display user with the Branch Manager role, open the leaderboard and press it. Esc leaves it.

&#91;image: TV mode: the leaderboard full screen for a branch display\]

### 6.3 The badge ladder (built in, recognition only)

Ten badges are computed from the measures the engine already holds. Each person's page shows their whole ladder, earned or not, with the reason beside every badge, so the next badge is always visible. A 100% record needs at least five events before it counts. **No badge changes a payout.**

| Badge | Earned when | Audience |
| --- | --- | --- |
| 🥇 Monthly champion | first in role across the group at month close | group, MD email |
| 🔥 Streak | on pace for three consecutive weeks | person, weekly message |
| 🎯 Sharpshooter | conversion at or above 30% for the month | Sales, CRE |
| 🛡 Discount guardian | no bill above 12% all month | Sales |
| 📦 Clean sheet | 100% damage-free deliveries in the month | Logistics |
| 📞 Never missed | 100% follow-ups on time | CRE |
| 📑 Zero error | 100% documentation accuracy | Back office |
| ✨ Spotless | perfect attendance and punctuality | everyone, HR email |
| 🌟 Five stars | branch Google rating at or above 4.5 with 2+ reviews per 10 bills | branch |
| 🤝 Full house | branch earns the team pool | every member |

**Where badges appear.** On the individual lens as the *Badge ladder* card; on every leaderboard row and in the branch table as icons (hover for the rule); in the personal WhatsApp summary as a 🏅 line; and on the group lens as the *Badge wall*, which lists this month's holders of each badge. If leadership wants a prize attached, the ledger in 🛠 Admin → Adjustments is the place to add it with an approver.

&#91;image: The badge wall on the group lens: holders of each badge so far this month\]

&#91;image: A CRE's badge ladder: earned badges in colour, the rest with what is still needed\]

&#91;image: The Sales leaderboard with the badges column\]

> ⚠️ **Policy rule.** Gamification never changes a payout. Medals, arrows and badges are recognition; the rupees come only from the scorecard, the per-bill rules, the pools and approved adjustments.

## 📣 7. Messages centre

> 📌 **Sticky note.** Every audience × cadence × channel exists. The starred cells are hand-tailored templates; the rest come from one digest engine. All of them read the same figures as the board, so nobody receives a number the board does not show.

&#91;image: The messages matrix: audience down the side, daily / weekly / monthly across, WhatsApp or email\]

### 7.1 The matrix

| Audience | Daily | Weekly | Monthly |
| --- | --- | --- | --- |
| 🧑 Every employee | digest | digest | ★ personal summary |
| 🛍 Sales team | ★ via the SM message | ★ weekly team message | digest |
| 📞 CRE team | digest | ★ weekly CRE message | ★ monthly CRE message |
| 🚚 Logistics team | digest | ★ weekly team message | digest |
| 🗂 Back office team | digest | ★ weekly team message | digest |
| 👥 Sales Manager | ★ daily team message | digest | digest |
| 🏬 Branch Manager | ★ daily branch message | ★ weekly branch review (email) | branch review |
| 👑 MD and Directors | group review | group review | ★ monthly group review (email) |
| 🫶 HR team | HR review | HR review | ★ monthly HR and payroll review (email) |

Each cell is available as WhatsApp text (bold and italic in WhatsApp markup) and as an inline-styled HTML email that renders in Gmail and Outlook.

### 7.2 The send calendar

| When | Message | Channel | Recipients |
| --- | --- | --- | --- |
| Every evening 21:00 | Daily SM message, daily BM message | WhatsApp | each SM, each BM |
| Monday 08:00 | Weekly branch review | Email | each BM with the SM in copy; group version to leadership |
| Saturday 19:00 | Weekly Sales, CRE, Logistics and Back office messages | WhatsApp | each team group |
| 16th | MD mid-month preview | Email | MD and Directors |
| 1st 08:00, after reconciliation | Personal summaries, monthly CRE message, MD monthly review, HR and payroll review | WhatsApp and email | every employee, CRE groups, MD, Directors, HR |

### 7.3 What each tailored message carries

- **Personal summary**: expected incentive, target position and chance, scorecard and rank, what is going well, what lags with the rupees at stake, the pushes, the provisional-until-delivered note.
- **Daily SM**: today's bookings and walk-ins against yesterday, month position, the sales leaderboard with medals and movement since yesterday, the day's attention points, tomorrow's pushes priced per person, the SM's pool status.
- **Daily BM**: today's bookings, bills and collections, month position and GP, rank among the company's branches, one line per team, attention points, tomorrow's load, the BM's pool position.
- **Weekly Sales**: bookings and bills against last week, conversion, discount, margin, upsell and cross-sell, per-bill incentive booked and forfeited, leaderboard, leakages, next week's pushes.
- **Weekly CRE**: walk-ins logged, follow-ups due and on time, conversions with override earned, leaderboard with follow-up bonus status, misses, whether the full bonus is still reachable.
- **Weekly Logistics**: deliveries, on-time, damage-free and promises-communicated rates, leaderboard, misses by person, deliveries due next week, the reminder that a late or damaged delivery can cancel the sale.
- **Weekly Back office**: dues and on-time collection, documents and error-free rate, calls on time, audit and neatness, leaderboard, misses, from the 24th the month-end reconciliation duty.
- **Weekly BM email**: SO booked this week against last, month-to-date and projection, branch score and rank with movement, the company branch leaderboard, the branch's team leaderboards, attributes that improved or slipped, up to four actions, the BM's payout position.
- **Monthly MD email**: group achievement, GP, score and outlay as a share of SO value, Meubel Grande against Royal Group, the group branch leaderboard, top three per role, every BM's pool status, outlay by role, policy health, a watch list, a numbered approval list.
- **Monthly HR email**: attendance and punctuality by branch, people to act on, punctuality leaderboard, regularisations and disputes from the ledger, payroll input by role, the handover action list.

&#91;image: A weekly BM email previewed as the HTML itself\]

&#91;image: A weekly team WhatsApp message in the messages centre\]

&#91;image: An employee's WhatsApp summary at the foot of the individual lens\]

### 7.4 Procedure: generate and send a message by hand

1. Open 📣 Messages. Pick the audience, cadence and channel in the matrix.
2. Pick the branch (or the person for the personal summary) from the tabs above the preview.
3. Read the preview. WhatsApp shows the exact text; email shows the rendered HTML.
4. **Copy message** copies the text (or the rich HTML for email; **Copy subject** and **Copy as text** sit beside it). **Open in WhatsApp** opens a wa.me draft.
5. **Copy all branches** (or **Copy all people** on a team lens) copies every message of that cell at once, separated by a line, for pasting into the groups.

### 7.5 Procedure: schedule the sends

1. In 🛠 Admin → Wirings set *WhatsApp Business API* and *Email* to **sandbox**, enter the endpoint and the name of the secret held in the server vault, and press **Test**.
2. In 🛠 Admin → Jobs and status check that each send job shows the schedule above and press **Run now** on one to confirm delivery to a test number.
3. Switch the channel to **live**. The jobs then run on schedule; every run is written to the audit log.

> 🔍 **Lens.** The daily SM and BM messages are the programme's heartbeat. If the branch does not read them in the evening, the weekly and monthly messages arrive too late to change the month.

## ⚙️ 8. Settings manual for administrators

> 📌 **Sticky note.** Settings change the rules for everyone the moment they are saved, and every number on the board re-computes. Change values in a draft policy version, get it approved and communicated, then make it live (section 10.1). Never edit a live month to fix one person; that is what the adjustments ledger is for.

&#91;image: Settings: pools and gates, policy bands, weights, targets, prediction constants and data inputs on one page\]

### 8.1 Who may edit

Super Admin and Admin edit. Consultants see every value read-only. Client roles do not see the page.

### 8.2 The panels

| Panel | Fields | Notes |
| --- | --- | --- |
| 💰 Pools and gates | Sales, CRE, Logistics, Back office pools; BM, SM and BI pools; team pool; CRE follow-up bonus; attendance gate (85); management gate (90); team-pool achievement (100) and audit (70) | monthly rupees and percentages |
| 🧾 Policy bands | category thresholds and rates (A ₹60,000 at 0.8%, B ₹25,000 at 0.5%, C 0%); discount bands and shares (12 / 20 / 30% at 100 / 60 / 40%); closing-ratio tiers (30% +10%, 20% +5%); CRE override 10%; follow-up thresholds (95% full, 85% half) | a bill above the last band pays nothing |
| ⚖️ Scorecard weights | one column per role, every attribute weight | the live total must read 100 / 100 in green or the panel refuses to save |
| 🎯 Attribute targets and limits | the target for every attribute in section 4.1 | *down* attributes take a ceiling |
| 🔮 Prediction constants | delivered-pending 0.95, booked 0.85, projected 0.50, spread 0.22 | recalibrate after three real months |
| 📥 Data inputs | one row per source: sample, upload or link | section 9 |
| 👥 Users | add and remove logins | Super Admin only, section 3 |

&#91;image: Scorecard weights: every role's column with its live total\]

### 8.3 Procedure: change a pool, gate, band or target

1. Sign in as Admin or Super Admin and open ⚙️ Settings.
2. Edit the field. The board re-computes at once; open any lens to see the effect before saving.
3. Press **Save** to keep the values in the browser (in production, in the settings table with the audit trail).
4. Press **Copy JSON** and paste the text into the change request or the policy version's note, so the approver sees exactly what changed.
5. Go to 🛠 Admin → Policy versions and press **Save current settings as a new version** (section 10.1).

### 8.4 Procedure: change scorecard weights

1. In **Scorecard weights** pick the role's column.
2. Move points between attributes; the total at the top of the column turns red while it is not 100.
3. When every column reads 100 / 100, save.
4. Open a person of that role and confirm the scorecard still reads sensibly: a weight of zero removes the attribute from their page.

### 8.5 Procedure: export, import and reset

- **Copy JSON** copies the whole configuration (pools, gates, bands, policy, prediction constants, weights, targets).
- **Paste** or **Upload** restores a configuration from that JSON. Use it to move a tested configuration from the sandbox to the live server.
- **Reset to policy defaults** returns every value to the 19 September 2026 draft. Super Admin only; the reset is written to the audit log.

### 8.6 Procedure: rehearse a month

1. Set *as of* to 1 and read the group lens: chance near 50% everywhere, wide bands.
2. Step to 10, 20 and 31 and watch the bands narrow and the pools open or close.
3. At 31 open 📣 Messages → MD monthly email: it reads as the closed month for approval.

> ⚠️ **Policy rule.** The payment rule (paid only on delivery and payment, nothing on cancellation) and the attendance gate's effect (scorecard pay to zero) are in the engine, not in Settings. Changing them is a policy change that needs a new build and a new policy version.

## 📥 9. Data inputs: CSV, link and API

> 📌 **Sticky note.** Every source has three modes: **sample**, **upload** and **link**. Uploaded rows replace the sample only for the people or branches they name, so a branch can go live one source at a time. The first two columns of every file are mandatory; the rest may be blank.

&#91;image: Data inputs: one row per source with mode, template, upload, link and status\]

### 9.1 Matching people and branches

Rows name people by the roster name or id and branches by name. Press **Copy roster** on the panel to get `id,name,role,branch,company` for every person and paste it into the source system's export mapping. A row that names nobody on the roster is ignored and counted in the status line, so check the count after every upload.

### 9.2 The sources

| Source | Columns | Example row | Feeds |
| --- | --- | --- | --- |
| Sales targets | employee, target | Anjali R., 850000 | achievement, branch target |
| Orders / bills | employee, order\_no, day, item, list\_price, discount\_pct, status, deliver\_day, pay\_day, cancel\_day, margin\_pct, upsell, cross, review, commitment\_ok, cre, offer, reason | Anjali R., KLM-1041, 2, Verona L-shape sofa, 140000, 10, paid, 9, 11, , 32, 1, 0, 1, 1, Meera S., 0, | SO value, per-bill incentive, conversion, discount, margin, upsell, cross-sell, reviews, commitments, CRE override |
| Customers attended | employee, day, count | Anjali R., 2, 4 | conversion, customers attended |
| Attendance punches | employee, day, status (p present, l late, e early going, a absent, o weekly off) | Anjali R., 3, l | attendance, late, early, gate |
| Walk-ins | branch, day, count, cre | Kollam, 2, 9, Meera S. | walk-out ratio, walk-ins logged |
| CRM follow-ups | cre, day, on\_time, communicated | Meera S., 4, 1, 1 | follow-ups on time, follow-up bonus, commitments |
| Delivery log | employee, day, on\_time, damage\_free, communicated | Suresh N., 5, 1, 1, 1 | on-time, damage-free, commitments |
| Collection register | employee, day, on\_time | Arun V., 6, 1 | on-time collection |
| Documentation log | employee, day, ok | Arun V., 6, 1 | documentation accuracy |
| Customer call log | employee, day, on\_time | Arun V., 6, 0 | calls on time |
| Branch audit, neatness, Google, last-month discount | branch, audit\_score, neatness, google\_rating, last\_month\_discount | Kollam, 88, 4.4, 4.6, 14.5 | audit, neatness, rating, discount trend |
| Activities planned / done | branch, employee, day, name, done | Kollam, , 12, Society activation, 1 | activities done vs planned |
| Customer appreciations | employee, day | Anjali R., 9 | appreciations |
| Grooming and neatness audit | employee, grooming, neatness | Anjali R., 4.5, | grooming, neatness |

`status` on an order is one of booked, delivered, paid or cancelled; `offer` 1 marks an offer-price bill, which the policy puts in category C; `cre` names the CRE who logged the walk-in so the override can be paid. Days are the day of the month (1 to 31).

### 9.3 Procedure: upload a CSV

1. Open ⚙️ Settings → Data inputs and find the source's row.
2. Press **Copy template**: the column header and an example row land on the clipboard. Fill it from the source system (CSV or JSON, UTF-8).
3. Choose the file in **Upload**. The status line reads, for instance, *42 punches applied*, and the mode turns to **upload**.
4. Open a person named in the file and confirm the attribute changed.
5. Any later upload of the same source replaces the earlier rows for the people it names.

### 9.4 Procedure: connect a link or API

1. Set the mode to **link** and paste the URL that returns the same columns (CSV or a JSON array of objects).
2. Press **Fetch now**. On the hosted board the fetch runs and the status line shows the row count; in the artifact sandbox outside calls are blocked, so fetch only works once the page is on the group's server.
3. For a scheduled feed, add the system in 🛠 Admin → Wirings with its auth and schedule (section 10.3). The schedule is every 15 minutes for orders and walk-ins, hourly for attendance and deliveries, nightly for the rest.

### 9.5 Procedure: return a source to sample

Set the mode back to **sample**. The generated data returns for that source only; the audit log records the switch.

> 🔍 **Lens.** The 🧭 Total view and 🛠 Admin → Jobs both show *sources on sample*. The programme is live when that count is zero.

## 🛠 10. Admin console

> 📌 **Sticky note.** The console is the back-end entry and status window. Six tabs: Policy versions, Adjustments, Wirings, Jobs and status, Month close, Audit log. Super Admin and Admin edit; the consultant team reads. Everything done here is written to the audit log with who and when.

### 10.1 Policy versions

&#91;image: Policy versions: the live rule set and the ones waiting, with their workflow state\]

A policy version is a snapshot of every Settings value with a name, a note and a state. The workflow is **Draft → Under review → Approved → Communicated → Live**. *Make live* applies the version to the whole board and is refused until the version is approved and marked communicated, because the policy says no rule takes effect before it is communicated to the teams.

**Procedure: publish a rule change**

1. Make the change in ⚙️ Settings (section 8).
2. In Policy versions press **Save current settings as a new version**; give it a name such as *November 2026 pools* and a note saying what changed and why.
3. Move it to **Under review** and share the JSON with the approver.
4. On approval move it to **Approved**; after the teams have been told, tick **Communicated** (the date is recorded).
5. Press **Make live**. The previous live version becomes history and can be reloaded to inspect it.
6. If a change must be undone, load the previous version and make it live again by the same route.

### 10.2 Adjustments ledger

&#91;image: Adjustments: manual additions and deductions, exemptions, approvals, disputes and regularisations\]

Each entry has a type, the employee, an amount where relevant, a reference, a reason, the requester, the approver and a status (Pending, Approved, Rejected).

| Type | Effect when approved |
| --- | --- |
| Addition | added to the person's expected total on the board and in their messages |
| Deduction | subtracted likewise |
| Clawback exemption | a cancellation after advance keeps its per-bill incentive |
| Discount approval above 30% | the bill is marked approved; the forfeit stands unless an addition is also approved |
| Dispute | logged against the statement; resolved inside the 7-day window |
| Attendance regularisation | the day is marked present for the gate and the attendance score |

**Procedure: raise and approve an adjustment**

1. Press **New entry**, choose the type, the person and the amount, paste the reference (ticket, email or bill number) and the reason.
2. The entry is Pending. Pending items block the *Adjustments* step of month close.
3. The approver (a different user from the requester) opens the row and presses **Approve** or **Reject**. The board re-computes at once.
4. Approved entries appear on the person's page as *adjustments* and in the HR monthly email.

### 10.3 Wirings

&#91;image: Wirings: every integration with mode, endpoint, auth, secret name, schedule and last run\]

| Wiring | Kind | Feeds | Auth | Schedule |
| --- | --- | --- | --- | --- |
| Billing / ERP | data | orders, customers attended, targets | API key | every 15 minutes |
| CRM / enquiry register | data | walk-ins, follow-ups, appreciations | OAuth | every 15 minutes |
| Biometric attendance | data | attendance punches | Basic | hourly |
| Delivery app | data | delivery log | API key | hourly |
| Accounts | data | collection register, documentation, customer calls | API key | nightly |
| Google Business Profile | data | rating and reviews per branch | OAuth | nightly |
| Audit and activity sheets | data | audit score, neatness, grooming, activities | link | nightly |
| WhatsApp Business API | channel | every WhatsApp message | bearer token | per job |
| Email (SMTP / API) | channel | BM weekly, MD monthly, HR monthly, statements | SMTP password | per job |
| Single sign-on | auth | logins for every role | OIDC | on login |

Each wiring has a mode (**not connected**, **sandbox**, **live**), an endpoint, the auth type and the **name of the secret** held in the server vault. ⚠️ The secret itself is never typed into the board.

**Procedure: connect a system.** Set the mode to sandbox, enter the endpoint and the secret name, press **Test** (the result and time are recorded), press **Save**, watch two scheduled runs in Jobs and status, then switch to live.

### 10.4 Jobs and status

&#91;image: Jobs and status: live feeds, channels, sources on sample, pending adjustments, policy state, and the scheduled jobs\]

The tiles at the top are the programme's health check: live feeds out of seven, channels on, sources still on sample, pending adjustments, the live policy version and the audit count. Below, every scheduled job (each sync, the recompute, each message run, month close) with its state, last run and result, and **Run now** on the syncs.

### 10.5 Month close

&#91;image: Month close: the nine-step checklist, each tick logged\]

1. Freeze the month: no back-dated edits after the 1st 09:00.
2. Accounts reconciles orders, collections and attendance against the sources.
3. Adjustments ledger: every pending item approved or rejected (blocked while any is pending).
4. Statements generated and sent to every employee.
5. Confirmations collected; disputes window open 7 days.
6. Disputes resolved and logged.
7. MD approval email sent and approved.
8. Payout file handed to payroll.
9. Any rule change for next month communicated to all teams.

Each tick records who and when. The HR monthly email and the MD monthly email are generated between steps 2 and 7.

### 10.7 Archive, statements and payout file

The bar under the checklist carries the three outputs of a close:

1. **Statements for every employee** fills a print view with one page per person (every component with the rule behind it, the 7-day dispute window, signature lines) and opens the browser's print dialog. Choose *Save as PDF* for the files that go out, or print. **Statement** on any person's page prints that one person's.
2. **Payout file (CSV)** downloads one row per employee with employee id, role, branch, attendance, gate, score, scorecard pay, per-bill confirmed and provisional, CRE override, follow-up bonus, team pool share, adjustments, total confirmed, total expected, group rank and badges. This is the hand-over to payroll in step 8.
3. **Archive into history** opens on the last day of the month. It snapshots every branch and every person, including each branch's mid-month projection, so that ⚙️ Settings → Prediction constants can show the spread observed between projection and outcome. After three real closes, set the spread constant from that figure.

The **Export ledger (CSV)** button on the Adjustments tab gives the auditor the same ledger as a file.

&#91;image: A printed statement: components with their rules, the dispute note and signature lines\]

**History cards.** The group lens, every branch lens and every person's page carry a history card with the archived months and the running month marked. Until the first real close the cards show three generated sample months, flagged *sample*.

&#91;image: A person's history card: score, achievement, incentive and badges by month\]

### 10.6 Audit log

&#91;image: Audit log: every save, upload, user change, policy move, adjustment, wiring change, job run and close-step tick\]

Newest first, with a copy button for the auditor. In this preview the console keeps its state in the browser so the flows can be rehearsed end to end; in production it is the server-side admin app over the same tables, and the log is append-only.

> 🔍 **Lens.** Before any client review open Jobs and status: if the tiles are green and the pending count is zero, the numbers on every other page can be trusted.

## 📅 11. Operating rhythm

> 📌 **Sticky note.** The programme runs itself once the wirings are live. The humans in the loop are the SM and BM every evening, Accounts on the 1st, HR in the dispute window and the MD at approval.

### Every day

| Time | What happens | Who acts |
| --- | --- | --- |
| every 15 minutes | Billing / ERP and CRM sync; recompute | nobody |
| hourly | Biometric attendance and delivery app sync | nobody |
| through the day | people open their own page; managers open their branch | everyone |
| 21:00 | Daily SM WhatsApp and daily BM WhatsApp go out | SM and BM read, act on tomorrow's pushes |
| night | Accounts, Google Business Profile and audit sheets sync | nobody |

### Every week

| Day | What happens | Who acts |
| --- | --- | --- |
| Monday 08:00 | Weekly BM email with the leaderboards and four actions | BM with the SM in copy; Directors read the group version |
| Saturday 19:00 | Weekly Sales, CRE, Logistics and Back office WhatsApps | team groups |
| any day | Admin reviews pending adjustments and the Jobs tiles | Admin |

### Every month

| Date | What happens | Who acts |
| --- | --- | --- |
| 1st 08:00 | Personal summaries, monthly CRE message, MD monthly review, HR and payroll review | everyone receives |
| 1st 09:00 | Freeze; month close checklist opens | Admin |
| 1st to 3rd | Accounts reconciles; adjustments approved or rejected | Accounts, approver |
| 3rd | Statements sent to every employee | Admin |
| 3rd to 10th | 7-day dispute window; disputes logged in the ledger | HR, BM |
| 10th | MD approval email; payout file to payroll | MD, Admin, payroll |
| 16th | MD mid-month preview | MD, Directors |
| before the 1st | any rule change for next month approved, communicated and made live | Admin, MD |

> 🔍 **Lens.** Jobs and status is the one page that shows whether the rhythm is being kept: a job with no *last run* on the day it should have run is the first thing to fix.

## 👑 12. Top management quick guide

> 📌 **Sticky note.** Three numbers a month are enough: group achievement, outlay as a share of SO value, and the number of branches under 85%. Everything else on the board explains those three.

### What the MD reads

| When | Where | Read | Decide |
| --- | --- | --- | --- |
| any day | 🌐 Group lens | achievement, chance, branches under the gates, group lags | which Director to call |
| 16th | MD mid-month email | projection, watch list of branches heading under 85% | interventions with two weeks left |
| 1st | MD monthly email | the closed month, outlay by role, policy health, the approval list | approve the payout, or send items to the ledger |
| before a rule change | 🛠 Admin → Policy versions (via Admin) | the JSON diff and the note | approve the version |

### What a Director reads

| When | Where | Read | Decide |
| --- | --- | --- | --- |
| Monday | the group version of the weekly BM email | company branch leaderboard with movement | which branch to visit this week |
| any day | 🏢 Company lens | branch pushes priced per day; company lags | where to put the week's attention |
| 1st | MD monthly email (copied) | Meubel Grande against Royal Group | the month's review agenda |

### What HR reads

| When | Where | Read | Decide |
| --- | --- | --- | --- |
| 1st | HR and payroll email | people under the attendance gate, chronic late or early, spotless attendance, grooming under 4 | warnings, recognitions, regularisation requests |
| 3rd to 10th | 🛠 Admin → Adjustments (via Admin) | disputes and regularisations with status | resolve inside the window |
| any day | 🏆 Leaderboard → Management | BM and SM pool status | coaching conversations |

### Five questions the board answers in under a minute

1. **Will we make the month?** Group lens, headline tile: expected against target, with the chance.
2. **What will it cost?** MD email or 🧭 Total: outlay and its share of SO value, by role.
3. **Which branch needs me?** Company lens: the lowest bar, and whether it is falling (▼) or climbing (▲).
4. **Is discount discipline holding?** Policy health: bills above 30%, forfeits to the 60% and 40% bands, discount against GP.
5. **Who should be recognised?** Leaderboard medals, top three per role, spotless attendance in the HR email.

### What top management should never do on the board

- Change a weight or a pool mid-month to help one branch; use the ledger with an approver.
- Read a chance on the 5th as a forecast; it is a wide band until mid-month.
- Treat a provisional per-bill figure as earned; it is paid only on delivery and payment.

> 🎮 **Gamification for leaders.** The most powerful recognition on the board is free: a Director quoting a branch's ▲ movement or a new badge in the Monday call. The badge wall on the group lens lists this month's holders by name.

## ❓ 13. FAQ

**Why does my expected incentive change during the day?** Every sync re-computes the projection. A bill booked at 11:00 raises the expected SO value at the next 15-minute sync; a late punch lowers the attendance score at the next hourly sync.

**My bill shows a lower incentive than the rate says.** Check the discount band. A 15% discount keeps 60% of the incentive, 25% keeps 40%, above 30% keeps nothing. The bill row on your page shows the band and the forfeited amount.

**The bill is delivered. Why is it still provisional?** The policy pays on delivery and payment. Until Accounts records the payment the bill counts at 95%.

**Why is my scorecard pay zero?** Attendance is under 85% for the month. The gate lifts as soon as the month's attendance climbs back over 85%, or when HR approves an attendance regularisation in the ledger.

**The branch is at 101% but the team pool shows closed.** The audit score is under 70. Both conditions are needed.

**The BM pool shows closed at 89%.** The management pool opens at 90% of branch target. The branch lens shows the rupees per day needed to cross it.

**Why did my rank fall when my score rose?** Rank is relative. Others rose more. The movement arrow compares with seven days earlier on the board and with yesterday in the daily message.

**Can a BM see another branch?** No. Scope is enforced; the selector bar offers only the BM's branch. Directors and the MD see all branches.

**Who can change a weight or a pool?** Admin and Super Admin in ⚙️ Settings, then through a policy version that is approved and communicated before it goes live.

**How do I correct a wrong punch or a wrong bill?** Not on the board. Correct it in the source system (biometric, ERP) and the next sync picks it up; or raise an adjustment or regularisation in the ledger with a reference.

**The WhatsApp message and the board show different figures.** They never should: both read the same engine. Check the *as of* time in the message header against the board's last sync; a message sent at 21:00 is a snapshot of that moment.

**Fetch now does nothing.** In the artifact sandbox outside calls are blocked. On the group's own server the fetch runs; see section 9.4.

**Can we add an attribute?** Yes. It needs a source column, a target, a weight in each role that uses it and a rebalance of that role's column to 100. Raise it with the Bpro team; it ships as a new build and a new policy version.

**Where is the data kept?** In production, on the group's server in the tracker tables. The sample build keeps settings and the admin console state in the browser so the flows can be rehearsed.

**Is the 120% cap on the scorecard a bonus?** Achievement above target keeps earning scorecard points up to 120%, so a person at 115% of target earns more scorecard pay than one at 100%. Every other attribute caps at 100%.

## 🤔 14. RAQ: rarely asked questions

**What happens on the 31st at 23:59?** Nothing dramatic. The projection equals the booked figure, the chance is 0% or 100%, and the month stays open for edits until the freeze at 09:00 on the 1st.

**Why October 2026 in the sample?** The policy draft is dated 19 September 2026; the first full month it could run is October. The slider replays that month so every message can be rehearsed on a realistic calendar.

**Is the sample data random?** It is generated from a fixed seed, so every reload shows the same people and figures. Nobody in it is real.

**Can two people share a bill?** Not in the policy draft. A bill has one salesperson; the CRE who logged the walk-in earns the override from the company, not from the salesperson's share.

**What if a CRE converts a walk-in that was never logged?** No override. The weekly CRE message lists *walk-ins not logged under a CRE* for exactly this reason.

**Does a cancellation hurt Logistics?** Indirectly. A late or damaged delivery that leads to a cancellation removes the sale from Sales and the override from the CRE; the Logistics scorecard takes the on-time or damage miss. The weekly Logistics message carries that reminder.

**Why 22% as the spread?** A placeholder from the sample's own variability. After three real months it should be set from the observed spread of mid-month projections against closed months.

**Can the board run without Google reviews?** Yes. Set the branch source to sample or leave the column blank; the attribute scores at its default and the Total view flags the source as not connected.

**What does the consultant team see that the MD does not?** The 🧭 Total view and the 🛠 Admin console: data feeds, wirings, policy versions, the ledger and the audit log. The MD sees the outcomes; Bpro sees the plumbing.

**Could a branch game the walk-out ratio?** Only by logging fewer walk-ins, which lowers the CRE's own *walk-ins logged* score and shows up as unlogged walk-ins in the CRE message. The attributes are chosen to pull against each other.

**Is dark mode just cosmetic?** Yes. The theme toggle in the header changes colours only.

**Can we have the leaderboard on a TV in the branch?** The 🏆 Leaderboard at branch scope is a single page that refreshes with every sync; sign in a display user with the BM role and leave it open.

**Who wrote the policy rules into the engine?** Team Bpro, from the Corporate Incentive Structure draft, with every value exposed in Settings so that leadership, not the code, owns the numbers.

## 📌 15. Sticky notes, troubleshooting, glossary, version history, colophon

### The ten sticky notes

1. 📌 One engine, one figure: board, message and statement never differ.
2. 📌 Scorecard pay = pool × score ÷ 100. Attendance under 85% makes it zero.
3. 📌 Per-bill incentive is paid on delivery and payment only. Cancellation pays nothing.
4. 📌 Discount bands: 12% full, 20% at 60%, 30% at 40%, above 30% nothing.
5. 📌 Management pool opens at 90%; team pool at 100% with audit 70.
6. 📌 The chance is a band that narrows every day; do not read it as a forecast before mid-month.
7. 📌 Scope is enforced; the selector bar only offers what the role may open.
8. 📌 Rules change through a policy version: approved, communicated, then live.
9. 📌 Corrections go to the source system or the ledger, never to a Settings field.
10. 📌 Jobs and status green and pending adjustments zero = the numbers can be trusted.

### Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| A person is missing from a team | not on the roster, or role spelt differently | fix the roster export; press **Copy roster** to see the ids the board knows |
| Upload says *0 applied* | names do not match, or the first two columns are missing | use the template header; match names to the roster |
| A weight column refuses to save | total is not 100 | rebalance until the total reads 100 / 100 in green |
| Make live is refused | version not approved or not marked communicated | complete the workflow in Policy versions |
| Month close step 3 is blocked | pending items in the ledger | approve or reject each one |
| Fetch now fails | page is in the sandbox, or endpoint or secret name wrong | host on the group's server; test the wiring in Admin |
| A message shows yesterday's figures | the send ran before the last sync | check the job order in Jobs and status; the sync runs first |
| The board looks empty after a reset | the browser state was cleared | Super Admin resets to policy defaults; re-upload or re-fetch sources |
| Figures look odd after a settings change | a draft value is being tried | load the live policy version to compare; the audit log shows what changed |

### Glossary

| Term | Meaning |
| --- | --- |
| SO value | sale order value booked, net of discount |
| Achievement | SO value ÷ target, pro-rated to the day for the scorecard |
| Attainment | an attribute's value against its target, 0 to 100% (achievement to 120%) |
| Scorecard | the weighted sum of attainments, out of 100 |
| Pool | the monthly rupee amount a role's scorecard is paid against |
| Gate | a condition that closes a payout: attendance 85, management 90, team pool 100 and audit 70 |
| Band | a discount range with the share of per-bill incentive it keeps |
| Category | a bill's list-price class: A, B or C, each with a rate |
| Override | the CRE's 10% of the sales incentive on walk-ins they logged |
| Provisional | counted at a probability until delivered and paid |
| Chance | probability that the projection lands above target |
| Push | an action priced in rupees |
| Lag | an attribute costing points, priced in rupees |
| Movement | rank now against seven days earlier (board) or yesterday (daily message) |
| Ledger | the adjustments register in the Admin console |
| Policy version | a named snapshot of every Settings value with a workflow state |
| Wiring | an integration: data feed, channel or sign-on |
| BM, SM, BI, CRE | Branch Manager, Sales Manager, Branch In-charge, Customer Relationship Executive |

### Version history

| Version | Date | What changed |
| --- | --- | --- |
| 1.0 | 3 October 2026 | first release of the manual, matching the sample build with roles, Total view, Admin console, messages matrix and data inputs |
| 1.1 | 3 October 2026 | board audit fixes (document skeleton, stale-state sanitiser, labels, workflow); badge ladder and badge wall built in; manual section 6.3 updated |
| 1.2 | 3 October 2026 | month history and archive, printable statements, payout file and ledger exports, leaderboard export and TV mode; manual sections 5.3, 6.2 and 10.7 |

### Colophon

&#91;image: Bpro\]

**Incentive board: settings manual cum user manual.** Designed and developed by **Dr. Babu B.**, Team Bpro Consulting & Technologies, for Meubel Grande and Royal Group. [www.drbabu.in](https://www.drbabu.in) · [www.bpropms.com](https://www.bpropms.com). Screenshots are from the sample build of 3 October 2026; names, branches and figures are generated. The policy values quoted are the 19 September 2026 draft's placeholders until leadership confirms them in Settings.

> 🎮 **Last note.** A programme people check every evening beats a policy people read once a year. The board exists to make the second into the first.
