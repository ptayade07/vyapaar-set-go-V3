import type { QuickEntryCustomerMatch, QuickEntryType } from "./quick-entry";

export type QuickEntryLlmResult = {
  amountPaise: number | null;
  type: QuickEntryType | null;
  customerName: string | null;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

function isQuickEntryType(value: unknown): value is QuickEntryType {
  return value === "UDHAAR" || value === "PAYMENT" || value === "ADVANCE";
}

export async function parseQuickEntryWithLlm(
  text: string,
  customers: QuickEntryCustomerMatch[],
): Promise<QuickEntryLlmResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const knownNames = customers.map((customer) => customer.name).join(", ") || "none yet";

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract a shop khata (ledger) entry from one Hinglish sentence written by a small " +
              "Indian shopkeeper. Reply with strict JSON only, no prose: " +
              '{"customerName": string|null, "amountRupees": number|null, "type": "UDHAAR"|"PAYMENT"|"ADVANCE"|null}. ' +
              "UDHAAR means the shopkeeper gave goods on credit. PAYMENT means the shopkeeper received a payment " +
              "from the customer. ADVANCE means the shopkeeper received money ahead of goods. " +
              `Known existing customers: ${knownNames}. If the sentence clearly refers to one of them, use their ` +
              "exact existing name; otherwise return the customer's name as written.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      customerName?: string | null;
      amountRupees?: number | null;
      type?: string | null;
    };

    const amountPaise =
      typeof parsed.amountRupees === "number" && Number.isFinite(parsed.amountRupees) && parsed.amountRupees > 0
        ? Math.round(parsed.amountRupees * 100)
        : null;
    const type = isQuickEntryType(parsed.type) ? parsed.type : null;
    const customerName =
      typeof parsed.customerName === "string" && parsed.customerName.trim() ? parsed.customerName.trim() : null;

    return { amountPaise, type, customerName };
  } catch {
    return null;
  }
}
