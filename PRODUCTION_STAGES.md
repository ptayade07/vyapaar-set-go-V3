# Vyapaar Set Go — Production Rollout Stages

This is the staged plan for turning the app from a single-shop tool into a product multiple
shopkeepers can sign up for. Each stage should ship and be usable on its own before the next one
starts. Stages 1, 2, and 3 are broken down step-by-step; the rest get the same treatment when we're
about to start them, per `PLANS.md`'s own convention of planning before building.

## Overview

- **Stage 1 — Multi-tenant foundation.** ✅ **Done.** No user-facing change. Every table gets a
  `shopId`, every query gets scoped, the auto-seed landmine gets defused. Everything else depends
  on this being right.
- **Stage 2 — Real auth + private pilot.** ✅ **Done.** Real login replaces the shared PIN as the
  source of identity (PIN stays as a device-lock layer on top). Shops created by hand, not
  self-serve. 2–5 real shopkeepers using it.
- **Stage 3 — Public self-serve signup.** ✅ **Done.** Anyone can create a shop. Terms of Service
  and Privacy Policy must be live before this opens.
- **Stage 4 — Per-shop completeness.** Shop settings (name/address/phone/logo) feeding PDF
  statements and reminders, plus whatever Stage 2 pilot feedback surfaced.
- **Stage 5 — Operational hardening.** Error tracking, admin tooling, infra scaling review, data
  export/backup.
- **Stage 6 — Monetization** *(optional, only if charging)*. Plan tiers, Stripe, subscriptions.

---

## Stage 1: Multi-tenant foundation — detailed steps

**Status: ✅ Complete.** All 10 steps below are done. Two real bugs were caught and fixed along the
way (not just by the plan, but by actually running the isolation test against the app): the
`/select-shop` picker was unreachable past a handful of shops (`fixed inset-0` with no scroll), and
the app was missing an `app/not-found.tsx` boundary. Final verification: all 9 e2e specs pass
(including the new `tenant-isolation.spec.ts`), `npm run typecheck` is clean, and 39/39 unit tests
pass.

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

---

## Stage 2: Real auth + private pilot — detailed steps

**Status: ✅ Complete.** All 10 steps below are done. Final verification: `npm run typecheck`
clean, 39/39 unit tests pass, all 11 e2e specs pass (including the new `login.spec.ts` and the
rewritten `tenant-isolation.spec.ts`), and a manual walkthrough confirmed real login → PIN → real
"My Shop" data, `/select-shop` genuinely gone (404, not just redirected), and logout actually
ending the session (direct URL nav afterward bounces to `/login`, server-enforced). One thing worth
knowing, not a bug: on Neon's free tier a cold pooled connection can occasionally make the very
first PIN-verify or login request take longer than 15s — already documented in the README's Neon
section; real usage after the first request is fast.

**Goal:** the `/select-shop` picker (a stand-in with zero security — anyone who reaches it can
create a shop or open any existing one) is replaced by real email+password login. Shops are still
created by hand for 2–5 real shopkeepers, not self-serve — that's Stage 3. The PIN keypad stays
exactly as it is today, now sitting *on top of* login as a quick per-device unlock, not as the
identity check itself.

**Auth method: email + password**, decided with the user — no passwords to store client-side ever,
no new third-party service required to *start* the pilot (email-based password reset can come
later, once a Stage 3/4 email service exists anyway).

### Two things found while planning this that aren't obvious from the current code

- Everything Stage 1 built as an explicitly-labeled "temporary picker until real login exists" —
  `app/select-shop/`, `backend/actions/shop-actions.ts`, the `vsg_shop` cookie, the "Shop badlo"
  button in `layout.tsx` — gets **removed**, not extended, this stage. Stage 2 is as much deletion
  as addition.
- Every e2e spec's login helper (`tests/e2e/utils.ts`'s `unlockPin`/`selectOrCreateTestShop`,
  `tenant-isolation.spec.ts`'s shop-creation flow, `pin-lock.spec.ts`) currently authenticates by
  picking a shop from a list. All of it has to be rewritten to log in with email+password —
  comparable in size to Stage 1's own steps 9–10.

### Decision made while planning (documented here rather than re-asked)

Session handling is **hand-rolled** (`bcryptjs` for password hashing + `jose` for a signed session
cookie) instead of pulling in an auth framework like Auth.js/NextAuth. Two reasons:

1. It matches the pattern the app already uses successfully for the PIN lock — a server-verified,
   signed, httpOnly cookie, nothing trusted from the client — rather than running two different
   auth paradigms side by side.
2. This app runs on a very new Next.js 16.x. A full auth framework is meaningfully more dependency
   surface that could clash with that; `jose` (the same JWT primitive Auth.js itself uses
   internally) is small, stable, and already Edge-runtime-safe, which `proxy.ts` needs.

### Steps

1. **Schema: add `User`.**
   In `backend/prisma/schema.prisma`: add `model User { id, email (unique), passwordHash, shopId
   (FK to Shop), createdAt }`. Add `bcryptjs` and `jose` as dependencies. `npm run prisma:push`.
   `shopId` is a plain FK, not unique — one shop having multiple staff logins later doesn't need a
   migration — but Stage 2 only ever creates one `User` per `Shop` by hand.

2. **`backend/lib/session.ts` — sign/verify a session token.**
   `createSessionToken({ userId, shopId })` signs a short JWT via `jose`, keyed off a new required
   `AUTH_SECRET` env var. `verifySessionToken(token)` verifies and decodes it. No Prisma import in
   this file — it has to run inside `proxy.ts`'s Edge runtime, same constraint that shaped
   `shop-context.ts` in Stage 1.

3. **`backend/lib/auth.ts` — replace `getCurrentShopId()`.**
   Rewritten to read a new `vsg_session` cookie, verify it via `verifySessionToken`, and return
   `shopId` (redirecting to `/login` if missing/invalid). This fully replaces
   `backend/lib/shop-context.ts`; every page/route that currently imports `getCurrentShopId` from
   there switches to the new module — no call-site logic changes, just the source of truth
   underneath it.

4. **`backend/actions/auth-actions.ts` — login and logout.**
   `loginAction(email, password)`: look up `User` by email, `bcryptjs.compare` against
   `passwordHash`, sign a session token on success, set it as an httpOnly/`sameSite: lax`/`secure`-
   in-production cookie, redirect to `/`. On failure, one generic error ("Email ya password galat"
   / "Incorrect email or password") — never reveal whether the email exists. `logoutAction()`:
   clears both `vsg_session` and `vsg_unlocked`, redirects to `/login`.

5. **`app/login/page.tsx`.**
   Email + password form styled with the same tactile-card language as `/lock`'s keypad screen,
   calling `loginAction`. Simple, no "remember me" or social login — this is a hand-picked pilot.

6. **`proxy.ts` — swap the gate.**
   Replace the `vsg_shop` cookie-presence check with a `vsg_session` JWT verification (still
   Edge-safe via `jose`, no DB call). Keep the existing `vsg_unlocked` PIN check as the second gate,
   in the same order as today: not logged in → `/login`; logged in but not PIN-unlocked → `/lock`;
   both → through. This is the "PIN as a device-lock layer on top of login" behavior from the
   Stage 2 goal.

7. **Retire the Stage 1 picker scaffolding.**
   Delete `app/select-shop/`, `backend/actions/shop-actions.ts`, and `backend/lib/shop-context.ts`
   (fully superseded by step 3). Remove the "Shop badlo" button and `switchShopAction` from
   `app/layout.tsx`; add a real "Log out" button calling `logoutAction`. There's no shop-switching
   concept left once one login maps to exactly one shop.

8. **One-off admin script: create a pilot user.**
   `backend/prisma/create-pilot-user.ts` — given a shop name, email, and password, creates the
   `Shop` and its one `User` (hashed) in a single call. This is the entire "shops created by hand"
   mechanism for Stage 2 — a script, not an admin UI, on purpose (see the "two dashboards" question
   from earlier: we don't yet know what an admin screen needs to do, so we're not building one until
   real pilot usage tells us). Run it once for each of the 2–5 real shopkeepers, and once for the
   existing "My Shop" row so the current data has a real login instead of the old picker.

9. **Rewrite every e2e test's login flow.**
   `tests/e2e/utils.ts`, `tests/e2e/tenant-isolation.spec.ts`, `tests/e2e/pin-lock.spec.ts` all swap
   "pick or create a shop" for "log in as a seeded test user." `tenant-isolation.spec.ts` seeds two
   `Shop`+`User` pairs directly via Prisma in a test setup helper (mirroring `create-pilot-user.ts`)
   instead of driving the old picker UI, then logs each browser context in with its own credentials.

10. **Full verification pass.**
    `npm run typecheck`, `npm test`, `npm run test:e2e` all green. Manual walkthrough: log in as two
    different pilot users in two separate browser profiles, confirm PIN lock still gates each one
    independently, confirm logging out actually ends the session (a direct URL navigation afterward
    bounces to `/login`, not just the button click), confirm `/select-shop` no longer exists (404).

**Definition of done:** steps 1–9 complete, the rewritten test suite passes end to end, and the
current user can personally log into their real "My Shop" data with a real email+password from a
fresh browser, with the PIN lock still working on top, and log out cleanly.

---

## Stage 3: Public self-serve signup — detailed steps

**Status: ✅ Complete.** All 8 steps below are done. Final verification: `npm run typecheck`
clean, 39/39 unit tests pass, all 14 e2e specs pass (including the new `signup.spec.ts`), and a
manual walkthrough confirmed: a brand-new signup lands on the PIN screen with a genuinely empty
shop; `/terms` and `/privacy` are live and linked from `/signup`'s HTML; the rate limit actually
blocks the 6th signup attempt from the same caller within an hour (verified directly against the
database — no new `Shop` or `SignupAttempt` row on the blocked attempt) and, being a sliding
time-window check, recovers on its own with no separate reset logic needed.

**Goal:** anyone can create their own shop account without the current user hand-creating it via
`create-pilot-user.ts`. Terms of Service and Privacy Policy are live and linked *before* the
signup form is reachable, per this stage's own requirement in the Overview.

### Decisions made while planning (documented here, not re-asked mid-implementation)

- **ToS/Privacy are drafted here as simple, plain-language starter versions**, with a clear "not
  reviewed by a lawyer" disclaimer — honest with early public users, appropriate for a small pilot.
  These are **not** a substitute for real legal review; swap in lawyer-reviewed versions before
  charging money or growing past pilot scale.
- **Email verification is skipped this stage**, consistent with Stage 2's own deferral of
  email-based flows until an email-sending service exists for another reason anyway.
- **A lightweight signup rate limit is added now**, since this is the first fully public write
  endpoint the app has ever had (everything before this required a hand-created login). A new
  `SignupAttempt { id, ipHash, createdAt }` table, checked and written inside `signupAction`: read
  the caller's IP via `headers()` (`x-forwarded-for`, the header Vercel sets), hash it, count
  attempts from that hash in the last hour, reject with a friendly message past a small cap (5/hr).
  This is a pilot-scale mitigation, not real abuse infrastructure — revisit in Stage 5 if it's not
  enough.

### Two things found while planning this that aren't obvious from the current code

- Login's `loginAction` deliberately never reveals whether an email is registered (so a failed
  attempt can't be used to enumerate accounts). **Signup is the opposite on purpose**: telling
  someone "this email is already registered" during *signup* is normal, expected UX, not a
  security leak — the person typing it already knows whether it's their own email.
- Stage 2's own goal statement said "shops created by hand, not self-serve" — this stage literally
  reverses that. `create-pilot-user.ts` isn't removed (still useful for support / admin-assisted
  onboarding), but it stops being the *only* way a shop gets created.

### Steps

1. **`/terms` and `/privacy` pages.**
   Plain-language static pages describing what data the app stores (shop, customer, and supplier
   names/phone numbers, transaction amounts), that it's strictly shop-scoped (see Stage 1's
   tenant-isolation guarantees), who to contact with questions, and the "not reviewed by a lawyer"
   disclaimer. Publicly reachable, no login required.

2. **`proxy.ts`: allow the new public routes through.**
   Add `/signup`, `/terms`, `/privacy` to the no-session allow-list, same treatment `/login`
   already gets.

3. **Schema: `SignupAttempt` for rate limiting.**
   Add the model described above. `npm run prisma:push`.

4. **`backend/actions/auth-actions.ts`: `signupAction(email, password, shopName)`.**
   Validate password length (reuse the 8-char minimum from `create-pilot-user.ts`), check the
   rate limit (step 3) and reject early if tripped, check email uniqueness and return a specific
   "already registered" error if taken (see the documented exception to login's secrecy rule
   above), otherwise create the `Shop` + `User` (bcrypt hash), sign a session token, set the
   cookie, and redirect to `/` — same shape as `loginAction`, but creating instead of verifying.

5. **`/signup` page.**
   Email + password + shop name form, styled like `/login`. A required "I agree to the Terms and
   Privacy Policy" checkbox linking to the new pages — submit is disabled until it's checked.
   Inline error display reuses `/login`'s client pattern (`useTransition`, no raw form action).

6. **Cross-link `/login` and `/signup`.**
   "New shop? Sign up" on `/login`; "Already have an account? Log in" on `/signup`.

7. **e2e test: `signup.spec.ts`.**
   Successful signup lands on the PIN screen with a genuinely empty new shop (no demo data, no
   other shop's data). Signing up again with the same email shows the specific "already
   registered" error. Submit is blocked until the ToS checkbox is checked.

8. **Full verification pass.**
   `npm run typecheck`, `npm test`, `npm run test:e2e` all green. Manual walkthrough: sign up as a
   brand-new user with zero prior involvement in the project, confirm the shop starts genuinely
   empty, confirm `/terms` and `/privacy` load and are linked from `/signup`, confirm the rate
   limit trips after enough rapid signups in one run and recovers after the window passes.

**Definition of done:** ToS/Privacy are live and linked from the signup form, self-serve signup
works end to end and is rate-limited, and the full test suite (existing + new `signup.spec.ts`)
passes.
