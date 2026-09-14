import Link from "next/link";
import { buildCinemasHref } from "@/features/cinemas/query";
import type { CinemaQuery } from "@/features/cinemas/query";
import { cn } from "@/lib/utils/cn";

type CinemaPaginationProps = {
  currentPage: number;
  query: CinemaQuery;
  totalElements: number;
  totalPages: number;
};

function visiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export function CinemaPagination({
  currentPage,
  query,
  totalElements,
  totalPages,
}: CinemaPaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="mt-8 text-sm text-[var(--qs-text-muted)]">
        {totalElements} cinema{totalElements === 1 ? "" : "s"}
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--qs-text-muted)]">
        Page {currentPage + 1} of {totalPages} · {totalElements} cinemas
      </p>
      <nav aria-label="Cinema pagination" className="flex flex-wrap items-center gap-2">
        <PaginationLink
          disabled={currentPage === 0}
          href={buildCinemasHref(query, { page: currentPage - 1 })}
          label="Previous"
        />
        {visiblePages(currentPage, totalPages).map((page) => (
          <PaginationLink
            active={page === currentPage}
            href={buildCinemasHref(query, { page })}
            key={page}
            label={String(page + 1)}
          />
        ))}
        <PaginationLink
          disabled={currentPage >= totalPages - 1}
          href={buildCinemasHref(query, { page: currentPage + 1 })}
          label="Next"
        />
      </nav>
    </div>
  );
}

function PaginationLink({
  active,
  disabled,
  href,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  href: string;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[var(--qs-border)] px-3 text-sm text-[var(--qs-text-muted)] opacity-45"
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors",
        active
          ? "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white"
          : "border-[var(--qs-border)] text-[var(--qs-text-muted)] hover:border-[var(--qs-primary)] hover:text-[var(--qs-text)]",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}
