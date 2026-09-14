import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function CinemaDetailSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading cinema details">
      <Skeleton className="h-[28rem] animate-pulse rounded-none" />
      <PageContainer className="py-10">
        <Skeleton className="h-36 animate-pulse rounded-xl" />
      </PageContainer>
    </main>
  );
}
