import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";

export default function MovieNotFound() {
  return (
    <main>
      <PageContainer className="py-16">
        <EmptyState
          title="Movie not found"
          description="This movie may be unavailable or no longer active."
          action={<Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href="/movies">Browse movies</Link>}
        />
      </PageContainer>
    </main>
  );
}
