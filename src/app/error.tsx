"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("QuickSeat route error", error);
  }, [error]);

  return (
    <main className="grid min-h-[70dvh] place-items-center py-10">
      <PageContainer className="w-full">
        <ErrorState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={reset}>Try again</Button>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--qs-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qs-surface-raised)]"
                href="/"
              >
                Return home
              </Link>
            </div>
          }
          description="This page encountered an unexpected problem. Retry the page, or return home without clearing your session."
          title="QuickSeat could not display this page"
        />
      </PageContainer>
    </main>
  );
}
