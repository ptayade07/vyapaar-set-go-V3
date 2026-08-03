export type CashMilaoVerdict = "match" | "short" | "extra";

export function computeExpectedCashPaise(
  openingPaise: number,
  paymentsTotalPaise: number,
  advanceTotalPaise: number,
  supplierPaymentsTodayPaise: number,
): number {
  return openingPaise + paymentsTotalPaise + advanceTotalPaise - supplierPaymentsTodayPaise;
}

const MATCH_TOLERANCE_PAISE = 50;

export function getCashMilaoVerdict(actualPaise: number, expectedPaise: number): CashMilaoVerdict {
  const diff = actualPaise - expectedPaise;
  if (Math.abs(diff) < MATCH_TOLERANCE_PAISE) return "match";
  return diff < 0 ? "short" : "extra";
}
