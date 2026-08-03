# Agent Instructions

## Balance Logic Contract

This app uses one signed integer balance per customer, stored in paise.

- Positive customer balance means the customer owes the shopkeeper: display as red `Udhaar`.
- Negative customer balance means the shopkeeper holds the customer's advance: display as green `Advance`.
- Zero customer balance means neither side owes money: display as grey `Settled`.
- `Udhaar Diya` increases customer balance by the amount.
- `Payment Liya` decreases customer balance by the amount.
- `Advance Liya` decreases customer balance by the amount.

Do not add a second balance column for advances. Overpayment and advance behavior must fall out of signed arithmetic.

Deleting a customer transaction (`deleteCustomerTransaction`) is not a simple row delete: it replays that
customer's full remaining history in order through `applyCustomerEntry`, rewriting every subsequent row's
`balanceAfterPaise` and the `Customer.balancePaise` total. Deleting a transaction from the middle of the
passbook must never leave later rows showing a stale running balance.

Supplier balances are also stored as signed paise, from the shopkeeper's point of view:

- Positive supplier balance means the shopkeeper owes the supplier: display as `Dena hai`.
- `Maal Liya` increases supplier balance by the amount.
- `Payment Diya` decreases supplier balance by the amount.

## Quick Entry Contract

The Dashboard's Quick Entry bar (`frontend/components/quick-entry.tsx`) is a customer-only fast
path: search-and-pick a customer by name/phone (autocomplete over the customers already loaded on
the Dashboard, max 6 suggestions), pick `Udhaar`/`Payment`, enter an amount, and save — no
confirmation step, it writes immediately via `addCustomerEntry`. Suppliers are not entered here.

- No customer can be created from Quick Entry — the shopkeeper must pick an existing customer
  (matches V2E: this bar is for speed against known customers, not onboarding new ones).
- Advance is intentionally not offered here — only `UDHAAR`/`PAYMENT`, mirroring V2E's own
  Quick Entry bar. A shopkeeper taking an advance uses the full Customer Detail flow instead.
- This does not use any AI/LLM parsing — it is a plain autocomplete form, not a sentence parser.

## Inventory Contract

Inventory is deliberately minimal: item name, quantity, purchase price paise, selling price paise.
No barcodes, no categories, no per-item transaction history.

- `quantity <= 5` is the single low-stock rule (`backend/lib/inventory.ts`). At or below that threshold, the
  item row is highlighted red and shows a "Kam stock!" badge. There is no separate "out of stock"
  state — zero is just the lowest value low stock can take.
- Quantity changes only through the +/- stepper (a signed delta applied server-side), never through
  a free-text quantity field on the edit form. The stepper clamps at zero; it cannot go negative.
- Editing an item (name, purchase price, selling price) is a separate action from adjusting
  quantity, so a shopkeeper fixing a price typo never accidentally resets their stock count.

## FIFO Udhaar Aging Contract

"How old is a customer's oldest unpaid udhaar" is answered by one function,
`computeOldestOpenUdhaarDate` in `backend/lib/aging.ts`, used everywhere aging matters (Dashboard's "Kal
kya bacha?" card, the Customers list's `?aging=` filter and day-badges, and the Hisaab AI summary's
old-udhaar list).

- It is a FIFO walk of a customer's transactions oldest-first, not "the date of the first-ever
  UDHAAR row." A new `UDHAAR` first offsets any standing `ADVANCE` credit; only the leftover opens
  a new entry in the queue. A `PAYMENT`/`ADVANCE` consumes from the front of the queue (oldest
  udhaar first). Whatever is left at the front when the walk finishes is the oldest still-open
  udhaar; an empty queue means fully settled (`null`).
- This is deliberately more accurate than "does this customer have any UDHAAR row older than N
  days" — a customer who paid off an old udhaar and took a fresh one since should not show up as
  overdue.
- The Dashboard's three aging buckets (7 / 15 / 30 days) are **cumulative, not exclusive ranges**:
  a customer 40 days overdue increments all three counters.
- The Hisaab AI summary's "old udhaar" list still means `balancePaise > 0` AND the FIFO-computed
  oldest-open-udhaar age is more than 15 days — same threshold as before, now computed correctly.

## Cash Milao Contract

The Hisaab page's Cash Milao panel answers "does the drawer match the books" for one calendar day.

- `expectedCashPaise = openingCashPaise + (paymentsTotalPaise + advanceTotalPaise) - supplierPaymentsTodayPaise`
  (`backend/lib/cash-milao.ts#computeExpectedCashPaise`). Opening cash is a per-date value the shopkeeper
  enters once (`OpeningCash` table, keyed by the same `YYYY-MM-DD` string used everywhere else in
  the app); it is not derived from any ledger.
- The verdict (`getCashMilaoVerdict`) compares actual counted cash against that expected figure:
  within 50 paise is a **match**, under is **short**, over is **extra**. This is a real-money
  reconciliation tool, so the formula and verdict boundary are pure functions with Vitest coverage
  — never inline arithmetic in the component.

## PIN Lock Contract

The app opens behind a 4-digit PIN gate (default `1234`, stored in `AppSetting` and created lazily
on first read via `backend/lib/pin.ts#getPin`).

- The PIN is verified **server-side only** (`verifyPinAction` in `backend/actions/actions.ts`) — unlike a
  naive client-side comparison, the plaintext PIN never reaches the browser. On a correct guess the
  action sets an `httpOnly` session cookie (`vsg_unlocked`); `proxy.ts` redirects every route
  except `/lock` to `/lock` when that cookie is absent.
- This is a single shared household-device lock, not per-user authentication — there is no
  account system, and locking (`lockAction`) just deletes the cookie and redirects to `/lock`.

## Photo Receipt Attachment Contract

Customer transactions may carry an optional receipt photo (`CustomerTransaction.photoUrl`),
uploaded via `uploadTransactionPhoto` in `backend/actions/actions.ts` to Vercel Blob.

- This follows the same fail-safe posture as the optional AI features: if
  `process.env.BLOB_READ_WRITE_TOKEN` is unset, `uploadTransactionPhoto` returns
  `{ ok: false, reason: "not_configured" }` instead of throwing, and the `allowPhoto` prop passed
  into `CustomerTxnButtons`/`QuickTxnModal` (computed server-side from the same env check) hides
  the attach-photo control entirely — no broken upload button, no 500.
- Uploads are capped at 8MB and restricted to a fixed image MIME whitelist (jpeg/png/gif/webp/heic),
  validated at the boundary rather than trusting client input.
- Supplier transactions do not support photos — this is a customer-passbook feature only.

## Hisaab AI Summary Contract

The Hisaab page's "Din ka Summary" card is fetched client-side from `GET /api/hisaab-summary`
**after** the page has already server-rendered — the route is never awaited during SSR, so a slow
or misbehaving OpenAI call can only delay the summary card, never the rest of the page.

- "Customers with udhaar older than 15 days" is defined by the [[FIFO Udhaar Aging Contract]]
  above: `balancePaise > 0` AND the FIFO-computed oldest-open-udhaar age is more than 15 days. The
  app has no point-in-time balance history, so this is evaluated against the current balance and
  current time, not the report date being viewed — it is a "who's overdue right now" signal, not a
  historical reconstruction.
- The route always computes the same `HisaabSummaryData` (today's udhaar/payments/advance totals,
  old-udhaar customers, low-stock items via [[Inventory Contract]]'s `isLowStock`) regardless of
  whether an API key is present.
- If `OPENAI_API_KEY` is set, `backend/lib/hisaab-summary-llm.ts` turns that data into a short Hinglish
  paragraph. It must fail closed: any network error, non-200 response, or empty content falls
  straight through to the deterministic template — never a 500, never a blank card.
- If no key is set, `buildTemplatedSummary` in `backend/lib/hisaab-summary.ts` builds the same paragraph
  deterministically from the identical data, so the feature is fully usable with zero API keys.
- The response always reports which path produced it (`"ai"` or `"template"`) so the UI can be
  transparent about the source.
