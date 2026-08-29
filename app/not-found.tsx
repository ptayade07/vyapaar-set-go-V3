import { NotFoundContent } from "@/frontend/components/not-found-content";

// This is the fallback for genuinely unmatched top-level paths -- reached with no app shell
// around it (the root layout is minimal), so it's self-contained with its own centered
// full-screen background, matching /login and /terms's standalone-screen treatment.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <NotFoundContent />
    </div>
  );
}
