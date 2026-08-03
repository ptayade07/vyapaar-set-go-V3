"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOpeningCash } from "@/app/actions";
import { computeExpectedCashPaise, getCashMilaoVerdict } from "@/lib/cash-milao";
import { formatMoneyPaise } from "@/lib/format";

type Props = {
  date: string;
  openingPaise: number;
  paymentsTotalPaise: number;
  advanceTotalPaise: number;
  supplierPaymentsTodayPaise: number;
};

export function CashMilao({ date, openingPaise, paymentsTotalPaise, advanceTotalPaise, supplierPaymentsTodayPaise }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(String(openingPaise / 100));
  const [actual, setActual] = useState("");
  const [isPending, startTransition] = useTransition();

  const openingPaiseValue = Math.round((parseFloat(opening) || 0) * 100);
  const expectedPaise = computeExpectedCashPaise(
    openingPaiseValue,
    paymentsTotalPaise,
    advanceTotalPaise,
    supplierPaymentsTodayPaise,
  );
  const actualPaise = actual === "" ? null : Math.round((parseFloat(actual) || 0) * 100);
  const verdict = actualPaise !== null ? getCashMilaoVerdict(actualPaise, expectedPaise) : null;

  function saveOpening() {
    startTransition(async () => {
      await setOpeningCash(date, openingPaiseValue);
      router.refresh();
    });
  }

  return (
    <section className="tactile-card p-6" data-testid="cash-milao-card">
      <h2 className="text-xl font-black text-gray-900">Cash Milao</h2>
      <p className="mb-4 text-sm font-semibold text-gray-500">Cash Reconciliation</p>

      <label className="grid gap-2 text-sm font-bold text-gray-700">
        Opening cash
        <div className="flex gap-2">
          <div className="tap-target flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-gray-300 bg-white px-3">
            <span className="text-gray-400">₹</span>
            <input
              data-testid="opening-cash-input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
              onBlur={saveOpening}
              className="min-w-0 flex-1 bg-transparent text-lg font-black focus:outline-none"
            />
          </div>
          <button
            type="button"
            data-testid="save-opening-btn"
            onClick={saveOpening}
            disabled={isPending}
            className="tap-target rounded-xl bg-gray-100 px-4 text-sm font-black text-gray-800 hover:bg-gray-200 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </label>

      <div data-testid="cash-calculation" className="mt-4 rounded-xl bg-orange-50/50 p-4">
        <Row label="Opening cash" sign="+" amountPaise={openingPaiseValue} />
        <Row label="Cash received" sign="+" amountPaise={paymentsTotalPaise + advanceTotalPaise} />
        <Row label="Paid to suppliers" sign="−" amountPaise={supplierPaymentsTodayPaise} />
        <div className="mt-2 flex items-center justify-between border-t border-orange-200 pt-2">
          <span className="text-sm font-bold text-gray-700">Expected drawer cash</span>
          <span data-testid="expected-cash" className="font-mono-num text-2xl font-bold text-orange-700">
            {formatMoneyPaise(expectedPaise)}
          </span>
        </div>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-bold text-gray-700">
        Actual counted cash
        <div className="tap-target flex items-center gap-1 rounded-xl border-2 border-orange-200 bg-white px-3">
          <span className="text-gray-400">₹</span>
          <input
            data-testid="actual-cash-input"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={actual}
            onChange={(event) => setActual(event.target.value)}
            placeholder="Gine hue paise"
            className="min-w-0 flex-1 bg-transparent text-lg font-black focus:outline-none"
          />
        </div>
      </label>

      {verdict ? (
        <div data-testid="cash-diff-result" className="mt-4">
          {verdict === "match" ? (
            <div data-testid="cash-match" className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-black text-green-700">Match!</p>
                <p className="text-sm text-green-700/80">Cash tallies exactly</p>
              </div>
            </div>
          ) : verdict === "short" ? (
            <div data-testid="cash-short" className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-black text-red-700">{formatMoneyPaise(Math.abs((actualPaise ?? 0) - expectedPaise))} kam hai</p>
                <p className="text-sm text-red-700/80">Cash is short</p>
              </div>
            </div>
          ) : (
            <div data-testid="cash-extra" className="flex items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-black text-blue-700">{formatMoneyPaise((actualPaise ?? 0) - expectedPaise)} zyada hai</p>
                <p className="text-sm text-blue-700/80">Cash is extra</p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, sign, amountPaise }: { label: string; sign: "+" | "−"; amountPaise: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-600">
        {sign} {label}
      </span>
      <span className="font-mono-num font-bold text-gray-800">{formatMoneyPaise(amountPaise)}</span>
    </div>
  );
}
