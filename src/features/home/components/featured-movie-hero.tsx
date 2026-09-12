import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Artwork } from "@/features/home/components/artwork";
import type { Movie } from "@/features/movies/types";
import { formatDuration } from "@/lib/formatters/duration";

type FeaturedMovieHeroProps = {
  movie: Movie;
};

export function FeaturedMovieHero({ movie }: FeaturedMovieHeroProps) {
  return (
    <section aria-labelledby="featured-movie-title" className="relative min-h-[34rem] overflow-hidden border-b border-[var(--qs-border)] sm:min-h-[38rem]">
      <div className="absolute inset-0">
        <Artwork
          alt={`${movie.title} featured artwork`}
          className="object-center"
          priority
          sizes="100vw"
          src={movie.posterUrl}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,7,0.98)_0%,rgba(5,5,7,0.88)_38%,rgba(5,5,7,0.3)_70%,rgba(5,5,7,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--qs-background)] via-transparent to-black/15" />
      </div>
      <div className="relative mx-auto flex min-h-[34rem] w-full max-w-7xl items-end px-[var(--qs-page-padding)] py-14 sm:min-h-[38rem] sm:items-center">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--qs-primary)]">
            Now showing at QuickSeat
          </p>
          <h1 className="qs-display" id="featured-movie-title">{movie.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {movie.genres.slice(0, 3).map((genre) => (
              <Badge key={genre}>{genre}</Badge>
            ))}
            <Badge>{formatDuration(movie.durationMinutes)}</Badge>
            {movie.ageRating ? <Badge tone="warning">{movie.ageRating}</Badge> : null}
          </div>
          {movie.description ? (
            <p className="mt-5 line-clamp-3 max-w-xl text-base text-white/75 sm:text-lg">
              {movie.description}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--qs-primary)] px-5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,39,69,0.3)] transition hover:bg-[var(--qs-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
              href={`/showtimes?movieId=${movie.id}`}
            >
              Book Tickets <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-black/30 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              href={`/movies/${movie.id}`}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
