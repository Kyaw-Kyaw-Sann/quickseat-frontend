import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
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

export function ShowtimeFilters({ cinemas, movies, optionsError, query }: ShowtimeFiltersProps) {
  return (
    <Card className="bg-[rgba(21,21,25,0.94)] p-3 shadow-none backdrop-blur-xl">
      <LiveFilterForm className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="sr-only" htmlFor="showtime-movie">Movie</label>
          <Select className="!min-h-10" defaultValue={query.movieId ? String(query.movieId) : ""} id="showtime-movie" name="movieId">
            <option value="">All movies</option>
            {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
          </Select>
        </div>
        <div>
          <label className="sr-only" htmlFor="showtime-cinema">Cinema</label>
          <Select className="!min-h-10" defaultValue={query.cinemaId ? String(query.cinemaId) : ""} id="showtime-cinema" name="cinemaId">
            <option value="">All cinemas</option>
            {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="sr-only" htmlFor="showtime-date">Date</label>
          <Input className="!min-h-10" defaultValue={query.date} id="showtime-date" name="date" type="date" />
        </div>
      </LiveFilterForm>
      {optionsError ? <p className="mt-3 text-sm text-[var(--qs-warning)]" role="alert">{optionsError}</p> : null}
    </Card>
  );
}
