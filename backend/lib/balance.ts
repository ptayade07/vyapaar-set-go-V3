export type CustomerEntryType = "UDHAAR" | "PAYMENT" | "ADVANCE";
export type SupplierEntryType = "CREDIT" | "PAYMENT";

export type DisplayTone = "udhaar" | "advance" | "settled";

export function applyCustomerEntry(
  currentBalancePaise: number,
  type: CustomerEntryType,
  amountPaise: number,
) {
  assertPositiveAmount(amountPaise);

  if (type === "UDHAAR") {
    return currentBalancePaise + amountPaise;
  }

  return currentBalancePaise - amountPaise;
}

export function applySupplierEntry(
  currentBalancePaise: number,
  type: SupplierEntryType,
  amountPaise: number,
) {
  assertPositiveAmount(amountPaise);

  if (type === "CREDIT") {
    return currentBalancePaise + amountPaise;
  }

  return currentBalancePaise - amountPaise;
}

export function getCustomerBalanceDisplay(balancePaise: number) {
  if (balancePaise > 0) {
    return { label: "Udhaar", amountPaise: balancePaise, tone: "udhaar" as DisplayTone };
  }

  if (balancePaise < 0) {
    return { label: "Advance", amountPaise: Math.abs(balancePaise), tone: "advance" as DisplayTone };
  }

  return { label: "Settled", amountPaise: 0, tone: "settled" as DisplayTone };
}

export function getSupplierBalanceDisplay(balancePaise: number) {
  if (balancePaise > 0) {
    return { label: "Dena hai", amountPaise: balancePaise, tone: "udhaar" as DisplayTone };
  }

  if (balancePaise < 0) {
    return { label: "Advance diya", amountPaise: Math.abs(balancePaise), tone: "advance" as DisplayTone };
  }

  return { label: "Settled", amountPaise: 0, tone: "settled" as DisplayTone };
}

function assertPositiveAmount(amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Amount must be a positive integer paise value.");
  }
}
