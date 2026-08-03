"use client";

import { Delete } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyPinAction } from "@/backend/actions/actions";

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
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-xs">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-600 text-3xl font-bold text-white">
            व
          </span>
          <p className="text-xl font-black text-gray-900">Vyapaar Set Go</p>
        </div>

        <div className="tactile-card p-8">
          <p className="mb-4 text-center text-sm font-bold text-gray-500">Apna PIN daalo</p>

          <div className="mb-6 flex justify-center gap-3" data-testid="pin-dots">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                data-testid={`pin-dot-${index}`}
                className={`h-4 w-4 rounded-full transition-transform ${
                  index < pin.length ? "scale-110 bg-orange-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {error ? (
            <p data-testid="pin-error" className="mb-4 text-center text-sm font-bold text-red-700">
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
                className="pin-key h-16 rounded-2xl bg-orange-50 text-xl font-black text-gray-900 hover:bg-orange-100 active:scale-95"
              >
                {digit}
              </button>
            ))}
            <span />
            <button
              type="button"
              data-testid="pin-key-0"
              onClick={() => pressKey("0")}
              className="pin-key h-16 rounded-2xl bg-orange-50 text-xl font-black text-gray-900 hover:bg-orange-100 active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              data-testid="pin-key-back"
              onClick={pressBackspace}
              aria-label="Backspace"
              className="pin-key flex h-16 items-center justify-center rounded-2xl bg-orange-50 hover:bg-orange-100 active:scale-95"
            >
              <Delete className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-gray-400">Default PIN: 1234</p>
      </div>
    </div>
  );
}
