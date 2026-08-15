import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Vyapaar Set Go",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--background)] px-4 py-10">
      <article className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-orange-700">
            ← Vyapaar Set Go
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: August 2026.</p>
        </div>

        <div className="tactile-card space-y-4 p-6 text-sm leading-relaxed text-gray-700">
          <p className="rounded-lg bg-orange-50 p-3 text-xs font-semibold text-orange-800">
            This is a plain-language starting point written for a small pilot, not text reviewed by a
            lawyer. See the{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            for the rest of the picture.
          </p>

          <section>
            <h2 className="font-bold text-gray-900">What we collect</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Your email address and a hashed password (never stored as plain text).</li>
              <li>Your shop&apos;s name.</li>
              <li>
                Whatever you enter into the app to run your business: customer and supplier names,
                phone numbers, notes, transaction amounts and dates, and inventory items.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Why</h2>
            <p>Solely to provide the ledger and tracking features you&apos;re using the app for.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Where it&apos;s stored</h2>
            <p>
              In a managed Postgres database (Neon), hosted in the cloud. The app is built so one
              shop&apos;s data is never visible to another shop&apos;s account — every record is scoped
              to the shop that created it.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Sharing</h2>
            <p>
              Your data isn&apos;t sold or shared with third parties, except the services necessary to
              run the app itself: the database host, and — only if you choose to use those specific
              features — an AI provider for the optional end-of-day summary, or Vercel Blob for
              optional receipt-photo attachments. Both features work fine, and nothing extra is sent
              anywhere, if you don&apos;t use them.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Cookies</h2>
            <p>
              Only essential cookies: your login session, PIN-lock status, and language preference.
              No advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Your rights</h2>
            <p>
              You can ask to have your account and data deleted at any time by contacting the email
              address you signed up with.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900">Changes</h2>
            <p>
              This policy may be updated as the app grows. Continuing to use the app after a change
              means you accept the update.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
