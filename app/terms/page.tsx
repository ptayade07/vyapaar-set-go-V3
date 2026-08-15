import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Vyapaar Set Go",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--background)] px-4 py-10">
      <article className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-orange-700">
            ← Vyapaar Set Go
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: August 2026.</p>
        </div>

        <div className="tactile-card space-y-4 p-6 text-sm leading-relaxed text-gray-700">
          <p className="rounded-lg bg-orange-50 p-3 text-xs font-semibold text-orange-800">
            This is a plain-language starting point written for a small pilot, not text reviewed by a
            lawyer. If you have questions about what this means for your business, ask a professional.
          </p>

          <section>
            <h2 className="font-bold text-gray-900">What this is</h2>
            <p>
              Vyapaar Set Go is a digital khata (ledger) tool that helps a shopkeeper track customer
              credit (udhaar), payments, supplier dues, and inventory. It&apos;s built and run by one
              person as a small pilot — not a large company.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Your account</h2>
            <p>
              You&apos;re responsible for keeping your password safe and for activity under your
              account. Each account is tied to one shop&apos;s data, kept separate from every other
              shop on the service.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Your data</h2>
            <p>
              The records you enter — customers, suppliers, transactions, inventory — belong to you.
              We store them so the app can show them back to you. See the{" "}
              <Link href="/privacy" className="font-semibold text-orange-700 underline">
                Privacy Policy
              </Link>{" "}
              for what&apos;s collected and how it&apos;s handled.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">No guarantees</h2>
            <p>
              The app is provided as-is, without a warranty of uptime or accuracy. It&apos;s a
              bookkeeping aid, not a substitute for professional accounting or legal advice — you&apos;re
              responsible for verifying your own financial records.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Fair use</h2>
            <p>
              Please don&apos;t use automated tools to create accounts in bulk, attempt to access
              another shop&apos;s data, or otherwise abuse the service. Accounts used this way may be
              suspended.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Changes</h2>
            <p>
              These terms may be updated as the app grows. Continuing to use the app after a change
              means you accept the update.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Questions</h2>
            <p>
              Reach out to the email address you signed up with, or the contact listed wherever you
              found this app, for questions or to request your account be closed.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
