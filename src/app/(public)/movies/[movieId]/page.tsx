import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Artwork } from "@/features/home/components/artwork";
import type { Movie } from "@/features/movies/types";
import { isApiRequestError } from "@/lib/api/errors";
import { getMovie } from "@/lib/api/movies";
import { formatMyanmarDate } from "@/lib/formatters/date-time";
import { formatDuration } from "@/lib/formatters/duration";

export const dynamic = "force-dynamic";

type MovieDetailPageProps = {
  params: Promise<{ movieId: string }>;
};

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { movieId: rawMovieId } = await params;
  const movieId = Number(rawMovieId);

  if (!Number.isSafeInteger(movieId) || movieId <= 0) notFound();
  const result = await loadMovie(movieId);

  if (result.kind === "not-found") notFound();

  if (result.kind === "error") {
    const description = result.error instanceof Error ? result.error.message : "Movie details could not be loaded right now.";
    return (
      <main>
        <PageContainer className="py-16">
          <ErrorState title="Unable to load this movie" description={description} action={<Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href="/movies">Back to movies</Link>} />
        </PageContainer>
      </main>
    );
  }

  const movie = result.movie;

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[40rem] opacity-35">
        <Artwork alt="" className="blur-sm" priority sizes="100vw" src={movie.posterUrl} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--qs-background)_0%,rgba(9,9,11,0.78)_48%,var(--qs-background)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-[var(--qs-background)]" />
      </div>

      <PageContainer className="relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-12 lg:py-20">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-72 overflow-hidden rounded-2xl border border-[rgba(255,39,69,0.55)] bg-[var(--qs-surface)] shadow-[0_0_45px_rgba(255,39,69,0.17)] lg:max-w-none">
          <Artwork alt={`${movie.title} poster`} priority sizes="(max-width: 1024px) 18rem, 19rem" src={movie.posterUrl} />
        </div>

        <article className="self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--qs-primary)]">Movie details</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="qs-display">{movie.title}</h1>
            <StatusBadge status={movie.status} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {movie.genres.map((genre) => <Badge key={genre}>{genre}</Badge>)}
            <Badge>{formatDuration(movie.durationMinutes)}</Badge>
            {movie.language ? <Badge>{movie.language}</Badge> : null}
            {movie.ageRating ? <Badge tone="warning">{movie.ageRating}</Badge> : null}
          </div>

          {movie.description ? <p className="mt-6 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">{movie.description}</p> : null}

          <dl className="mt-7 grid max-w-3xl gap-x-8 gap-y-4 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
            <MovieFact label="Release date" value={movie.releaseDate ? formatMyanmarDate(movie.releaseDate) : "Not announced"} />
            <MovieFact label="Director" value={movie.director || "Not available"} />
            <MovieFact className="sm:col-span-2" label="Cast" value={movie.castText || "Not available"} />
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--qs-primary)] px-5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,39,69,0.28)] transition hover:bg-[var(--qs-primary-strong)]" href={`/showtimes?movieId=${movie.id}`}>
              {movie.status === "UPCOMING" ? "View Showtimes" : "Book Tickets"} <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            {movie.trailerUrl ? (
              <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-black/30 px-5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10" href={movie.trailerUrl} rel="noreferrer" target="_blank">
                View Trailer <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </article>
      </PageContainer>
    </main>
  );
}

async function loadMovie(movieId: number): Promise<{ kind: "success"; movie: Movie } | { error: unknown; kind: "error" } | { kind: "not-found" }> {
  try {
    const response = await getMovie(movieId);
    return { kind: "success", movie: response.data };
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return { kind: "not-found" };
    return { error, kind: "error" };
  }
}

function MovieFact({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--qs-text)]">{value}</dd>
    </div>
  );
}
