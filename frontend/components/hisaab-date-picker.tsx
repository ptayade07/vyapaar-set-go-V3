"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/frontend/lib/i18n";

type Props = {
  date: string;
  displayDate: string;
};

export function HisaabDatePicker({ date, displayDate }: Props) {
  const t = useT();
  const router = useRouter();

  return (
    <div className="tactile-card flex flex-wrap items-center gap-4 p-6">
      <label className="text-sm font-semibold text-gray-700">{t("Date chuniye:", "Pick date:")}</label>
      <input
        type="date"
        defaultValue={date}
        onChange={(event) => router.push(`/hisaab?date=${event.target.value}`)}
        className="h-12 rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
      />
      <div className="ml-auto text-sm text-gray-500">{displayDate}</div>
    </div>
  );
}
