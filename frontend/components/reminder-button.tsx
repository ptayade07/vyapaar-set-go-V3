"use client";

import { Copy, MessageCircle } from "lucide-react";
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
      `Namaste ${name} ji 🙏\nAapka udhaar ${formatMoneyPaise(
        balancePaise,
      )} pending hai. Kripya jald payment karein.\nDhanyavaad!`,
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
    <>
      <button
        type="button"
        onClick={copyMessage}
        className="tap-target inline-flex items-center gap-2 rounded-xl bg-gray-100 px-5 font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-95"
      >
        <Copy className="h-4 w-4" /> {copied ? "Copied" : "Reminder copy karo"}
      </button>
      <button
        type="button"
        onClick={shareOnWhatsapp}
        className="tap-target inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700 active:scale-95"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp par bhejo
      </button>
    </>
  );
}
