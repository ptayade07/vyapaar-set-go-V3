"use client";

import { Check, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addCustomerEntry } from "@/backend/actions/actions";
import { formatMoneyPaise } from "@/backend/lib/format";
import { useT } from "@/frontend/lib/i18n";

type Customer = { id: string; name: string; phone: string | null; balancePaise: number };

type Props = {
  customers: Customer[];
};

export function QuickEntry({ customers }: Props) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [type, setType] = useState<"UDHAAR" | "PAYMENT">("UDHAAR");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showList, setShowList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return customers
      .filter((customer) => customer.name.toLowerCase().includes(q) || (customer.phone ?? "").includes(query))
      .slice(0, 6);
  }, [customers, query]);

  function pick(customer: Customer) {
    setSelected(customer);
    setQuery(customer.name);
    setShowList(false);
    window.setTimeout(() => amountRef.current?.focus(), 50);
  }

  function reset() {
    setSelected(null);
    setQuery("");
    setAmount("");
    setNote("");
    setType("UDHAAR");
    setShowList(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) {
      setError(t("Customer chuniye", "Pick a customer"));
      nameRef.current?.focus();
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError(t("Amount daaliye", "Enter amount"));
      return;
    }
    setError(null);
    setSaving(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("amount", amount);
    formData.set("description", note);
    try {
      await addCustomerEntry(selected.id, formData);
      reset();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tactile-card p-5" data-testid="quick-entry-bar">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
          <Zap className="h-5 w-5 text-orange-600" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t("Fatafat Entry", "Quick Entry")}</h3>
          <p className="text-xs text-gray-500">
            {t("Counter par khade khade entry karo", "Enter without leaving dashboard")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <input
            ref={nameRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            onBlur={() => window.setTimeout(() => setShowList(false), 150)}
            placeholder={t("Customer ka naam...", "Customer name...")}
            autoComplete="off"
            className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
          />
          {selected ? (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-green-600">
              <Check className="h-3.5 w-3.5" />
              {formatMoneyPaise(Math.abs(selected.balancePaise))}{" "}
              {selected.balancePaise > 0 ? "udhaar" : selected.balancePaise < 0 ? "advance" : ""}
            </div>
          ) : null}
          {showList && suggestions.length > 0 ? (
            <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {suggestions.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(customer)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-orange-50"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{customer.name}</div>
                      {customer.phone ? <div className="text-xs text-gray-500">{customer.phone}</div> : null}
                    </div>
                    <div
                      className={`font-mono-num text-sm font-bold ${
                        customer.balancePaise > 0
                          ? "text-red-600"
                          : customer.balancePaise < 0
                            ? "text-green-700"
                            : "text-gray-400"
                      }`}
                    >
                      {formatMoneyPaise(Math.abs(customer.balancePaise))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:col-span-3">
          <button
            type="button"
            onClick={() => setType("UDHAAR")}
            className={`h-14 rounded-xl text-sm font-semibold transition ${
              type === "UDHAAR"
                ? "bg-red-500 text-white shadow-md"
                : "border border-gray-200 bg-white text-gray-700 hover:border-red-300"
            }`}
          >
            {t("Udhaar", "Credit")}
          </button>
          <button
            type="button"
            onClick={() => setType("PAYMENT")}
            className={`h-14 rounded-xl text-sm font-semibold transition ${
              type === "PAYMENT"
                ? "bg-green-600 text-white shadow-md"
                : "border border-gray-200 bg-white text-gray-700 hover:border-green-300"
            }`}
          >
            {t("Payment", "Payment")}
          </button>
        </div>

        <div className="relative lg:col-span-3">
          <span className="font-mono-num pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300">
            ₹
          </span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            className="font-mono-num h-14 w-full rounded-xl border-2 border-orange-200 pl-9 pr-3 text-xl font-bold focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-14 rounded-xl bg-orange-600 font-bold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-60 lg:col-span-2"
        >
          {saving ? "..." : t("Save", "Save")}
        </button>

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("Note (optional): 5kg rice + oil", "Note (optional)")}
          className="h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-orange-500 lg:col-span-12"
        />
      </form>

      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
