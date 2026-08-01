import { describe, expect, it } from "vitest";
import { applyCustomerEntry, getCustomerBalanceDisplay } from "../lib/balance";

describe("customer signed-balance engine", () => {
  it("tracks pure udhaar as positive balance", () => {
    const balance = applyCustomerEntry(0, "UDHAAR", 50000);

    expect(balance).toBe(50000);
    expect(getCustomerBalanceDisplay(balance)).toEqual({
      label: "Udhaar",
      amountPaise: 50000,
      tone: "udhaar",
    });
  });

  it("settles exactly when payment equals udhaar", () => {
    const afterUdhaar = applyCustomerEntry(0, "UDHAAR", 90000);
    const balance = applyCustomerEntry(afterUdhaar, "PAYMENT", 90000);

    expect(balance).toBe(0);
    expect(getCustomerBalanceDisplay(balance)).toEqual({
      label: "Settled",
      amountPaise: 0,
      tone: "settled",
    });
  });

  it("flips overpayment into customer advance", () => {
    const afterUdhaar = applyCustomerEntry(0, "UDHAAR", 70000);
    const balance = applyCustomerEntry(afterUdhaar, "PAYMENT", 100000);

    expect(balance).toBe(-30000);
    expect(getCustomerBalanceDisplay(balance)).toEqual({
      label: "Advance",
      amountPaise: 30000,
      tone: "advance",
    });
  });

  it("draws down advance when udhaar is later given", () => {
    const afterAdvance = applyCustomerEntry(0, "ADVANCE", 120000);
    const balance = applyCustomerEntry(afterAdvance, "UDHAAR", 45000);

    expect(balance).toBe(-75000);
    expect(getCustomerBalanceDisplay(balance)).toEqual({
      label: "Advance",
      amountPaise: 75000,
      tone: "advance",
    });
  });
});
