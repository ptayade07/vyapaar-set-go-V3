import { getCustomerBalanceDisplay, getSupplierBalanceDisplay } from "@/backend/lib/balance";
import { Money } from "@/frontend/components/money";

type Props = {
  balancePaise: number;
  kind?: "customer" | "supplier";
  large?: boolean;
};

export function BalanceBadge({ balancePaise, kind = "customer", large = false }: Props) {
  const display =
    kind === "customer" ? getCustomerBalanceDisplay(balancePaise) : getSupplierBalanceDisplay(balancePaise);
  const color =
    display.tone === "udhaar"
      ? "border-red-100 bg-red-50 text-red-700"
      : display.tone === "advance"
        ? "border-green-100 bg-green-50 text-green-700"
        : "border-transparent bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${color} ${
        large ? "px-4 py-2 text-base" : "px-3 py-1 text-sm"
      }`}
    >
      {display.label}
      {display.amountPaise > 0 ? <>{" "}<Money amountPaise={display.amountPaise} /></> : null}
    </span>
  );
}
