"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signupAction } from "@/backend/actions/auth-actions";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "Ye email pehle se registered hai — This email is already registered",
  WEAK_PASSWORD: "Password kam se kam 8 characters ka ho — Password must be at least 8 characters",
  RATE_LIMITED: "Bahut zyada koshish ho gayi, thodi der baad try karo — Too many attempts, try again later",
};

export default function SignupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signupAction(email, password, shopName);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(ERROR_MESSAGES[result.error]);
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
          <p className="mt-1 text-sm text-gray-500">Naya shop banao — Create your shop</p>
        </div>

        <form onSubmit={handleSubmit} className="tactile-card space-y-4 p-8">
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Shop naam — Shop name
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kirana"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span>
              Main{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-orange-700 underline">
                Terms
              </Link>{" "}
              aur{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-orange-700 underline">
                Privacy Policy
              </Link>{" "}
              se sehmat hoon — I agree to the Terms and Privacy Policy
            </span>
          </label>

          {error ? (
            <p data-testid="signup-error" className="text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || !agreed}
            className="tap-target w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {isPending ? "Shop ban raha hai…" : "Shop banao — Create shop"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Pehle se account hai? — Already have an account?{" "}
            <Link href="/login" className="font-semibold text-orange-700">
              Login karo
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
