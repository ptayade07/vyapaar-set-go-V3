import { getCustomerBalanceDisplay, getSupplierBalanceDisplay } from "@/lib/balance";
import { formatMoneyPaise } from "@/lib/format";

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
      ? "border-red-200 bg-red-50 text-[#b42318]"
      : display.tone === "advance"
        ? "border-green-200 bg-green-50 text-[#16803c]"
        : "border-stone-200 bg-stone-100 text-stone-600";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-black ${color} ${
        large ? "px-4 py-3 text-2xl" : "px-3 py-2 text-sm"
      }`}
    >
      {display.label}
      {display.amountPaise > 0 ? ` ${formatMoneyPaise(display.amountPaise)}` : ""}
    </span>
  );
}
