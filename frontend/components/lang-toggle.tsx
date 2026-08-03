"use client";

import { Languages } from "lucide-react";
import { useLang } from "@/frontend/lib/i18n";

export function SidebarLangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
    >
      <Languages className="h-4 w-4" />
      {lang === "en" ? "हिंग्लिश" : "English"}
    </button>
  );
}

export function MobileLangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
    >
      {lang === "en" ? "हिं" : "EN"}
    </button>
  );
}
