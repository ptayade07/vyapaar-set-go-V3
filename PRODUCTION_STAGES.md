# Vyapaar Set Go — Production Rollout Stages

This is the staged plan for turning the app from a single-shop tool into a product multiple
shopkeepers can sign up for. Each stage should ship and be usable on its own before the next one
starts. Only Stage 1 is broken down step-by-step right now — the rest get the same treatment when
we're about to start them, per `PLANS.md`'s own convention of planning before building.

## Overview

- **Stage 1 — Multi-tenant foundation.** No user-facing change. Every table gets a `shopId`, every
  query gets scoped, the auto-seed landmine gets defused. Everything else depends on this being
  right.
- **Stage 2 — Real auth + private pilot.** Real login replaces the shared PIN as the source of
  identity (PIN stays as a device-lock layer on top). Shops created by hand, not self-serve.
  2–5 real shopkeepers using it.
- **Stage 3 — Public self-serve signup.** Anyone can create a shop. Terms of Service and Privacy
  Policy must be live before this opens.
- **Stage 4 — Per-shop completeness.** Shop settings (name/address/phone/logo) feeding PDF
  statements and reminders, plus whatever Stage 2 pilot feedback surfaced.
- **Stage 5 — Operational hardening.** Error tracking, admin tooling, infra scaling review, data
  export/backup.
- **Stage 6 — Monetization** *(optional, only if charging)*. Plan tiers, Stripe, subscriptions.

---

## Stage 1: Multi-tenant foundation — detailed steps

**Goal:** every row in the database belongs to exactly one shop, every query is scoped to the
current shop, and it's provable that one shop can never see another's data. No login UI yet —
Stage 2 builds real auth on top of the plumbing this stage creates.

### Two things found while planning this that aren't obvious from the schema

- `app/hisaab/page.tsx` queries `CustomerTransaction`/`SupplierTransaction` **directly** by date
  range — it doesn't go through `Customer`/`Supplier` first. That means `shopId` has to live
  directly on the transaction tables too (denormalized), not just on `Customer`/`Supplier` — a
  join-based scoping trick won't reach this query.
- The PIN itself is currently one global `AppSetting` row. It has to become per-shop
  (`AppSetting` keyed by `(shopId, key)`) or every shop shares one PIN.

### Steps

1. **Schema: add `Shop` and `shopId` everywhere.**
   In `backend/prisma/schema.prisma`: add a minimal `Shop` model (`id`, `name`, `createdAt` — full
   shop profile fields come in Stage 4). Add `shopId` (nullable for now) + an index to `Customer`,
   `Supplier`, `InventoryItem`, `Note`, `OpeningCash`, `AppSetting`, `CustomerTransaction`,
   `SupplierTransaction`.

2. **Backfill existing data.**
   Write a one-off script (`backend/prisma/backfill-shop.ts`): create a single `Shop` row for the
   current data, then set `shopId` on every existing row across every table to that shop's id. Run
   it once against the real database.

3. **Make `shopId` required.**
   Flip every `shopId` column from optional to required in the schema now that backfill is done,
   then `npm run prisma:push`.

4. **Build a `getCurrentShopId()` helper.**
   New `backend/lib/shop-context.ts` reads a `vsg_shop` cookie (separate from the existing PIN
   `vsg_unlocked` cookie) and returns the shop id, or redirects/throws if it's missing. Add a
   temporary admin-only action to set this cookie by hand — this stands in for real login until
   Stage 2, so the query-scoping work below doesn't need to wait on auth being built first.

5. **Scope every read.**
   Go through every page and API route (Dashboard, Customers, Customer Detail, Suppliers,
   Supplier Detail, Inventory, Notes, Hisaab, the two API routes) and add
   `where: { shopId: await getCurrentShopId(), ... }` to every Prisma call. For **detail** pages and
   the PDF statement route specifically, this isn't just a list filter — after loading the record,
   explicitly check its `shopId` matches the current shop and call `notFound()` otherwise. A
   shopkeeper guessing another shop's customer ID in the URL must get a 404, not a data leak.

6. **Scope every write.**
   Every Server Action in `backend/actions/` needs to either set `shopId` on newly created rows or
   verify the target row's `shopId` matches the current shop before mutating or deleting it.

7. **Make the PIN per-shop.**
   Update `backend/lib/pin.ts` so `getPin`/`verifyPin` take a `shopId` and key the `AppSetting`
   lookup on `(shopId, "pin")`. Update `verifyPinAction` to resolve the current shop first.

8. **Defuse the auto-seed.**
   Remove the seed-if-tables-are-empty trigger, or scope it explicitly to one hardcoded demo shop
   id that real onboarding never uses. A brand-new real shop must start genuinely empty, never
   pre-filled with fake demo customers.

9. **Tenant isolation tests.**
   New test(s) that create two shops with distinct data and assert, for every page/action/API
   route, that Shop A's session can never read, list, or write Shop B's data — including the
   guessed-URL case from step 5.

10. **Manual verification pass.**
    Create two shops via the temporary cookie-setter, add distinct data to each, walk every screen
    under both, confirm total separation. Re-run the existing e2e suite against one shop to confirm
    nothing single-tenant broke.

**Definition of done:** steps 1–8 complete, the new isolation tests pass, the existing test suite
(`npm test`, `npm run test:e2e`) still passes, and the manual two-shop walkthrough shows zero
cross-contamination anywhere in the app.
