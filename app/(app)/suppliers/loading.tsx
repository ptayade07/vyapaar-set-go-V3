import { SkeletonCardList, SkeletonHeader } from "@/frontend/components/skeleton";

export default function SuppliersLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SkeletonHeader />
      <SkeletonCardList rows={5} />
    </div>
  );
}
