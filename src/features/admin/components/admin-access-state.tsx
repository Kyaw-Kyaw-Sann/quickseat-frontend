import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoadingState() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading admin workspace"
      className="min-h-screen bg-[#0c0c0f] p-4 sm:p-6"
    >
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden min-h-[calc(100vh-3rem)] lg:block" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </main>
  );
}

export function AdminAccessDeniedState() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0c0f] p-5">
      <Card className="w-full max-w-lg border-[#624046] bg-[#18181c] py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--qs-danger)]">
          Access denied
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Admin access is required</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--qs-text-muted)]">
          This workspace is available only to QuickSeat administrators. No admin
          content has been loaded.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--qs-text)] transition-colors hover:border-[#565661] hover:bg-[#2a2a31]"
          href="/"
        >
          Return to QuickSeat
        </Link>
      </Card>
    </main>
  );
}
