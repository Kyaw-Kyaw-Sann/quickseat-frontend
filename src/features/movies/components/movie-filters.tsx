import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildMoviesHref } from "@/features/movies/query";
import type { MovieQuery, MovieStatusFilter } from "@/features/movies/query";
import { cn } from "@/lib/utils/cn";

const statuses: { label: string; value: MovieStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Now Showing", value: "NOW_SHOWING" },
  { label: "Upcoming", value: "UPCOMING" },
];

type MovieFiltersProps = {
  query: MovieQuery;
};

export function MovieFilters({ query }: MovieFiltersProps) {
  const hasFilters = Boolean(query.search || query.language || query.status !== "ALL");

  return (
    <Card className="space-y-4 bg-[rgba(21,21,25,0.92)] p-4 backdrop-blur-xl sm:p-5">
      <div aria-label="Movie status" className="flex flex-wrap gap-2" role="navigation">
        {statuses.map((status) => {
          const active = query.status === status.value;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]",
                active
                  ? "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white"
                  : "border-[var(--qs-border)] bg-[var(--qs-background)] text-[var(--qs-text-muted)] hover:border-[#565661] hover:text-[var(--qs-text)]",
              )}
              href={buildMoviesHref(query, { page: 0, status: status.value })}
              key={status.value}
            >
              {status.label}
            </Link>
          );
        })}
      </div>

      <form action="/movies" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)_auto_auto]" method="get">
        {query.status !== "ALL" ? <input name="status" type="hidden" value={query.status} /> : null}
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="movie-search">Search</label>
          <Input defaultValue={query.search} id="movie-search" name="search" placeholder="Search by movie title…" type="search" />
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="movie-language">Language</label>
          <Input defaultValue={query.language} id="movie-language" name="language" placeholder="e.g. English" />
        </div>
        <Button className="self-end" type="submit">Apply filters</Button>
        {hasFilters ? (
          <Link className="inline-flex min-h-11 items-center justify-center self-end rounded-lg px-3 text-sm font-semibold text-[var(--qs-text-muted)] hover:text-[var(--qs-text)]" href="/movies">
            Clear
          </Link>
        ) : null}
      </form>
    </Card>
  );
}
