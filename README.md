# Wasiyyah — Islamic Wills for England & Wales

Wasiyyah is a web application that produces a professionally drafted, fara'id-compliant
last will and testament, valid under the law of England & Wales, from a short guided
interview (typically 12–18 questions).

**Live:** https://wills.themuslimguide.org

## Status

- ✅ Live in production (VPS, PM2 + nginx + Let's Encrypt)
- ✅ Engine test suite green (24 tests incl. 2,000-case invariant fuzz)
- ✅ Browser end-to-end suite green against production
- ⏳ **Stripe keys not yet configured on the server** — checkout returns a friendly
  503 until `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are added to
  `/var/www/wasiyyah/.env.local` and the app restarted (`pm2 restart wasiyyah`).
  Create the webhook in the Stripe dashboard → endpoint
  `https://wills.themuslimguide.org/api/stripe/webhook`, event
  `checkout.session.completed`.
- ⏳ Recommended before heavy marketing: one-time solicitor review of the templates
  and scholar review of the fiqh (the engine's rule trace exists to make this easy)
- 🔎 Dedicated-domain options researched in [DOMAINS.md](DOMAINS.md)
  (short version: `wasiyyah.com/.co.uk` are taken but dormant; `wasiyyah.app`,
  `wasiyyahwills.com`, `mywasiyyah.co.uk`, `muslimwill.co.uk`, and the
  `deenwills.com + .co.uk` pair are available)

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
cp .env.example .env.local   # then fill in values
pnpm dev                     # http://localhost:3000
pnpm test                    # engine test suite (vitest)

# end-to-end (uses your installed Chrome):
pnpm build && PORT=3100 pnpm start &
node tests/e2e.mjs           # screenshots land in tests/shots/
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
| `NEXT_PUBLIC_APP_URL` | canonical URL, e.g. `https://wills.themuslimguide.org` |

## Deployment

Runs on the VPS at 185.241.151.231: app `wasiyyah` under PM2 on port **3011**,
source in `/var/www/wasiyyah`, nginx site `wills.themuslimguide.org` with certbot
TLS, database `wasiyyah` on the box's Postgres 16 (credentials in the server's
`.env.local`, never in the repo).

Redeploy after changes:

```bash
./deploy/deploy.sh   # rsync → pnpm install → build → pm2 restart
```

## Legal posture

Wasiyyah is a self-help document-assembly tool, not a law firm; it does not give legal
advice. Complex situations (business assets, foreign property, disputes, previous
marriages, jointly-owned homes) are detected in the interview and flagged with a
recommendation to consult a solicitor. The fiqh positions applied are documented in
the engine's rule trace for scholar review.
