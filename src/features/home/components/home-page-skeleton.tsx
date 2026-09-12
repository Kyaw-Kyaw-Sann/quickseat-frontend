import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeletons({ count, cinema = false }: { count: number; cinema?: boolean }) {
  return (
    <div className={cinema ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton className={cinema ? "h-56 animate-pulse rounded-xl" : "aspect-[2/3] animate-pulse rounded-xl"} />
          {!cinema ? <Skeleton className="mt-3 h-5 w-3/4 animate-pulse" /> : null}
        </div>
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading QuickSeat home page">
      <Skeleton className="h-[34rem] animate-pulse rounded-none" />
      <PageContainer className="space-y-16 py-12">
        <section><Skeleton className="mb-5 h-8 w-48 animate-pulse" /><CardSkeletons count={6} /></section>
        <section><Skeleton className="mb-5 h-8 w-40 animate-pulse" /><CardSkeletons count={4} /></section>
        <section><Skeleton className="mb-5 h-8 w-52 animate-pulse" /><CardSkeletons cinema count={4} /></section>
      </PageContainer>
    </main>
  );
}
