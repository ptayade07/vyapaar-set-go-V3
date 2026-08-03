import { describe, expect, it } from "vitest";
import { computeExpectedCashPaise, getCashMilaoVerdict } from "../lib/cash-milao";

describe("computeExpectedCashPaise", () => {
  it("adds opening cash and today's cash-in, then subtracts supplier payments", () => {
    const expected = computeExpectedCashPaise(500000, 200000, 50000, 100000);
    expect(expected).toBe(650000);
  });

  it("handles a zero opening balance", () => {
    expect(computeExpectedCashPaise(0, 100000, 0, 0)).toBe(100000);
  });
});

describe("getCashMilaoVerdict", () => {
  it("reports a match within the rounding tolerance", () => {
    expect(getCashMilaoVerdict(100000, 100000)).toBe("match");
    expect(getCashMilaoVerdict(100030, 100000)).toBe("match");
  });

  it("reports short when actual cash is under expected", () => {
    expect(getCashMilaoVerdict(90000, 100000)).toBe("short");
  });

  it("reports extra when actual cash is over expected", () => {
    expect(getCashMilaoVerdict(110000, 100000)).toBe("extra");
  });
});
