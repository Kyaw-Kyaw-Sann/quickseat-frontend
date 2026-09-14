import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingBookingConfirmation() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <Card className="mx-auto max-w-5xl space-y-6 p-8" role="status">
        <div className="grid place-items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <span className="sr-only">Loading booking confirmation…</span>
      </Card>
    </PageContainer>
  );
}
