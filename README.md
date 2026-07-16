# Wasiyyah — Islamic Wills for England & Wales

Wasiyyah is a web application that produces a professionally drafted, fara'id-compliant
last will and testament, valid under the law of England & Wales, from a short guided
interview (typically 12–18 questions).

**Live:** https://wills.themuslimguide.org

## How it works

1. **Guided interview** — a dynamic decision tree. The Islamic exclusion rules (hajb)
   prune questions as you answer: if you have a son, you are never asked about siblings,
   because they cannot inherit.
2. **Fara'id engine** — computes the Qur'anic shares with exact fraction arithmetic
   (never floating point) and produces a rule-by-rule trace citing the basis of every
   share. Where the four Sunni schools differ, the Hanafi position is applied and the
   trace says so.
3. **Document generation** — a print-quality will drafted for England & Wales
   (Wills Act 1837 execution formalities), with step-by-step signing instructions.

## Plans & monetization

- **Free — Essential Will.** The complete interview, the full fara'id calculation with
  explanations, and a valid basic will: executor appointment, guardianship of minors,
  Islamic burial wishes, and distribution of the residue per fara'id, plus signing
  instructions. Genuinely valid, genuinely free.
- **Premium — Complete Will Pack (one-time payment).** Everything in Free, plus:
  charitable/wasiyya bequests (with the one-third cap enforced), the religious-debts
  schedule (unpaid zakat, fidya, kaffarah, hajj), a letter of wishes, the executor
  guidance pack, the estate-alignment checklist (joint tenancy severance, pension and
  life-insurance nominations), a mirror will for your spouse, and unlimited future
  updates.

Payments are one-time via Stripe Checkout. No subscription.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **PostgreSQL** via `pg` (no ORM) — schema in [`migrations/`](migrations/)
- **Auth**: email + password (bcrypt), server-side sessions in Postgres, httpOnly cookies
- **Stripe** Checkout (one-time payment) + webhook fulfilment
- **Vitest** — the fara'id engine has a golden-case suite from classical texts plus a
  2,000-case randomized invariant test (shares must total exactly 1)

## Repository layout

```
src/lib/faraid/     fara'id engine (pure TypeScript, no dependencies)
  fraction.ts       exact rational arithmetic (BigInt)
  engine.ts         shares, hajb, 'awl, radd, rule trace
  engine.test.ts    golden cases + invariants
migrations/         SQL schema migrations
src/lib/            db, auth, stripe server utilities
src/app/            Next.js routes (marketing, app, API)
PLAN.md             full product/architecture plan
```

## Development

```bash
pnpm install
createdb wasiyyah_dev
psql wasiyyah_dev -f migrations/001_init.sql
cp .env.example .env.local   # then fill in values
pnpm dev                     # http://localhost:3000
pnpm test                    # engine test suite
```

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | random 32+ bytes for session token hashing |
| `STRIPE_SECRET_KEY` | Stripe API key (optional in dev — upgrade simulated) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe Price for the one-time Complete Will Pack |
| `NEXT_PUBLIC_APP_URL` | canonical URL, e.g. `https://wills.themuslimguide.org` |

## Deployment

Deployed on a VPS: Next.js standalone build under PM2 (port 3011) behind nginx with
certbot TLS, Postgres 16 local to the box. See `deploy/` for the nginx config and
deploy script.

## Legal posture

Wasiyyah is a self-help document-assembly tool, not a law firm; it does not give legal
advice. Complex situations (business assets, foreign property, disputes, previous
marriages) are detected in the interview and flagged with a recommendation to consult
a solicitor. The fiqh positions applied are documented in the engine's rule trace for
scholar review.
