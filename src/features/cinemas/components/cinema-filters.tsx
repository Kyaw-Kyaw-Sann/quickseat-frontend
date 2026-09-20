import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import type { CinemaQuery } from "@/features/cinemas/query";

export function CinemaFilters({ query }: { query: CinemaQuery }) {
  return (
    <LiveFilterForm className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="sr-only" htmlFor="cinema-search">Search cinemas</label>
          <Input className="!min-h-10" defaultValue={query.search} id="cinema-search" name="search" placeholder="Search for a cinema..." type="search" />
        </div>
        <div>
          <label className="sr-only" htmlFor="cinema-city">City</label>
          <Input className="!min-h-10" defaultValue={query.city} id="cinema-city" name="city" placeholder="All cities" />
        </div>
    </LiveFilterForm>
  );
}
