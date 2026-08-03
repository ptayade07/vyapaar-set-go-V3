import { describe, expect, it } from "vitest";
import { buildHisaabSummaryPrompt, buildTemplatedSummary, type HisaabSummaryData } from "../backend/lib/hisaab-summary";

function baseData(overrides: Partial<HisaabSummaryData> = {}): HisaabSummaryData {
  return {
    dateLabel: "02/08/2026",
    udhaarTotalPaise: 0,
    paymentsTotalPaise: 0,
    advanceTotalPaise: 0,
    netPaise: 0,
    oldUdhaarCustomers: [],
    lowStockItems: [],
    ...overrides,
  };
}

describe("buildTemplatedSummary", () => {
  it("describes a quiet day with no activity", () => {
    const summary = buildTemplatedSummary(baseData());

    expect(summary).toContain("koi naya udhaar nahi diya gaya");
    expect(summary).toContain("koi payment ya advance nahi aaya");
    expect(summary).toContain("net fayda ₹0");
  });

  it("reports udhaar, payments, and a profit day", () => {
    const summary = buildTemplatedSummary(
      baseData({ udhaarTotalPaise: 50000, paymentsTotalPaise: 80000, netPaise: 30000 }),
    );

    expect(summary).toContain("₹500 ka udhaar diya gaya");
    expect(summary).toContain("₹800 payment mila");
    expect(summary).toContain("net fayda ₹300");
  });

  it("reports a loss day when udhaar exceeds collections", () => {
    const summary = buildTemplatedSummary(baseData({ udhaarTotalPaise: 100000, netPaise: -100000 }));

    expect(summary).toContain("net ghata ₹1,000");
  });

  it("mentions advance separately from payment when both occur", () => {
    const summary = buildTemplatedSummary(baseData({ paymentsTotalPaise: 20000, advanceTotalPaise: 10000 }));

    expect(summary).toContain("₹200 payment aur ₹100 advance mila");
  });

  it("calls out old-udhaar customers by name", () => {
    const summary = buildTemplatedSummary(
      baseData({
        oldUdhaarCustomers: [
          { name: "Ramesh Kirana", balancePaise: 150000, daysOld: 20 },
          { name: "Sunita Sharma", balancePaise: 50000, daysOld: 18 },
        ],
      }),
    );

    expect(summary).toContain("2 customer ka udhaar 15 din se purana hai");
    expect(summary).toContain("Ramesh Kirana");
    expect(summary).toContain("Sunita Sharma");
    expect(summary).toContain("reminder bhejo");
  });

  it("calls out low-stock items by name", () => {
    const summary = buildTemplatedSummary(
      baseData({ lowStockItems: [{ name: "Sarson Tel 1L", quantity: 4 }] }),
    );

    expect(summary).toContain("1 item mein kam stock hai");
    expect(summary).toContain("Sarson Tel 1L");
    expect(summary).toContain("order karo");
  });

  it("omits old-udhaar and low-stock sentences entirely when there are none", () => {
    const summary = buildTemplatedSummary(baseData());

    expect(summary).not.toContain("purana hai");
    expect(summary).not.toContain("kam stock hai");
  });

  it("truncates long name lists with a remainder count", () => {
    const summary = buildTemplatedSummary(
      baseData({
        oldUdhaarCustomers: [
          { name: "A", balancePaise: 100, daysOld: 16 },
          { name: "B", balancePaise: 100, daysOld: 16 },
          { name: "C", balancePaise: 100, daysOld: 16 },
          { name: "D", balancePaise: 100, daysOld: 16 },
        ],
      }),
    );

    expect(summary).toContain("A, B, C aur 1 aur");
  });
});

describe("buildHisaabSummaryPrompt", () => {
  it("includes every numeric field and explicit none markers when empty", () => {
    const prompt = buildHisaabSummaryPrompt(baseData({ dateLabel: "02/08/2026" }));

    expect(prompt).toContain("Date: 02/08/2026");
    expect(prompt).toContain("Udhaar given today: ₹0");
    expect(prompt).toContain("Customers with udhaar older than 15 days: none");
    expect(prompt).toContain("Low stock items: none");
  });

  it("lists old-udhaar customers and low-stock items with their numbers", () => {
    const prompt = buildHisaabSummaryPrompt(
      baseData({
        oldUdhaarCustomers: [{ name: "Ramesh Kirana", balancePaise: 150000, daysOld: 20 }],
        lowStockItems: [{ name: "Toothpaste", quantity: 3 }],
      }),
    );

    expect(prompt).toContain("Ramesh Kirana (₹1,500, 20 days)");
    expect(prompt).toContain("Toothpaste (qty 3)");
  });

  it("labels a negative net as a loss", () => {
    const prompt = buildHisaabSummaryPrompt(baseData({ netPaise: -5000 }));

    expect(prompt).toContain("Net for the day: loss of ₹50");
  });
});
