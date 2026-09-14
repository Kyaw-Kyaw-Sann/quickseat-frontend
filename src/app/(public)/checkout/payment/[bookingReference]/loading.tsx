import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPayment() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" role="status">
        <Card className="space-y-5 p-8">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
        <Card className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-16 w-full" />
        </Card>
        <span className="sr-only">Loading payment summary…</span>
      </div>
    </PageContainer>
  );
}
