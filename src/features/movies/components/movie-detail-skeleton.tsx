import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieDetailSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading movie details">
      <PageContainer className="grid gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-16">
        <Skeleton className="aspect-[2/3] animate-pulse rounded-2xl" />
        <div className="space-y-5 py-4">
          <Skeleton className="h-14 w-4/5 animate-pulse" />
          <Skeleton className="h-8 w-1/2 animate-pulse" />
          <Skeleton className="h-28 w-full animate-pulse" />
          <Skeleton className="h-12 w-64 animate-pulse" />
        </div>
      </PageContainer>
    </main>
  );
}
