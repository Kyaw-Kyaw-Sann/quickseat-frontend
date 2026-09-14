import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function ShowtimeListSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading showtimes">
      <div className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_70%_0%,#301018_0%,transparent_42%)]">
        <PageContainer className="py-14 sm:py-20">
          <Skeleton className="h-12 w-72 animate-pulse" />
          <Skeleton className="mt-4 h-5 w-full max-w-lg animate-pulse" />
        </PageContainer>
      </div>
      <PageContainer className="py-8 sm:py-12">
        <Skeleton className="h-40 animate-pulse rounded-xl" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-48 animate-pulse rounded-xl md:h-36" key={index} />
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
