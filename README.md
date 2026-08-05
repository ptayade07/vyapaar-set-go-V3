# Vyapaar Set Go

## Prerequisites

- No OpenAI API key is needed. The MVP is pure CRUD plus deterministic balance math.
- `OPENAI_API_KEY` is optional. Set it only if you want an AI-written end-of-day summary on the
  Hisaab page — the app works fully without it, using a deterministic template for the summary
  instead.
- One free Postgres connection string is required for deploy and local persistence. Neon is the documented default and has a no-card free tier.
- The app opens behind a 4-digit PIN lock (default `1234`, changeable only by editing the
  `AppSetting` row directly for now). This is a single shared household-device lock, not per-user
  login.
- `BLOB_READ_WRITE_TOKEN` is optional. Set it (a Vercel Blob store token) to enable receipt-photo
  attachments on customer transactions — without it, the photo-attach control is simply hidden and
  everything else works normally.

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
2. Copy the **pooled** Postgres connection string — Neon's dashboard shows both a direct and a
   pooled string; the pooled one's hostname has `-pooler` in it (e.g.
   `ep-xxx-pooler.c-2.region.aws.neon.tech`, not `ep-xxx.c-2.region.aws.neon.tech`). The direct
   connection has a much lower concurrent-connection ceiling and will throw
   `Unable to start a transaction in the given time` under any real load, since every Server
   Action here opens its own connection. Append `&pgbouncer=true` to the pooled URL too — Prisma
   needs it to disable prepared statements, which don't work through PgBouncer's transaction
   pooling mode.
3. Put it in `.env` as `DATABASE_URL="postgresql://...-pooler...?sslmode=require&pgbouncer=true"`.
4. Run `npm run prisma:push`.
5. Run `npm run seed`.

## 5-Minute Vercel + Neon Deploy

1. Push this repo to GitHub.
2. In Vercel, import the repo and keep the framework as Next.js.
3. Add `DATABASE_URL` in Vercel Project Settings → Environment Variables.
4. Set the build command to `npm run vercel-build`.
5. Deploy. The build runs `prisma db push`, `prisma db seed`, and `next build`.

## Seed Data

The seed script is `backend/prisma/seed.ts` and is wired through `prisma.seed` in `package.json`.

It creates:

- 8 customers with mixed udhaar, advance, and settled balances.
- 3 suppliers with dues, including one overdue supplier.
- 21 total transactions spread across the last 7 days.
- 7 inventory items, including 2 below the low-stock threshold.

Khata (customer/supplier) seeding and inventory seeding are independent: each only runs when its
own tables are empty, so re-seeding after adding inventory to an existing khata database (or vice
versa) won't duplicate anything.

Run it manually with:

```bash
npm run seed
```

## Screens

- Lock: 4-digit PIN keypad gating every other screen (session cookie, default PIN `1234`).
- Dashboard: summary cards, a "Kal kya bacha?" aging card (7/15/30-day overdue-customer buckets),
  a Quick Entry bar (customer autocomplete + Udhaar/Payment + amount), today's due reminders,
  recent transactions, and quick actions.
- Customers: searchable khata list with `?aging=` day-count filtering and badges, and add-customer
  form.
- Customer Detail: passbook-style history with receipt-photo thumbnails, signed balance, entry
  form (with optional photo attach), reminder copy + WhatsApp share buttons, and a PDF statement
  download.
- Suppliers: supplier list with overdue badges and add-supplier form.
- Supplier Detail: supplier passbook, credit/payment entries, due dates.
- Inventory: item name, quantity, purchase price, selling price; add/edit items, a +/- quantity
  stepper, and a red "Kam stock!" badge when quantity is 5 or below. No barcodes, no categories.
- Daily Hisaab: date picker, daily totals, a "Din ka Summary" card, a Cash Milao cash-reconciliation
  panel, and the daily transaction list.
- Notes: reminders optionally linked to a customer, with a due badge and a toggle-done control.

## Quick Entry (Dashboard)

A fast path for entries against customers you already have: type a name or phone number into the
autocomplete, pick the suggested customer, choose `Udhaar` or `Payment`, enter the amount, and
save — no page navigation, no confirmation step. New customers aren't created from here; use the
Customers screen's "+ Add" form for that. See `AGENTS.md` for the full contract.

## AI End-of-Day Summary (Hisaab)

The Hisaab page's "Din ka Summary" card is a short Hinglish paragraph covering the day's udhaar
given, payments received, customers whose udhaar has been outstanding for more than 15 days, and
any low-stock inventory items.

- It is fetched client-side from `GET /api/hisaab-summary` **after** the page has already rendered
  — the report cards and transaction list never wait on it, so the page is never blocked by
  `OPENAI_API_KEY` being set, unset, slow, or down.
- If `OPENAI_API_KEY` is set, the route asks an LLM to turn that day's numbers into a natural
  paragraph (`backend/lib/hisaab-summary-llm.ts`). Any failure there falls straight through to the
  deterministic path — never a broken card.
- If no key is set (or the LLM call fails), the same data is turned into a paragraph by a plain
  template (`buildTemplatedSummary` in `backend/lib/hisaab-summary.ts`), so the feature is fully usable
  with zero API keys.
- The card shows which path produced the text ("AI summary" vs "Auto summary").

See `AGENTS.md` for the full contract, including how "udhaar older than 15 days" is defined.

## How Codex Built This

- Planning was written outside the app code in `PLANS.md` before feature work.
- All application source, database schema, tests, seed data, and docs were generated and iterated inside Codex.
- The balance engine was kept deterministic and covered by Vitest.
- The UI was built mobile-first for one-handed phone use and simple laptop operation.
- Git commits were created incrementally with `Codex <codex@openai.com>` as author.

## Demo Video Script

1. Open Dashboard and show Total Udhaar, Advance, Aaj ka Hisaab, and Supplier Dena.
2. Use Quick Entry: pick a customer from the autocomplete, choose Udhaar, enter ₹250, and save.
4. Open Customers, search a name, and show red/green/grey khata balances.
5. Open a Customer Detail page, add `Udhaar Diya`, then add a larger `Payment Liya`.
6. Show the balance flip automatically from `Udhaar` to `Advance` and copy the reminder.
7. Open Inventory, tap the +/- stepper on a low-stock item, and show the "Kam stock!" badge.
8. Open Suppliers, then Daily Hisaab, to show overdue dena, the end-of-day tally, and the
   "Din ka Summary" card writing itself in below the totals.
