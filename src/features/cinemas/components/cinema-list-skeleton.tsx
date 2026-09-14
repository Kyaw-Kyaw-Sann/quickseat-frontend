import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function CinemaListSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading cinemas">
      <div className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_70%_0%,#301018_0%,transparent_42%)]">
        <PageContainer className="py-14 sm:py-20">
          <Skeleton className="h-12 w-72 animate-pulse" />
          <Skeleton className="mt-4 h-5 w-full max-w-lg animate-pulse" />
        </PageContainer>
      </div>
      <PageContainer className="py-8 sm:py-12">
        <Skeleton className="mb-8 h-28 animate-pulse rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="h-80 animate-pulse rounded-xl" key={index} />
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
