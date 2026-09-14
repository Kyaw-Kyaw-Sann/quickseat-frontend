import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CinemaQuery } from "@/features/cinemas/query";

type CinemaFiltersProps = {
  query: CinemaQuery;
};

export function CinemaFilters({ query }: CinemaFiltersProps) {
  const hasFilters = Boolean(query.search || query.city);

  return (
    <Card className="bg-[rgba(21,21,25,0.92)] p-4 backdrop-blur-xl sm:p-5">
      <form
        action="/cinemas"
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.5fr)_auto_auto]"
        method="get"
      >
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="cinema-search">Cinema</label>
          <Input
            defaultValue={query.search}
            id="cinema-search"
            name="search"
            placeholder="Search by cinema name…"
            type="search"
          />
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="cinema-city">City</label>
          <Input
            defaultValue={query.city}
            id="cinema-city"
            name="city"
            placeholder="e.g. Yangon"
          />
        </div>
        <Button className="self-end" type="submit">
          Find cinemas
        </Button>
        {hasFilters ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center self-end rounded-lg px-3 text-sm font-semibold text-[var(--qs-text-muted)] hover:text-[var(--qs-text)]"
            href="/cinemas"
          >
            Clear
          </Link>
        ) : null}
      </form>
    </Card>
  );
}
