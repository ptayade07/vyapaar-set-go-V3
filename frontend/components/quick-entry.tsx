"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmQuickEntry, parseQuickEntry, type QuickEntryParsePayload } from "@/backend/actions/actions";
import { formatMoneyPaise } from "@/backend/lib/format";

const TYPE_LABELS: Record<string, { label: string; subtitle: string }> = {
  UDHAAR: { label: "Udhaar Diya", subtitle: "goods on credit" },
  PAYMENT: { label: "Payment Liya", subtitle: "payment received" },
  ADVANCE: { label: "Advance Liya", subtitle: "advance received" },
};

export function QuickEntry() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<QuickEntryParsePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleParse() {
    const value = text.trim();
    setError(null);
    setSaved(false);
    setParsed(null);
    if (!value) return;

    startTransition(async () => {
      const result = await parseQuickEntry(value);

      if (!result.complete || result.amountPaise === null || result.type === null || !result.customerName) {
        setError('Samajh nahi aaya. Try: "Ramesh ko 250 ka udhaar" — ya neeche manual entry karo.');
        return;
      }

      setParsed(result);
    });
  }

  function handleConfirm() {
    if (!parsed || parsed.amountPaise === null || parsed.type === null || !parsed.customerName) return;

    startTransition(async () => {
      try {
        await confirmQuickEntry({
          customerId: parsed.customerId,
          customerName: parsed.customerName!,
          amountPaise: parsed.amountPaise!,
          type: parsed.type!,
          createCustomer: !parsed.customerId,
          note: parsed.raw,
        });
        setParsed(null);
        setText("");
        setSaved(true);
        router.refresh();
      } catch {
        setError("Save nahi ho paya. Dobara try karo.");
      }
    });
  }

  function handleCancel() {
    setParsed(null);
  }

  const typeInfo = parsed?.type ? TYPE_LABELS[parsed.type] : null;

  return (
    <section className="tactile-card p-4">
      <h2 className="text-xl font-black text-gray-900">Quick Entry</h2>
      <p className="mb-3 text-sm font-semibold text-gray-500">
        Ek line mein likho, jaise &quot;Ramesh ko 250 ka udhaar&quot;
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleParse();
            }
          }}
          placeholder="Ramesh ko 250 ka udhaar"
          aria-label="Quick entry sentence"
          className="tap-target min-w-0 flex-1 rounded-xl border border-gray-300 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={isPending || !text.trim()}
          className="tap-target rounded-xl bg-orange-600 px-5 text-base font-black text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {isPending && !parsed ? "Samajh raha hoon..." : "Parse karo"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm font-bold text-green-700">Entry save ho gayi.</p> : null}

      {parsed && typeInfo ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-orange-700">
            {parsed.source === "llm" ? "AI se samjha" : "Rule se samjha"} — confirm karo
          </p>
          <div className="grid gap-1">
            <p className="text-lg font-black text-gray-900">
              {parsed.customerName}
              {!parsed.customerId ? (
                <span className="ml-2 text-sm font-bold text-orange-700">(naya customer)</span>
              ) : null}
            </p>
            <p className="text-sm font-semibold text-gray-500">
              {typeInfo.label} · {typeInfo.subtitle}
            </p>
            <p className="font-mono-num text-2xl font-black text-gray-900">{formatMoneyPaise(parsed.amountPaise ?? 0)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="tap-target flex-1 rounded-xl bg-orange-600 px-4 text-base font-black text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {isPending
                ? "Save ho raha hai..."
                : parsed.customerId
                  ? "Confirm & Save"
                  : `${parsed.customerName} banao aur Save karo`}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="tap-target rounded-xl border border-gray-300 px-4 text-base font-black text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
