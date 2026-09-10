"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Lang = "hi" | "en";
type LangContextValue = { lang: Lang; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue>({ lang: "hi", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("hi");
  // Both effects fire in the same commit on mount, in declaration order: the read effect below
  // calls setLang(stored) first, but that state update hasn't landed yet when the write effect
  // runs right after in that same commit -- it would still see the stale initial "hi" and clobber
  // whatever was actually stored, before the corrected re-render ever happens. Skipping the write
  // on that first commit (real value only ever changes after it, whether from the read effect's
  // correction or a later user toggle) avoids the race entirely, including under React Strict
  // Mode's mount->cleanup->remount double-invocation.
  const isFirstCommit = useRef(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("vsg_lang");
    if (stored === "en" || stored === "hi") setLang(stored);
  }, []);

  useEffect(() => {
    if (isFirstCommit.current) {
      isFirstCommit.current = false;
      return;
    }
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
