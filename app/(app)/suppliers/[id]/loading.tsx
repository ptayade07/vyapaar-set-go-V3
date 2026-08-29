import { Skeleton, SkeletonPassbook } from "@/frontend/components/skeleton";

export default function SupplierDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-5 w-16" />

      <div className="tactile-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>

      <SkeletonPassbook />
    </div>
  );
}
