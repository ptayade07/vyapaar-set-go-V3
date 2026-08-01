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
