"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/backend/actions/auth-actions";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_OR_EXPIRED_TOKEN:
    "Ye link kaam nahi kar raha ya expire ho gaya hai — This link is invalid or has expired",
  WEAK_PASSWORD: "Password kam se kam 8 characters ka ho — Password must be at least 8 characters",
};

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      return;
    }
    if (password !== confirmPassword) {
      setError("Password match nahi ho raha — Passwords don't match");
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(token, password);
      if (result.ok) {
        setDone(true);
        window.setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(ERROR_MESSAGES[result.error]);
      }
    });
  }

  if (done) {
    return (
      <div className="tactile-card space-y-2 p-8 text-center">
        <p className="font-semibold text-gray-900">Password badal gaya! — Password changed!</p>
        <p className="text-sm text-gray-500">Login page par le jaa rahe hain… — Taking you to login…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="tactile-card space-y-4 p-8">
      <label className="grid gap-2 text-sm font-semibold text-gray-700">
        Naya password — New password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-gray-700">
        Confirm karo — Confirm new password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
        />
      </label>

      {error ? (
        <p data-testid="reset-password-error" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="tap-target w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isPending ? "Badal rahe hain…" : "Password badlo — Reset password"}
      </button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-orange-700">
          Login par wapas jao — Back to login
        </Link>
      </p>
    </form>
  );
}
