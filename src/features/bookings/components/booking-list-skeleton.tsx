import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingListSkeleton() {
  return (
    <div className="space-y-6" role="status">
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Card className="space-y-5" key={index}>
            <div className="flex justify-between gap-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-full" />
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading bookings…</span>
    </div>
  );
}
