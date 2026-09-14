import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSeatHold() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]" role="status">
        <Card className="space-y-5 p-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-36 w-full" />
        </Card>
        <Card className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-11 w-full" />
        </Card>
        <span className="sr-only">Loading seat hold…</span>
      </div>
    </PageContainer>
  );
}
