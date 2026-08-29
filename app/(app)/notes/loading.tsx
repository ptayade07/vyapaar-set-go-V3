import { SkeletonHeader, Skeleton } from "@/frontend/components/skeleton";

export default function NotesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SkeletonHeader />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="tactile-card flex items-start gap-3 p-5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
