"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhotoAttach } from "@/frontend/components/photo-attach";

export type CustomerTxnType = "UDHAAR" | "PAYMENT" | "ADVANCE";

const META: Record<CustomerTxnType, { label: string; subtitle: string; badgeClass: string; buttonClass: string }> = {
  UDHAAR: {
    label: "Udhaar Diya",
    subtitle: "Gave on credit",
    badgeClass: "bg-red-50 text-red-700",
    buttonClass: "bg-red-500 hover:bg-red-600",
  },
  PAYMENT: {
    label: "Payment Liya",
    subtitle: "Received payment",
    badgeClass: "bg-green-50 text-green-700",
    buttonClass: "bg-green-600 hover:bg-green-700",
  },
  ADVANCE: {
    label: "Advance Liya",
    subtitle: "Advance received",
    badgeClass: "bg-blue-50 text-blue-700",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
};

type Props = {
  type: CustomerTxnType;
  customerName: string;
  action: (formData: FormData) => Promise<void>;
  allowPhoto: boolean;
  onClose: () => void;
};

export function QuickTxnModal({ type, customerName, action, allowPhoto, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      router.refresh();
      onClose();
    });
  }

  const meta = META[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] w-full space-y-5 overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${meta.badgeClass}`}>
              {meta.label}
            </span>
            <p className="mt-2 max-w-xs truncate text-2xl font-bold text-gray-900">{customerName}</p>
            <p className="text-xs text-gray-500">{meta.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          <div className="relative">
            <span className="font-mono-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-4xl font-bold text-gray-300">
              ₹
            </span>
            <input
              ref={inputRef}
              name="amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="0"
              className="font-mono-num h-20 w-full rounded-2xl border-2 border-orange-200 pl-14 pr-4 text-4xl font-bold text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>
          <input
            name="description"
            placeholder="Note (optional)"
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
          />
          {allowPhoto ? <PhotoAttach /> : null}
          <button
            type="submit"
            disabled={isPending}
            className={`h-16 w-full rounded-2xl text-lg font-bold text-white transition active:scale-95 disabled:opacity-60 ${meta.buttonClass}`}
          >
            {isPending ? "..." : "Enter dabao — Save"}
          </button>
          <p className="text-center text-xs text-gray-400">Tip: Enter dabao save karne ke liye</p>
        </form>
      </div>
    </div>
  );
}
