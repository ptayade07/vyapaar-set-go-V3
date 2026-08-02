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

Supplier balances are also stored as signed paise, from the shopkeeper's point of view:

- Positive supplier balance means the shopkeeper owes the supplier: display as `Dena hai`.
- `Maal Liya` increases supplier balance by the amount.
- `Payment Diya` decreases supplier balance by the amount.

## Quick Entry Parsing Contract

The Dashboard quick-entry box turns one Hinglish sentence (e.g. "Ramesh ko 250 ka udhaar") into a
customer transaction. Only customer entries (`UDHAAR` / `PAYMENT` / `ADVANCE`) are supported here —
suppliers are not parsed from free text.

- The deterministic rule parser (`lib/quick-entry.ts`) always runs first: it has no external
  dependency and needs no API key. It extracts an amount, a type keyword, and a customer name
  (preferring an exact match against existing customers), and reports whether the parse is
  `complete` (amount + type + a customer name all present).
- The LLM fallback (`lib/quick-entry-llm.ts`) only runs when the rule parser's result is
  **not** complete AND `process.env.OPENAI_API_KEY` is set. It must fail closed: any network
  error, non-200 response, or malformed JSON returns `null` rather than throwing, so a missing or
  misbehaving key never breaks the deterministic path.
- A parse is never auto-saved. The server always returns a parsed payload for the client to render
  as a confirmation card; the shopkeeper must explicitly confirm before `confirmQuickEntry` writes
  anything.
- If the parsed customer name does not match an existing customer, `customerId` is `null` and the
  confirmation card offers to create that customer inline as part of the same confirm action —
  never silently.
- If the parse is incomplete after both stages, no confirmation card is shown; the shopkeeper is
  pointed at the manual entry form instead of guessing.
