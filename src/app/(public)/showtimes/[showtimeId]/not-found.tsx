import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main>
      <PageContainer className="py-12 sm:py-16">
        <EmptyState
          action={
            <Link
              className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
              href="/showtimes"
            >
              Browse showtimes
            </Link>
          }
          description="This showtime could not be found or is no longer available."
          title="Showtime not found"
        />
      </PageContainer>
    </main>
  );
}
