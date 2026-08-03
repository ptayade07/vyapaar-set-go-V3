"use client";

import { useMemo, useState } from "react";
import { formatMoneyPaise } from "@/backend/lib/format";

type Props = {
  name: string;
  phone: string | null;
  balancePaise: number;
};

export function ReminderButton({ name, phone, balancePaise }: Props) {
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

  function shareOnWhatsapp() {
    const digits = (phone || "").replace(/\D/g, "");
    const text = encodeURIComponent(message);
    const url = digits ? `https://wa.me/91${digits}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div className="tactile-card p-4">
      <p className="mb-3 text-sm font-bold text-gray-600">{message}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={copyMessage}
          className="tap-target flex-1 rounded-xl bg-gray-100 px-4 text-base font-black text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-600"
        >
          {copied ? "Copied" : "Reminder copy karo"}
        </button>
        <button
          type="button"
          onClick={shareOnWhatsapp}
          className="tap-target flex-1 rounded-xl bg-green-600 px-4 text-base font-black text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          WhatsApp par bhejo
        </button>
      </div>
    </div>
  );
}
