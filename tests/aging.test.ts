import { describe, expect, it } from "vitest";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "../lib/aging";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe("FIFO udhaar aging", () => {
  it("returns null when there are no transactions", () => {
    expect(computeOldestOpenUdhaarDate([])).toBeNull();
  });

  it("returns the udhaar date when it is fully unpaid", () => {
    const udhaarDate = daysAgo(20);
    const oldest = computeOldestOpenUdhaarDate([{ type: "UDHAAR", amountPaise: 50000, createdAt: udhaarDate }]);

    expect(oldest).toEqual(udhaarDate);
  });

  it("clears the queue once a payment fully settles the udhaar", () => {
    const oldest = computeOldestOpenUdhaarDate([
      { type: "UDHAAR", amountPaise: 50000, createdAt: daysAgo(10) },
      { type: "PAYMENT", amountPaise: 50000, createdAt: daysAgo(5) },
    ]);

    expect(oldest).toBeNull();
  });

  it("keeps the older udhaar open when a partial payment only consumes the newer one (FIFO order)", () => {
    const olderUdhaar = daysAgo(20);
    const oldest = computeOldestOpenUdhaarDate([
      { type: "UDHAAR", amountPaise: 30000, createdAt: olderUdhaar },
      { type: "UDHAAR", amountPaise: 20000, createdAt: daysAgo(5) },
      { type: "PAYMENT", amountPaise: 20000, createdAt: daysAgo(1) },
    ]);

    expect(oldest).toEqual(olderUdhaar);
  });

  it("has a later udhaar offset by a standing advance instead of opening the queue", () => {
    const oldest = computeOldestOpenUdhaarDate([
      { type: "ADVANCE", amountPaise: 100000, createdAt: daysAgo(10) },
      { type: "UDHAAR", amountPaise: 40000, createdAt: daysAgo(3) },
    ]);

    expect(oldest).toBeNull();
  });

  it("opens the queue with only the leftover once an udhaar exceeds standing advance", () => {
    const udhaarDate = daysAgo(3);
    const oldest = computeOldestOpenUdhaarDate([
      { type: "ADVANCE", amountPaise: 30000, createdAt: daysAgo(10) },
      { type: "UDHAAR", amountPaise: 50000, createdAt: udhaarDate },
    ]);

    expect(oldest).toEqual(udhaarDate);
  });
});

describe("daysBetweenNow", () => {
  it("returns 0 for today", () => {
    expect(daysBetweenNow(new Date())).toBe(0);
  });

  it("returns the correct whole-day count for a past date", () => {
    expect(daysBetweenNow(daysAgo(15))).toBe(15);
  });
});
