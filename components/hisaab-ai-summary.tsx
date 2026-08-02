"use client";

import { useEffect, useState } from "react";

type Props = {
  date: string;
};

type SummaryResponse = {
  summary: string;
  source: "ai" | "template";
};

export function HisaabAiSummary({ date }: Props) {
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(false);

    fetch(`/api/hisaab-summary?date=${encodeURIComponent(date)}`)
      .then((response) => {
        if (!response.ok) throw new Error("summary request failed");
        return response.json() as Promise<SummaryResponse>;
      })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-[#1f271f]">Din ka Summary</h2>
        {result ? (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-[#16803c]">
            {result.source === "ai" ? "AI summary" : "Auto summary"}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm font-bold text-[#b42318]">Summary load nahi hui. Baad mein try karo.</p>
      ) : result ? (
        <p className="text-base font-semibold leading-relaxed text-[#384238]">{result.summary}</p>
      ) : (
        <div className="grid gap-2" aria-live="polite" aria-busy="true">
          <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
        </div>
      )}
    </section>
  );
}
