# Wasiyyah — Islamic Wills for England & Wales

Wasiyyah is a web application that produces a last will and testament in the Qur'anic
(fara'id) shares, drafted for the law of England & Wales, from a short guided interview
(typically 12–18 questions).

**Live:** https://wasiyyahwills.com

## Status

- ✅ Live in production at wasiyyahwills.com (VPS, PM2 + nginx + Let's Encrypt), with a
  nightly database backup on the server (see Deployment → Backups)
- ✅ Unit suite green: 66 tests — engine golden cases and invariants, the interview's
  pruning rules checked against the engine for 20,000 random families, and the email sender
- ✅ Browser end-to-end suite green locally (50 checks: interview, shares, document, paid
  pack, mirror will, password reset, data export, account deletion)
- ✅ **Email is switched on** (2026-11-16). Password-reset emails go through our own Postal
  mail server and Amazon SES (see Deployment → Email); a reset email sent from the live
  site was accepted by both. The contact address on the site, the will and the reset
  email is `hello@wasiyyahwills.com`.
- ⏳ Not yet reviewed by a solicitor (will wording, terms) or a scholar (fiqh). The site
  now says so; the open questions for each are listed in "Open questions for review" below.
- ✅ **Payments are switched on** (2026-11-16) through Wasiyyah's own Stripe account. The
  server's `.env.local` holds a restricted key (one permission, Checkout Sessions: write)
  as `STRIPE_SECRET_KEY` and the webhook's signing secret as `STRIPE_WEBHOOK_SECRET`; the
  webhook sends `checkout.session.completed` to
  `https://wasiyyahwills.com/api/stripe/webhook`. Checkout offers card, Apple Pay and Link.
  If the code ever makes another kind of Stripe call, the key needs that permission added.
- ⏳ Recommended before heavy marketing: one-time solicitor review of the templates
  and scholar review of the fiqh (the engine's rule trace exists to make this easy)
- 🔎 The domain is `wasiyyahwills.com` (2026-11-16); the research behind the choice is in
  [DOMAINS.md](DOMAINS.md)

## How it works

1. **Guided interview** — a dynamic decision tree. The Islamic exclusion rules (hajb)
   prune questions as you answer: if you have a son, you are never asked about siblings,
   because they cannot inherit.
2. **Fara'id engine** — computes the Qur'anic shares with exact fraction arithmetic
   (never floating point) and produces a rule-by-rule trace citing the basis of every
   share. Where the four Sunni schools differ, the Hanafi position is applied and the
   trace says so.
3. **Document generation** — a print-quality will drafted for England & Wales
   (Wills Act 1837 execution formalities), with step-by-step signing instructions,
   plus (premium) the executor guidance pack, estate-alignment checklist and letter
   of wishes.

## Plans & monetization

- **Free — Essential Will.** The complete interview, the full fara'id calculation with
  explanations, and a valid basic will: executor appointment, guardianship of minors,
  Islamic burial wishes, and distribution of the residue per fara'id, plus signing
  instructions. One will per account. Genuinely valid, genuinely free.
- **Premium — Complete Will Pack (£39, one-time).** Everything in Free, plus:
  charitable/wasiyya bequests (with the one-third cap enforced), the religious-debts
  schedule (unpaid zakat, fidya, kaffarah, hajj), a letter of wishes, the executor
  guidance pack, the estate-alignment checklist (joint tenancy severance, pension and
  life-insurance nominations), a mirror will for your spouse, and unlimited wills &
  updates.

Payments are one-time via Stripe Checkout. No subscription. In development without
Stripe keys, the upgrade is simulated so the full flow remains testable.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **PostgreSQL** via `pg` (no ORM) — schema in [`migrations/`](migrations/)
- **Auth**: email + password (bcrypt), server-side sessions in Postgres, httpOnly cookies
- **Stripe** Checkout (one-time payment): webhook fulfilment + success-page
  verification fallback
- **Vitest** — engine golden cases from classical texts + randomized invariants
- **Playwright** — browser E2E driving the real signup → interview → document flow

## Repository layout

```
src/lib/faraid/     fara'id engine (pure TypeScript, no dependencies)
  fraction.ts       exact rational arithmetic (BigInt)
  engine.ts         shares, hajb, 'awl, radd, rule trace
  engine.test.ts    golden cases + invariants
src/lib/
  document.ts       E&W will clauses + signing/executor/estate packs
  will-types.ts     interview data model + solicitor-flag rules
  db.ts, auth.ts, stripe.ts
src/app/            routes: marketing, auth, dashboard, wizard, document, APIs
src/components/     wizard steps, share-preview chart, site chrome
migrations/         SQL schema migrations
tests/e2e.mjs       Playwright end-to-end walkthrough
deploy/             nginx config + deploy script
PLAN.md             original product/architecture plan
DOMAINS.md          domain-name availability research
```

## Development

```bash
pnpm install
createdb wasiyyah_dev
psql wasiyyah_dev -f migrations/001_init.sql
psql wasiyyah_dev -f migrations/002_account_security.sql   # consent + password resets
cp .env.example .env.local   # then fill in values
pnpm dev                     # http://localhost:3000
pnpm test                    # unit suite: engine + interview (vitest)

# end-to-end (uses your installed Chrome). It needs the development server — it relies on
# the simulated upgrade and the dev-only reset link — and refuses to run against anything
# but localhost, because it creates and deletes an account:
pnpm dev -p 3100 &
pnpm test:e2e                # screenshots land in tests/shots/
```

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | random 32+ bytes for session token hashing |
| `STRIPE_SECRET_KEY` | Stripe API key (optional in dev — upgrade simulated) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | optional pre-created Price (ad-hoc GBP price used if unset) |
| `PREMIUM_PRICE_PENCE` | pack price in pence (default 3900) |
| `NEXT_PUBLIC_APP_URL` | canonical URL, e.g. `https://wasiyyahwills.com` |
| `POSTAL_API_KEY` | Wasiyyah's key for our Postal mail server, for password-reset emails (optional in dev — the email is printed to the server console) |
| `EMAIL_FROM` | sender on Wasiyyah's verified sending domain: `Wasiyyah <hello@mail.wasiyyahwills.com>` |
| `EMAIL_REPLY_TO` | optional; where replies go, since nothing receives mail at the sending domain (default `hello@wasiyyahwills.com`) |
| `POSTAL_URL` | optional; the Postal server (default `https://email.oneabsolute.co.uk`) |

## Deployment

Runs on the VPS at 185.241.151.231: app `wasiyyah` under PM2 on port **3011**,
source in `/var/www/wasiyyah`, database `wasiyyah` on the box's Postgres 16
(credentials in the server's `.env.local`, never in the repo).

Since 2026-11-16 the site is served at **https://wasiyyahwills.com** (nginx site
`wasiyyahwills.com`, copy in `deploy/nginx-wasiyyahwills.conf`). `www`, plain http and
`wasiyyawills.com` (no "h") redirect to it, and so does the old address,
`wills.themuslimguide.org` (`deploy/nginx-wills.conf`). Certificates are from certbot,
one per domain, and renew on their own.

Redeploy after changes:

```bash
npm run deploy:check   # what a deploy would change; changes nothing
npm run deploy         # check server → rsync → database copy and migrations → install and build → pm2 restart → checks
```

`npm run redeploy` is the same as `npm run deploy`. With pnpm, use `pnpm run deploy`:
`pnpm deploy` is a different, built-in pnpm command. The deploy sends this folder as it
is, including uncommitted changes, and builds in place, so the site can misbehave
between the start of the build and the restart.

### Email

Sending follows the same pattern as our other products: the app posts each message to
our Postal server (`https://email.oneabsolute.co.uk`, `src/lib/email.ts`), and Postal hands
it to Amazon SES (eu-west-2) for delivery. Wasiyyah has its own SES identity
(`mail.wasiyyahwills.com`, configuration set `wasiyyah`), its own Postal server and its own
key, so it shares no sending reputation with the other products. Mail goes out as
`Wasiyyah <hello@mail.wasiyyahwills.com>`; nothing receives mail at that subdomain, so
every message carries Reply-To `hello@wasiyyahwills.com`.

`hello@wasiyyahwills.com` is a real inbox: the domain is a Google Workspace user alias
domain of `oneabsolute.co.uk`, so it delivers to `hello@oneabsolute.co.uk` (and every other
oneabsolute.co.uk address has a twin at wasiyyahwills.com).

DNS for all of this is at 123 Reg. On the bare domain: Google's `MX 1 smtp.google.com`,
its verification TXT and `v=spf1 include:_spf.google.com ~all`. Under `mail.`: three SES
signing CNAMEs (`<token>._domainkey.mail`), the bounce pair (`bounce.mail` MX and SPF TXT),
Postal's SPF TXT (`mail`) and signing key (`postal-<id>._domainkey.mail`), the return path
(`psrp.mail` CNAME to `rp.email.oneabsolute.co.uk`) and `_dmarc.mail`.

One setting lives outside this repo and outside Postal's own pages. Between Postal and SES
sits a Postfix relay (container `postal-ses-relay` on the Postal box), and it accepts mail
only from the sender domains named in its `ALLOWED_SENDER_DOMAINS` setting.
`mail.wasiyyahwills.com` is on that list. If it ever goes missing, the site still reports
success, Postal marks each message "Hard fail", and the relay's reply is
`554 5.7.1 … Recipient address rejected: Access denied`. Postal's Messages page for the
Wasiyyah server is the place to look when someone says a reset email never arrived.

### Backups

`/usr/local/bin/wasiyyah-backup` (from `deploy/wasiyyah-backup.sh`, installed by every
deploy) runs at 03:10 server time from `/etc/cron.d/wasiyyah-backup` and writes to
`/root/backups/wasiyyah/nightly`: one copy a day for 30 days, and the copy from the 1st
of each month for a year. A copy is kept only if it is a readable archive holding the
users, wills and payments tables. A deploy also keeps its own copy from just before its
migrations (`/root/backups/wasiyyah/db-*.dump`, last 10).

Nothing sends an alert when a night fails. `npm run deploy:check` (and every deploy)
warns if the last good copy is more than 36 hours old; on the server
`wasiyyah-backup --status` says when it was taken, and `/var/log/wasiyyah-backup.log`
has a line per night.

**These copies are on the same server as the database.** They cover a bad migration, a
bug or a mistaken delete, not the loss of the server. No off-site copy is set up yet.

### Restoring the database

Both steps were run against a scratch database on 2026-11-16.

```bash
ssh root@185.241.151.231
ls -lt /root/backups/wasiyyah/nightly/daily | head     # choose a copy
COPY=/root/backups/wasiyyah/nightly/daily/wasiyyah-YYYY-MM-DD.dump

# 1. Look first: load it into a scratch database and check what is in it.
sudo -u postgres createdb wasiyyah_restore_check
sudo -u postgres pg_restore --exit-on-error -d wasiyyah_restore_check < "$COPY"
sudo -u postgres psql -d wasiyyah_restore_check -c "select count(*) from users" -c "select count(*) from wills"
sudo -u postgres dropdb wasiyyah_restore_check

# 2. To put it in place of the live database: stop the app, keep what is there now,
#    restore over it, start the app. The copy carries the app role's grants.
pm2 stop wasiyyah
sudo -u postgres pg_dump -Fc wasiyyah > /root/backups/wasiyyah/db-before-restore.$(date +%Y%m%d%H%M%S).dump
sudo -u postgres pg_restore --clean --if-exists --exit-on-error -d wasiyyah < "$COPY"
pm2 start wasiyyah
```

## Open questions for review

For the solicitor:

- The residuary gift relies on a scholar's written determination if the family changes.
- Section 33 of the Wills Act 1837 (a predeceased child's issue take their gift) is not
  expressly excluded, and can conflict with the Islamic shares.
- Religious debts (zakat, fidya, kaffarah, Hajj) are not legal debts; the clause is in
  effect a gift of uncertain amount.
- Remoter relatives: the will names the class and any names given, but the nearest
  male-line relative and distant kindred are ultimately identified at death.
- The terms of service, in particular the liability clause.

For the scholar:

- Religious debts are paid before bequests and shares (the Shafi'i position); the Hanafi
  position takes them from the bequeathable third, and only if bequeathed.
- Distant kindred (dhawu al-arham) take the remainder when no sharer other than a spouse
  and no residuary heir survives, but the engine does not divide it between them.
- Relatives who are not Muslim are left out of the count on the user's own answers.

## Legal posture

Wasiyyah is a self-help document-assembly tool, not a law firm; it does not give legal
advice. Complex situations (business assets, foreign property, disputes, previous
marriages, jointly-owned homes) are detected in the interview and flagged with a
recommendation to consult a solicitor. The fiqh positions applied are documented in
the engine's rule trace for scholar review.
