import { describe, expect, it } from "vitest";
import { isLowStock, LOW_STOCK_THRESHOLD } from "../lib/inventory";

describe("inventory low-stock rule", () => {
  it("is not low stock comfortably above the threshold", () => {
    expect(isLowStock(50)).toBe(false);
  });

  it("is not low stock just above the threshold", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  it("is low stock exactly at the threshold", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
  });

  it("is low stock below the threshold", () => {
    expect(isLowStock(1)).toBe(true);
  });

  it("is low stock at zero", () => {
    expect(isLowStock(0)).toBe(true);
  });
});
