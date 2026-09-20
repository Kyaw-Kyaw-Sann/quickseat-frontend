import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-[70dvh] place-items-center py-10">
      <PageContainer className="w-full">
        <EmptyState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-lg bg-[var(--qs-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--qs-primary-strong)]"
                href="/"
              >
                Return home
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--qs-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qs-surface-raised)]"
                href="/showtimes"
              >
                Browse showtimes
              </Link>
            </div>
          }
          description="The address may be invalid, or this QuickSeat page is no longer available."
          title="Page not found"
        />
      </PageContainer>
    </main>
  );
}
