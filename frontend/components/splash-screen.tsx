"use client";

import { useEffect, useState } from "react";

const SPLASH_SESSION_KEY = "vsg_splash_shown";
const HOLD_MS = 1100;
const REMOVE_MS = 1500;

export function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_SESSION_KEY)) {
      setPhase("done");
      return;
    }
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");

    const outTimer = window.setTimeout(() => setPhase("out"), HOLD_MS);
    const doneTimer = window.setTimeout(() => setPhase("done"), REMOVE_MS);
    return () => {
      window.clearTimeout(outTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-orange-600 ${
        phase === "out" ? "animate-splash-fade-out" : ""
      }`}
    >
      <div className="animate-splash-logo-in flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl font-bold text-orange-600 shadow-xl">
        व
      </div>
      <p className="animate-splash-text-in text-2xl font-bold text-white">Vyapaar Set Go</p>
    </div>
  );
}
