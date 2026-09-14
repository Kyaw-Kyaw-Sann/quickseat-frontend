import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingTicket() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <Card className="mx-auto grid max-w-5xl gap-8 p-6 sm:p-9 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <span className="sr-only">Loading ticket…</span>
      </Card>
    </PageContainer>
  );
}
