import Link from "next/link";
import { Artwork } from "@/features/home/components/artwork";
import type { Movie } from "@/features/movies/types";
import { formatMyanmarDate } from "@/lib/formatters/date-time";
import { formatDuration } from "@/lib/formatters/duration";

type HomeMovieCardProps = {
  movie: Movie;
  upcoming?: boolean;
};

export function HomeMovieCard({ movie, upcoming = false }: HomeMovieCardProps) {
  return (
    <article className="group min-w-0">
      <Link
        aria-label={`View details for ${movie.title}`}
        className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(255,39,69,0.72)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
        href={`/movies/${movie.id}`}
      >
        <Artwork
          alt={`${movie.title} poster`}
          className="transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 46vw, (max-width: 1280px) 30vw, 16vw"
          src={movie.posterUrl}
        />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
      </Link>
      <div className="pt-3">
        <h3 className="truncate font-semibold text-[var(--qs-text)]">{movie.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--qs-text-muted)]">
          {upcoming && movie.releaseDate ? (
            <span>Opens {formatMyanmarDate(movie.releaseDate)}</span>
          ) : (
            <>
              {movie.genres[0] ? <span>{movie.genres[0]}</span> : null}
              <span>{formatDuration(movie.durationMinutes)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
