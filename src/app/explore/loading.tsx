import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="page-shell py-14">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-5 h-12 max-w-xl" />
      <Skeleton className="mt-8 h-12 w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-72 rounded-2xl" />)}
      </div>
    </div>
  );
}
