"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SupplierTxnType = "CREDIT" | "PAYMENT";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export function SupplierTxnPanel({ action }: Props) {
  const router = useRouter();
  const [type, setType] = useState<SupplierTxnType | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      router.refresh();
      setType(null);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setType("CREDIT")}
          className="flex h-16 flex-col items-center justify-center rounded-2xl bg-red-500 font-semibold text-white shadow-md transition hover:bg-red-600 active:scale-95"
        >
          <span className="text-lg">Maal Liya</span>
          <span className="text-[11px] opacity-80">Stock on credit</span>
        </button>
        <button
          type="button"
          onClick={() => setType("PAYMENT")}
          className="flex h-16 flex-col items-center justify-center rounded-2xl bg-green-600 font-semibold text-white shadow-md transition hover:bg-green-700 active:scale-95"
        >
          <span className="text-lg">Payment Diya</span>
          <span className="text-[11px] opacity-80">Paid to supplier</span>
        </button>
      </div>

      {type ? (
        <form action={handleSubmit} className="tactile-card space-y-4 p-6">
          <input type="hidden" name="type" value={type} />
          <h3 className="text-xl font-bold text-gray-900">{type === "CREDIT" ? "Maal Liya" : "Payment Diya"}</h3>
          <div className="relative">
            <span className="font-mono-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
              ₹
            </span>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              required
              autoFocus
              placeholder="0"
              className="font-mono-num h-16 w-full rounded-xl border-2 border-orange-200 pl-10 pr-4 text-3xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <input
            name="description"
            placeholder="Note (optional)"
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          {type === "CREDIT" ? (
            <div>
              <label className="mb-1 block text-sm text-gray-600">Due date (optional)</label>
              <input
                name="dueDate"
                type="date"
                className="h-14 w-full rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          ) : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="h-14 flex-1 rounded-2xl bg-orange-600 text-lg font-bold text-white disabled:opacity-50"
            >
              {isPending ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setType(null)}
              disabled={isPending}
              className="h-14 rounded-2xl bg-gray-100 px-6 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
