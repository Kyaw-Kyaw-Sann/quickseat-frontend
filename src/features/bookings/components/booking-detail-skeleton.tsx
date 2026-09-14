import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingDetailSkeleton() {
  return (
    <Card className="mx-auto max-w-5xl space-y-7 p-6 sm:p-9" role="status">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-72 max-w-full" />
        </div>
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
      <span className="sr-only">Loading booking details…</span>
    </Card>
  );
}
