"use client";

import { useEffect, useState } from "react";
import { useT } from "@/frontend/lib/i18n";

type Props = {
  date: string;
};

type SummaryResponse = {
  summary: string;
  source: "ai" | "template";
};

export function HisaabAiSummary({ date }: Props) {
  const t = useT();
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
    <section className="tactile-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">{t("Din ka Summary", "Day's Summary")}</h2>
        {result ? (
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
            {result.source === "ai" ? t("AI summary", "AI summary") : t("Auto summary", "Auto summary")}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm font-bold text-red-700">
          {t("Summary load nahi hui. Baad mein try karo.", "Summary failed to load. Try again later.")}
        </p>
      ) : result ? (
        <p className="text-base font-semibold leading-relaxed text-gray-700">{result.summary}</p>
      ) : (
        <div className="grid gap-2" aria-live="polite" aria-busy="true">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        </div>
      )}
    </section>
  );
}
