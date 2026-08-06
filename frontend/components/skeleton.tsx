export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

export function SkeletonRow({ withAmount = true }: { withAmount?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      {withAmount ? <Skeleton className="h-7 w-20 shrink-0" /> : null}
    </div>
  );
}

export function SkeletonCardList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="tactile-card">
          <SkeletonRow />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPassbook({ rows = 5 }: { rows?: number }) {
  return (
    <div className="tactile-card overflow-hidden">
      <div className="space-y-2 p-6 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonRow key={index} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-14 w-40 rounded-2xl" />
    </div>
  );
}
