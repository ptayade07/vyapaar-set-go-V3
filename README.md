# Vyapaar Set Go

## Prerequisites

- No OpenAI API key is needed. The MVP is pure CRUD plus deterministic balance math, and the
  Dashboard's Quick Entry box parses Hinglish sentences with a deterministic rule parser first.
- `OPENAI_API_KEY` is optional. Set it only if you want smarter fallback parsing for Quick Entry
  sentences the rule parser can't understand — the app works fully without it.
- One free Postgres connection string is required for deploy and local persistence. Neon is the documented default and has a no-card free tier.
- No login is included for the demo. The app opens straight to Dashboard.

Vyapaar Set Go is a mobile-first digital khata and shop hisaab app for small Indian shopkeepers. It tracks customer udhaar, customer advance, supplier dena, and daily cash flow with large buttons, Hinglish labels, INR formatting, and IST dates.

## Assumptions

- Amounts are stored as integer paise in Postgres to avoid floating-point money errors.
- Customer balances use one signed value: positive is `Udhaar`, negative is `Advance`, zero is `Settled`.
- Supplier balances are from the shopkeeper's view: positive means `Dena hai`.
- Demo mode is single-shop and no-login for hackathon speed.
- Seed data runs only when both customer and supplier tables are empty.

## Run Locally

```bash
npm install
cp .env.example .env
npm run prisma:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Validation Commands

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

`npm run test:e2e` needs `DATABASE_URL` set and a migrated database because it creates real demo records.

## Database Setup With Neon

1. Go to `https://neon.tech` and create a free project.
2. Copy the pooled Postgres connection string.
3. Put it in `.env` as `DATABASE_URL="postgresql://...sslmode=require"`.
4. Run `npm run prisma:push`.
5. Run `npm run seed`.

## 5-Minute Vercel + Neon Deploy

1. Push this repo to GitHub.
2. In Vercel, import the repo and keep the framework as Next.js.
3. Add `DATABASE_URL` in Vercel Project Settings → Environment Variables.
4. Set the build command to `npm run vercel-build`.
5. Deploy. The build runs `prisma db push`, `prisma db seed`, and `next build`.

## Seed Data

The seed script is `prisma/seed.ts` and is wired through `prisma.seed` in `package.json`.

It creates:

- 8 customers with mixed udhaar, advance, and settled balances.
- 3 suppliers with dues, including one overdue supplier.
- 21 total transactions spread across the last 7 days.

Run it manually with:

```bash
npm run seed
```

## Screens

- Dashboard: summary cards, Quick Entry sentence box, recent transactions, and quick actions.
- Customers: searchable khata list and add-customer form.
- Customer Detail: passbook-style history, signed balance, entry form, reminder copy button.
- Suppliers: supplier list with overdue badges and add-supplier form.
- Supplier Detail: supplier passbook, credit/payment entries, due dates.
- Daily Hisaab: date picker, daily totals, and daily transaction list.

## Quick Entry (Dashboard)

Type one Hinglish sentence — e.g. "Ramesh ko 250 ka udhaar" or "Sunita se 500 payment liya" —
and Quick Entry turns it into a customer transaction:

1. A deterministic rule parser (`lib/quick-entry.ts`) always runs first: it extracts an amount,
   a type keyword (`udhaar` / `payment` / `advance`, with `liya`/`diya` as fallback keywords), and
   a customer name, preferring a match against your existing customers. No API key required.
2. If that parse is incomplete and `OPENAI_API_KEY` is set, an LLM fallback (`lib/quick-entry-llm.ts`)
   fills in the gaps. It fails closed on any error, so a missing or misbehaving key never breaks
   the deterministic path.
3. Nothing is saved automatically. A confirmation card always shows the parsed customer, amount,
   and entry type first. If the customer doesn't exist yet, the card offers to create them inline
   as part of the same confirm step.

See `AGENTS.md` for the full parsing contract.

## How Codex Built This

- Planning was written outside the app code in `PLANS.md` before feature work.
- All application source, database schema, tests, seed data, and docs were generated and iterated inside Codex.
- The balance engine was kept deterministic and covered by Vitest.
- The UI was built mobile-first for one-handed phone use and simple laptop operation.
- Git commits were created incrementally with `Codex <codex@openai.com>` as author.

## Demo Video Script

1. Open Dashboard and show Total Udhaar, Advance, Aaj ka Hisaab, and Supplier Dena.
2. Type "Ramesh ko 250 ka udhaar" into Quick Entry, show the confirmation card, and confirm.
3. Type a sentence for a new customer, show the inline "create + save" offer, and confirm.
4. Open Customers, search a name, and show red/green/grey khata balances.
5. Open a Customer Detail page, add `Udhaar Diya`, then add a larger `Payment Liya`.
6. Show the balance flip automatically from `Udhaar` to `Advance` and copy the reminder.
7. Open Suppliers and Daily Hisaab to show overdue dena and end-of-day tally.
