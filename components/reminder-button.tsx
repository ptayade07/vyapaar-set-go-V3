"use client";

import { useMemo, useState } from "react";
import { formatMoneyPaise } from "@/lib/format";

type Props = {
  name: string;
  balancePaise: number;
};

export function ReminderButton({ name, balancePaise }: Props) {
  const [copied, setCopied] = useState(false);
  const message = useMemo(
    () =>
      `Namaste ${name} ji, aapke khate mein ${formatMoneyPaise(
        balancePaise,
      )} udhaar pending hai. Suvidha ke hisaab se payment bhej dijiye. Dhanyavaad.`,
    [name, balancePaise],
  );

  if (balancePaise <= 0) {
    return null;
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-3 text-sm font-bold text-[#6f6a60]">{message}</p>
      <button
        type="button"
        onClick={copyMessage}
        className="tap-target w-full rounded-md bg-[#f59e0b] px-4 py-3 text-base font-black text-[#1f271f] focus:outline-none focus:ring-2 focus:ring-[#16803c]"
      >
        {copied ? "Copied" : "Reminder bhejo"}
      </button>
    </div>
  );
}
