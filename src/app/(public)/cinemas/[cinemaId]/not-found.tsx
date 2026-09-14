import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";

export default function CinemaNotFound() {
  return (
    <main>
      <PageContainer className="py-16">
        <EmptyState
          action={
            <Link
              className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
              href="/cinemas"
            >
              Browse cinemas
            </Link>
          }
          description="This cinema may be unavailable or no longer active."
          title="Cinema not found"
        />
      </PageContainer>
    </main>
  );
}
