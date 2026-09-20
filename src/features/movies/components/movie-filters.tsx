import Link from "next/link";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import { buildMoviesHref } from "@/features/movies/query";
import type { MovieQuery, MovieStatusFilter } from "@/features/movies/query";
import { cn } from "@/lib/utils/cn";

const statuses: { label: string; value: MovieStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Now Showing", value: "NOW_SHOWING" },
  { label: "Upcoming", value: "UPCOMING" },
];

export function MovieFilters({ query }: { query: MovieQuery }) {
  return (
    <div className="space-y-3">
      <div aria-label="Movie status" className="flex gap-2 overflow-x-auto" role="navigation">
        {statuses.map((status) => {
          const active = query.status === status.value;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-lg border px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] sm:text-sm",
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

      <LiveFilterForm className="grid gap-2 sm:grid-cols-2">
        {query.status !== "ALL" ? <input name="status" type="hidden" value={query.status} /> : null}
        <div>
          <label className="sr-only" htmlFor="movie-search">Search movies</label>
          <Input className="!min-h-10" defaultValue={query.search} id="movie-search" name="search" placeholder="Search for a movie..." type="search" />
        </div>
        <div>
          <label className="sr-only" htmlFor="movie-language">Language</label>
          <Input className="!min-h-10" defaultValue={query.language} id="movie-language" name="language" placeholder="All languages" />
        </div>
      </LiveFilterForm>
    </div>
  );
}
