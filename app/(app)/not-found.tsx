import { NotFoundContent } from "@/frontend/components/not-found-content";

// Catches notFound() calls from inside the authenticated app (e.g. a customer id belonging to
// another shop) -- rendered inside app/(app)/layout.tsx's sidebar shell, same as before the (app)
// route group existed. The root app/not-found.tsx handles genuinely unmatched top-level paths,
// which never enter this layout tree at all.
export default function AppNotFound() {
  return <NotFoundContent />;
}
