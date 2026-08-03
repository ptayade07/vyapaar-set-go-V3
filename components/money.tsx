import { formatMoneyPaise } from "@/backend/lib/format";

type Props = {
  amountPaise: number;
  className?: string;
};

export function Money({ amountPaise, className = "" }: Props) {
  return <span className={`font-mono-num ${className}`}>{formatMoneyPaise(amountPaise)}</span>;
}
