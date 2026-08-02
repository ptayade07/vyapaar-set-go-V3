import { describe, expect, it } from "vitest";
import { parseQuickEntryDeterministic } from "../lib/quick-entry";

const knownCustomers = [
  { id: "cust_ramesh", name: "Ramesh Kirana" },
  { id: "cust_sunita", name: "Sunita Sharma" },
  { id: "cust_meena", name: "Meena Boutique" },
];

describe("quick-entry deterministic parser", () => {
  it("parses a udhaar sentence for a known customer", () => {
    const result = parseQuickEntryDeterministic("Ramesh ko 250 ka udhaar", knownCustomers);

    expect(result).toMatchObject({
      amountPaise: 25000,
      type: "UDHAAR",
      customerId: "cust_ramesh",
      customerName: "Ramesh Kirana",
      complete: true,
    });
  });

  it("parses a payment-liya sentence for a known customer", () => {
    const result = parseQuickEntryDeterministic("Sunita se 500 payment liya", knownCustomers);

    expect(result).toMatchObject({
      amountPaise: 50000,
      type: "PAYMENT",
      customerId: "cust_sunita",
      customerName: "Sunita Sharma",
      complete: true,
    });
  });

  it("parses an advance sentence with comma-grouped amount", () => {
    const result = parseQuickEntryDeterministic("Meena Boutique se 1,500 advance liya", knownCustomers);

    expect(result).toMatchObject({
      amountPaise: 150000,
      type: "ADVANCE",
      customerId: "cust_meena",
      complete: true,
    });
  });

  it("falls back to bare liya/diya keywords when udhaar/payment/advance are absent", () => {
    const gave = parseQuickEntryDeterministic("Ramesh ko 300 diya", knownCustomers);
    const received = parseQuickEntryDeterministic("Ramesh se 300 liya", knownCustomers);

    expect(gave.type).toBe("UDHAAR");
    expect(received.type).toBe("PAYMENT");
  });

  it("guesses a name and reports no customer match for an unknown customer", () => {
    const result = parseQuickEntryDeterministic("Naya Grahak ko 300 ka udhaar", knownCustomers);

    expect(result.customerId).toBeNull();
    expect(result.customerName).toBe("Naya Grahak");
    expect(result.amountPaise).toBe(30000);
    expect(result.type).toBe("UDHAAR");
    expect(result.complete).toBe(true);
  });

  it("is incomplete when the amount is missing", () => {
    const result = parseQuickEntryDeterministic("Ramesh ko udhaar", knownCustomers);

    expect(result.amountPaise).toBeNull();
    expect(result.complete).toBe(false);
  });

  it("is incomplete when no type keyword is present", () => {
    const result = parseQuickEntryDeterministic("Ramesh ko 250", knownCustomers);

    expect(result.type).toBeNull();
    expect(result.complete).toBe(false);
  });

  it("rejects an unrealistically large amount instead of overflowing", () => {
    // A digit-bearing name (or a stray long number) must never produce a runaway paise value.
    const result = parseQuickEntryDeterministic("Chotu1785688809637 se 175 payment liya", knownCustomers);

    expect(result.amountPaise).toBeNull();
    expect(result.complete).toBe(false);
  });
});
