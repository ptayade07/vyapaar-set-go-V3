import { getCustomerBalanceDisplay, getSupplierBalanceDisplay } from "@/backend/lib/balance";
import { Money } from "@/frontend/components/money";

type Props = {
  balancePaise: number;
  kind?: "customer" | "supplier";
};

export function BalanceText({ balancePaise, kind = "customer" }: Props) {
  const display =
    kind === "customer" ? getCustomerBalanceDisplay(balancePaise) : getSupplierBalanceDisplay(balancePaise);

  if (display.tone === "settled") {
    return <span className="text-lg font-semibold text-gray-500">Settled</span>;
  }

  const color = display.tone === "udhaar" ? "text-red-600" : "text-green-700";

  return (
    <div className="text-right">
      <Money amountPaise={display.amountPaise} className={`block text-2xl font-bold sm:text-3xl ${color}`} />
      <div className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{display.label}</div>
    </div>
  );
}
