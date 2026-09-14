import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SeatSelectionSkeleton() {
  return (
    <main>
      <PageContainer className="py-8 sm:py-12">
        <Skeleton className="mb-6 h-5 w-36" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="space-y-7 overflow-hidden">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="mx-auto h-3 w-3/4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, row) => (
                <div className="flex gap-3" key={row}>
                  <Skeleton className="h-12 w-8" />
                  {Array.from({ length: 8 }, (_, seat) => (
                    <Skeleton className="h-12 w-14" key={seat} />
                  ))}
                </div>
              ))}
            </div>
          </Card>
          <Card className="hidden space-y-4 lg:block">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-11 w-full" />
          </Card>
        </div>
      </PageContainer>
    </main>
  );
}
