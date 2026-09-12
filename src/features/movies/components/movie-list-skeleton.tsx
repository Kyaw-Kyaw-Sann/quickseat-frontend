import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieListSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading movies">
      <div className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_70%_0%,#301018_0%,transparent_42%)]">
        <PageContainer className="py-14 sm:py-20">
          <Skeleton className="h-12 w-64 animate-pulse" />
          <Skeleton className="mt-4 h-5 w-full max-w-md animate-pulse" />
        </PageContainer>
      </div>
      <PageContainer className="py-8 sm:py-12">
        <Skeleton className="mb-8 h-40 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[2/3] animate-pulse rounded-xl" />
              <Skeleton className="mt-3 h-5 w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
