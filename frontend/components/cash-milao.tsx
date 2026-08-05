"use client";

import { AlertTriangle, CheckCircle2, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOpeningCash } from "@/backend/actions/actions";
import { computeExpectedCashPaise, getCashMilaoVerdict } from "@/backend/lib/cash-milao";
import { formatMoneyPaise } from "@/backend/lib/format";
import { useT } from "@/frontend/lib/i18n";

type Props = {
  date: string;
  openingPaise: number;
  paymentsTotalPaise: number;
  advanceTotalPaise: number;
  supplierPaymentsTodayPaise: number;
};

export function CashMilao({ date, openingPaise, paymentsTotalPaise, advanceTotalPaise, supplierPaymentsTodayPaise }: Props) {
  const t = useT();
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
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
          <Coins className="h-5 w-5 text-orange-700" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("Cash Milao", "Cash Reconciliation")}</h2>
          <p className="text-xs text-gray-500">{t("Drawer ka cash sahi hai?", "Match your cash drawer")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            {t("Subah ka opening cash", "Opening cash")}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="font-mono-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300">
                ₹
              </span>
              <input
                data-testid="opening-cash-input"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={opening}
                onChange={(event) => setOpening(event.target.value)}
                onBlur={saveOpening}
                placeholder="0"
                className="font-mono-num h-14 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-xl font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="button"
              data-testid="save-opening-btn"
              onClick={saveOpening}
              disabled={isPending}
              className="h-14 rounded-xl bg-gray-100 px-5 font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50"
            >
              {t("Save", "Save")}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-orange-50/50 p-4" data-testid="cash-calculation">
          <Row label={t("Opening cash", "Opening cash")} sign="+" amountPaise={openingPaiseValue} />
          <Row
            label={t("Grahak se cash aaya (payment + advance)", "Cash received (payment + advance)")}
            sign="+"
            amountPaise={paymentsTotalPaise + advanceTotalPaise}
            tone="positive"
          />
          <Row
            label={t("Supplier ko diya", "Paid to suppliers")}
            sign="−"
            amountPaise={supplierPaymentsTodayPaise}
            tone="negative"
          />
          <div className="flex items-center justify-between border-t border-orange-200 pt-2">
            <span className="text-sm font-bold text-gray-900">{t("Expected drawer cash", "Expected drawer cash")}</span>
            <span data-testid="expected-cash" className="font-mono-num text-2xl font-bold text-orange-700">
              {formatMoneyPaise(expectedPaise)}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            {t("Actual counted cash (drawer se)", "Actual counted cash")}
          </label>
          <div className="relative">
            <span className="font-mono-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300">
              ₹
            </span>
            <input
              data-testid="actual-cash-input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={actual}
              onChange={(event) => setActual(event.target.value)}
              placeholder={t("Counter ka cash count karke daaliye", "Count from drawer")}
              className="font-mono-num h-14 w-full rounded-xl border-2 border-orange-200 pl-10 pr-4 text-xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {verdict ? (
          <div data-testid="cash-diff-result">
            {verdict === "match" ? (
              <div data-testid="cash-match" className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-green-700">{t("Match!", "Match!")}</p>
                  <p className="text-xs text-green-700/80">{t("Drawer ka cash sahi hai", "Cash tallies exactly")}</p>
                </div>
              </div>
            ) : verdict === "short" ? (
              <div data-testid="cash-short" className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                <AlertTriangle className="h-7 w-7 text-red-600" />
                <div>
                  <p className="font-mono-num text-xl font-bold text-red-700">
                    {formatMoneyPaise(Math.abs((actualPaise ?? 0) - expectedPaise))} {t("kam hai", "short")}
                  </p>
                  <p className="text-xs text-red-700/80">
                    {t("Expected se kam paisa hai drawer mein", "Less cash in drawer than expected")}
                  </p>
                </div>
              </div>
            ) : (
              <div data-testid="cash-extra" className="flex items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <AlertTriangle className="h-7 w-7 text-blue-600" />
                <div>
                  <p className="font-mono-num text-xl font-bold text-blue-700">
                    {formatMoneyPaise((actualPaise ?? 0) - expectedPaise)} {t("zyada hai", "extra")}
                  </p>
                  <p className="text-xs text-blue-700/80">
                    {t("Expected se zyada paisa hai — check karein", "More cash than expected — verify")}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Row({
  label,
  sign,
  amountPaise,
  tone,
}: {
  label: string;
  sign: "+" | "−";
  amountPaise: number;
  tone?: "positive" | "negative";
}) {
  const color = tone === "positive" ? "text-green-700" : tone === "negative" ? "text-red-600" : "text-gray-700";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">
        {sign} {label}
      </span>
      <span className={`font-mono-num font-semibold ${color}`}>{formatMoneyPaise(amountPaise)}</span>
    </div>
  );
}
