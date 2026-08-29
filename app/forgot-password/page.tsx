"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/backend/actions/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(email);
      if (result.ok) {
        setSent(true);
      } else {
        setError("Bahut zyada koshish ho gayi, thodi der baad try karo — Too many attempts, try again later");
      }
    });
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--background)] px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-600 text-4xl font-bold text-white shadow-lg">
            व
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Vyapaar Set Go</h1>
          <p className="mt-1 text-sm text-gray-500">Password reset karo — Reset your password</p>
        </div>

        {sent ? (
          <div className="tactile-card space-y-4 p-8 text-center">
            <p className="font-semibold text-gray-900">
              Agar ye email registered hai, to reset link bhej diya gaya hai.
            </p>
            <p className="text-sm text-gray-500">
              If that email is registered, we&apos;ve sent a reset link — check your inbox.
            </p>
            <Link href="/login" className="inline-block font-semibold text-orange-700">
              Login par wapas jao — Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="tactile-card space-y-4 p-8">
            <label className="grid gap-2 text-sm font-semibold text-gray-700">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
              />
            </label>

            {error ? (
              <p data-testid="forgot-password-error" className="text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="tap-target w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isPending ? "Bhej rahe hain…" : "Reset link bhejo — Send reset link"}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-orange-700">
                Login par wapas jao — Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
