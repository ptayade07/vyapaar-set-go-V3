import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseQuickEntryWithLlm } from "../lib/quick-entry-llm";

const customers = [{ id: "cust_ramesh", name: "Ramesh Kirana" }];

describe("quick-entry LLM fallback", () => {
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

    const result = await parseQuickEntryWithLlm("Ramesh ko 250 ka udhaar", customers);

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses a successful OpenAI JSON response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ customerName: "Ramesh Kirana", amountRupees: 250, type: "UDHAAR" }),
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const result = await parseQuickEntryWithLlm("Ramesh ko udhaar de diya, 250 rupaye ka", customers);

    expect(result).toEqual({ amountPaise: 25000, type: "UDHAAR", customerName: "Ramesh Kirana" });
  });

  it("fails closed when the API responds with an error status", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const result = await parseQuickEntryWithLlm("Ramesh ko 250 ka udhaar", customers);

    expect(result).toBeNull();
  });

  it("fails closed when fetch throws (network error)", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await parseQuickEntryWithLlm("Ramesh ko 250 ka udhaar", customers);

    expect(result).toBeNull();
  });

  it("fails closed when the model returns malformed JSON", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "not json" } }] }),
    }) as unknown as typeof fetch;

    const result = await parseQuickEntryWithLlm("Ramesh ko 250 ka udhaar", customers);

    expect(result).toBeNull();
  });
});
