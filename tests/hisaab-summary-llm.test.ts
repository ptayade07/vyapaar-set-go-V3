import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateHisaabSummaryWithLlm } from "../backend/lib/hisaab-summary-llm";
import type { HisaabSummaryData } from "../backend/lib/hisaab-summary";

const data: HisaabSummaryData = {
  dateLabel: "02/08/2026",
  udhaarTotalPaise: 50000,
  paymentsTotalPaise: 80000,
  advanceTotalPaise: 0,
  netPaise: 30000,
  oldUdhaarCustomers: [],
  lowStockItems: [],
};

describe("hisaab summary LLM fallback", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns null without calling the network when no API key is set", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the trimmed model content on success", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  Aaj accha din raha, ₹800 payment aaya.  " } }],
      }),
    }) as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBe("Aaj accha din raha, ₹800 payment aaya.");
  });

  it("fails closed on a non-200 response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBeNull();
  });

  it("fails closed when fetch throws", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBeNull();
  });

  it("fails closed on empty content", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "   " } }] }),
    }) as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBeNull();
  });

  it("fails closed when the response body is malformed", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("invalid json");
      },
    }) as unknown as typeof fetch;

    const result = await generateHisaabSummaryWithLlm(data);

    expect(result).toBeNull();
  });
});
