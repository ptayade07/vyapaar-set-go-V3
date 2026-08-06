import { SkeletonCardList, SkeletonHeader, Skeleton } from "@/frontend/components/skeleton";

export default function CustomersLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SkeletonHeader />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <SkeletonCardList rows={6} />
    </div>
  );
}
