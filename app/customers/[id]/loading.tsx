import { Skeleton, SkeletonPassbook } from "@/frontend/components/skeleton";

export default function CustomerDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-5 w-16" />

      <div className="tactile-card space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-10 w-32" />
            <Skeleton className="ml-auto h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-44 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      <SkeletonPassbook />
    </div>
  );
}
