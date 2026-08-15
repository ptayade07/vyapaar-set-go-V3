"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loginAction } from "@/backend/actions/auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(false);
    startTransition(async () => {
      const ok = await loginAction(email, password);
      if (ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(true);
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
          <p className="mt-1 text-sm text-gray-500">Login karo — Log in to your shop</p>
        </div>

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

          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>

          {error ? (
            <p data-testid="login-error" className="text-sm font-semibold text-red-600">
              Email ya password galat — Incorrect email or password
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="tap-target w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {isPending ? "Login ho raha hai…" : "Login karo"}
          </button>
        </form>
      </div>
    </div>
  );
}
