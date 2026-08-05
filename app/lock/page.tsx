"use client";

import { Delete } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyPinAction } from "@/backend/actions/actions";
import { SplashScreen } from "@/frontend/components/splash-screen";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function LockPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pressKey(digit: string) {
    if (isPending || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      startTransition(async () => {
        const ok = await verifyPinAction(next);
        if (ok) {
          router.push("/");
          router.refresh();
        } else {
          setError(true);
          window.setTimeout(() => {
            setPin("");
            setError(false);
          }, 800);
        }
      });
    }
  }

  function pressBackspace() {
    if (isPending) return;
    setPin((current) => current.slice(0, -1));
    setError(false);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] px-4">
      <SplashScreen />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-600 text-4xl font-bold text-white shadow-lg">
            व
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Vyapaar Set Go</h1>
          <p className="mt-1 text-sm text-gray-500">Apna 4-digit PIN daaliye — Enter your 4-digit PIN</p>
        </div>

        <div className="tactile-card p-8">
          <div className="mb-6 flex justify-center gap-4" data-testid="pin-dots">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                data-testid={`pin-dot-${index}`}
                className={`h-4 w-4 rounded-full transition-all ${
                  index < pin.length ? "scale-110 bg-orange-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {error ? (
            <p data-testid="pin-error" className="mb-4 text-center text-sm font-semibold text-red-600">
              Galat PIN — Wrong PIN
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            {KEYS.map((digit) => (
              <button
                key={digit}
                type="button"
                data-testid={`pin-key-${digit}`}
                onClick={() => pressKey(digit)}
                className="pin-key font-mono-num h-16 rounded-2xl bg-orange-50 text-2xl font-bold text-gray-800 hover:bg-orange-100"
              >
                {digit}
              </button>
            ))}
            <span />
            <button
              type="button"
              data-testid="pin-key-0"
              onClick={() => pressKey("0")}
              className="pin-key font-mono-num h-16 rounded-2xl bg-orange-50 text-2xl font-bold text-gray-800 hover:bg-orange-100"
            >
              0
            </button>
            <button
              type="button"
              data-testid="pin-key-back"
              onClick={pressBackspace}
              aria-label="Backspace"
              className="pin-key flex h-16 items-center justify-center rounded-2xl bg-orange-50 text-gray-800 hover:bg-orange-100"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">Default PIN: 1234</p>
        </div>
      </div>
    </div>
  );
}
