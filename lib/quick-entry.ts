export type QuickEntryType = "UDHAAR" | "PAYMENT" | "ADVANCE";

export type QuickEntryCustomerMatch = {
  id: string;
  name: string;
};

export type QuickEntryParseResult = {
  raw: string;
  amountPaise: number | null;
  type: QuickEntryType | null;
  customerName: string | null;
  customerId: string | null;
  complete: boolean;
};

const TYPE_RULES: { pattern: RegExp; type: QuickEntryType }[] = [
  { pattern: /advance/i, type: "ADVANCE" },
  { pattern: /udhaar/i, type: "UDHAAR" },
  { pattern: /payment/i, type: "PAYMENT" },
  { pattern: /\bliya\b/i, type: "PAYMENT" },
  { pattern: /\bdiya\b/i, type: "UDHAAR" },
];

const AMOUNT_PATTERN = /₹?\s*(\d[\d,]*(?:\.\d{1,2})?)/;

// Comfortably above any real single kirana/shop entry, and well inside Postgres's 32-bit Int
// column range (max ~₹2.14 crore in paise) so a stray large number never overflows on save.
export const MAX_QUICK_ENTRY_AMOUNT_PAISE = 10_00_000 * 100;

const STOPWORDS = new Set([
  "ko",
  "se",
  "ka",
  "ki",
  "ke",
  "liya",
  "diya",
  "udhaar",
  "payment",
  "advance",
  "rupaye",
  "rupees",
  "rupaya",
  "rs",
  "hai",
]);

export function extractAmountPaise(text: string): number | null {
  const match = text.match(AMOUNT_PATTERN);
  if (!match) return null;

  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  const amountPaise = Math.round(numeric * 100);
  if (amountPaise > MAX_QUICK_ENTRY_AMOUNT_PAISE) return null;

  return amountPaise;
}

export function extractType(text: string): QuickEntryType | null {
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(text)) return rule.type;
  }
  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function matchKnownCustomer(
  text: string,
  customers: QuickEntryCustomerMatch[],
): QuickEntryCustomerMatch | null {
  if (customers.length === 0) return null;

  const byLengthDesc = [...customers].sort((a, b) => b.name.length - a.name.length);

  for (const customer of byLengthDesc) {
    const pattern = new RegExp(`\\b${escapeRegExp(customer.name)}\\b`, "i");
    if (pattern.test(text)) return customer;
  }

  for (const customer of byLengthDesc) {
    const firstName = customer.name.split(/\s+/)[0];
    const pattern = new RegExp(`\\b${escapeRegExp(firstName)}\\b`, "i");
    if (pattern.test(text)) return customer;
  }

  return null;
}

export function guessCustomerName(text: string): string | null {
  const koSeMatch = text.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:ko|se)\b/i);
  if (koSeMatch) {
    return koSeMatch[1]
      .split(/\s+/)
      .map(capitalize)
      .join(" ");
  }

  const words = text
    .replace(/[₹,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^\d+(\.\d+)?$/.test(word))
    .filter((word) => !STOPWORDS.has(word.toLowerCase()));

  return words.length > 0 ? capitalize(words[0]) : null;
}

export function parseQuickEntryDeterministic(
  text: string,
  customers: QuickEntryCustomerMatch[],
): QuickEntryParseResult {
  const raw = text.trim();
  const amountPaise = extractAmountPaise(raw);
  const type = extractType(raw);
  const matchedCustomer = matchKnownCustomer(raw, customers);
  const customerName = matchedCustomer?.name ?? guessCustomerName(raw);

  return {
    raw,
    amountPaise,
    type,
    customerName,
    customerId: matchedCustomer?.id ?? null,
    complete: amountPaise !== null && type !== null && customerName !== null,
  };
}
