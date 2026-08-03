"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "hi" | "en";
type LangContextValue = { lang: Lang; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue>({ lang: "hi", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("hi");

  useEffect(() => {
    const stored = window.localStorage.getItem("vsg_lang");
    if (stored === "en" || stored === "hi") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("vsg_lang", lang);
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** t(hinglish, english) returns whichever is active. */
export function useT() {
  const { lang } = useLang();
  return (hi: string, en: string) => (lang === "en" ? en : hi);
}
