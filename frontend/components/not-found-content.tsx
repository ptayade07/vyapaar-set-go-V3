import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared by the root not-found.tsx (genuinely unmatched paths, no app shell around it) and
 * app/(app)/not-found.tsx (an in-app notFound() call, e.g. a customer id from another shop --
 * still rendered inside the sidebar shell, same as before the (app) route group existed). */
export function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-bold text-white">
        व
      </span>
      <h1 className="text-2xl font-bold text-gray-900">Nahi mila — Not found</h1>
      <p className="text-sm text-gray-500">
        Ye page ya record maujood nahi hai. This page or record doesn&apos;t exist.
      </p>
      <Link href="/" className="inline-flex items-center gap-2 font-semibold text-orange-700">
        <ArrowLeft className="h-4 w-4" /> Dashboard par jao
      </Link>
    </div>
  );
}
