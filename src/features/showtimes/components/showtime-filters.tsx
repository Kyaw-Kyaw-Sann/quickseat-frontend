import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Cinema } from "@/features/cinemas/types";
import type { Movie } from "@/features/movies/types";
import type { ShowtimeQuery } from "@/features/showtimes/query";

type ShowtimeFiltersProps = {
  cinemas: Cinema[];
  movies: Movie[];
  optionsError?: string;
  query: ShowtimeQuery;
};

export function ShowtimeFilters({
  cinemas,
  movies,
  optionsError,
  query,
}: ShowtimeFiltersProps) {
  const hasFilters = Boolean(query.movieId || query.cinemaId || query.date);

  return (
    <Card className="bg-[rgba(21,21,25,0.94)] p-4 backdrop-blur-xl sm:p-5">
      <form
        action="/showtimes"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(12rem,0.7fr)_auto_auto]"
        method="get"
      >
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="showtime-movie">Movie</label>
          <Select
            defaultValue={query.movieId ? String(query.movieId) : ""}
            id="showtime-movie"
            name="movieId"
          >
            <option value="">All movies</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="showtime-cinema">Cinema</label>
          <Select
            defaultValue={query.cinemaId ? String(query.cinemaId) : ""}
            id="showtime-cinema"
            name="cinemaId"
          >
            <option value="">All cinemas</option>
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5 text-sm font-medium text-[var(--qs-text-muted)]">
          <label htmlFor="showtime-date">Date</label>
          <Input
            defaultValue={query.date}
            id="showtime-date"
            name="date"
            type="date"
          />
        </div>
        <Button className="self-end sm:col-span-1" type="submit">
          Find showtimes
        </Button>
        {hasFilters ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center self-end rounded-lg px-3 text-sm font-semibold text-[var(--qs-text-muted)] hover:text-[var(--qs-text)]"
            href="/showtimes"
          >
            Clear
          </Link>
        ) : null}
      </form>
      {optionsError ? (
        <p className="mt-3 text-sm text-[var(--qs-warning)]" role="alert">
          {optionsError}
        </p>
      ) : null}
    </Card>
  );
}
