import { formatMoneyPaise } from "./format";

export type HisaabOldUdhaarCustomer = {
  name: string;
  balancePaise: number;
  daysOld: number;
};

export type HisaabLowStockItem = {
  name: string;
  quantity: number;
};

export type HisaabSummaryData = {
  dateLabel: string;
  udhaarTotalPaise: number;
  paymentsTotalPaise: number;
  advanceTotalPaise: number;
  netPaise: number;
  oldUdhaarCustomers: HisaabOldUdhaarCustomer[];
  lowStockItems: HisaabLowStockItem[];
};

function listNames(items: { name: string }[], max = 3) {
  const names = items.slice(0, max).map((item) => item.name);
  const remaining = items.length - names.length;
  return remaining > 0 ? `${names.join(", ")} aur ${remaining} aur` : names.join(", ");
}

export function buildTemplatedSummary(data: HisaabSummaryData): string {
  const sentences: string[] = [];

  sentences.push(`${data.dateLabel} ka hisaab:`);

  if (data.udhaarTotalPaise > 0) {
    sentences.push(`Aaj ${formatMoneyPaise(data.udhaarTotalPaise)} ka udhaar diya gaya.`);
  } else {
    sentences.push("Aaj koi naya udhaar nahi diya gaya.");
  }

  if (data.paymentsTotalPaise > 0 || data.advanceTotalPaise > 0) {
    const parts: string[] = [];
    if (data.paymentsTotalPaise > 0) parts.push(`${formatMoneyPaise(data.paymentsTotalPaise)} payment`);
    if (data.advanceTotalPaise > 0) parts.push(`${formatMoneyPaise(data.advanceTotalPaise)} advance`);
    sentences.push(`${parts.join(" aur ")} mila.`);
  } else {
    sentences.push("Aaj koi payment ya advance nahi aaya.");
  }

  sentences.push(
    `Din ka net ${data.netPaise >= 0 ? "fayda" : "ghata"} ${formatMoneyPaise(Math.abs(data.netPaise))} raha.`,
  );

  if (data.oldUdhaarCustomers.length > 0) {
    sentences.push(
      `${data.oldUdhaarCustomers.length} customer ka udhaar 15 din se purana hai (${listNames(data.oldUdhaarCustomers)}) — reminder bhejo.`,
    );
  }

  if (data.lowStockItems.length > 0) {
    sentences.push(
      `${data.lowStockItems.length} item mein kam stock hai (${listNames(data.lowStockItems)}) — order karo.`,
    );
  }

  return sentences.join(" ");
}

export function buildHisaabSummaryPrompt(data: HisaabSummaryData): string {
  const lines = [
    `Date: ${data.dateLabel}`,
    `Udhaar given today: ${formatMoneyPaise(data.udhaarTotalPaise)}`,
    `Payments received today: ${formatMoneyPaise(data.paymentsTotalPaise)}`,
    `Advance collected today: ${formatMoneyPaise(data.advanceTotalPaise)}`,
    `Net for the day: ${data.netPaise >= 0 ? "profit" : "loss"} of ${formatMoneyPaise(Math.abs(data.netPaise))}`,
  ];

  lines.push(
    data.oldUdhaarCustomers.length > 0
      ? `Customers with udhaar older than 15 days: ${data.oldUdhaarCustomers
          .map((customer) => `${customer.name} (${formatMoneyPaise(customer.balancePaise)}, ${customer.daysOld} days)`)
          .join(", ")}`
      : "Customers with udhaar older than 15 days: none",
  );

  lines.push(
    data.lowStockItems.length > 0
      ? `Low stock items (quantity 5 or below): ${data.lowStockItems
          .map((item) => `${item.name} (qty ${item.quantity})`)
          .join(", ")}`
      : "Low stock items: none",
  );

  return lines.join("\n");
}
