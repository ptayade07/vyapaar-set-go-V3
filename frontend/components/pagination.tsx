import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
      <Link
        href={buildHref(page - 1)}
        aria-disabled={page <= 1}
        className={`tap-target inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 font-semibold text-gray-700 ${
          page <= 1 ? "pointer-events-none opacity-40" : "hover:border-orange-300"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="font-mono-num text-sm font-semibold text-gray-600">
        {page} / {totalPages}
      </span>
      <Link
        href={buildHref(page + 1)}
        aria-disabled={page >= totalPages}
        className={`tap-target inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 font-semibold text-gray-700 ${
          page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-orange-300"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
