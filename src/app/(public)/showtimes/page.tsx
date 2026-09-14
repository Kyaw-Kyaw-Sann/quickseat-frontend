import Link from "next/link";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { Cinema } from "@/features/cinemas/types";
import type { Movie } from "@/features/movies/types";
import { ShowtimeCard } from "@/features/showtimes/components/showtime-card";
import { ShowtimeFilters } from "@/features/showtimes/components/showtime-filters";
import { ShowtimePagination } from "@/features/showtimes/components/showtime-pagination";
import {
  buildShowtimesHref,
  parseShowtimeQuery,
} from "@/features/showtimes/query";
import type { ShowtimeQuery } from "@/features/showtimes/query";
import type { Showtime } from "@/features/showtimes/types";
import { getCinemas } from "@/lib/api/cinemas";
import { getMovies } from "@/lib/api/movies";
import { getShowtimes } from "@/lib/api/showtimes";
import type { PaginatedResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const SHOWTIMES_PER_PAGE = 10;
const SELECTOR_LIMIT = 100;

type ShowtimesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShowtimesPage({
  searchParams,
}: ShowtimesPageProps) {
  const query = parseShowtimeQuery(await searchParams);
  const [showtimesResult, movieOptionsResult, cinemaOptionsResult] =
    await Promise.all([
      loadShowtimes(query),
      loadMovieOptions(),
      loadCinemaOptions(),
    ]);

  if (!showtimesResult.ok) {
    const description =
      showtimesResult.error instanceof Error
        ? showtimesResult.error.message
        : "Showtimes could not be loaded right now.";

    return (
      <main>
        <PageContainer className="py-16">
          <ErrorState
            action={
              <Link
                className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                href={buildShowtimesHref(query, { page: 0 })}
              >
                Try again
              </Link>
            }
            description={description}
            title="Unable to load showtimes"
          />
        </PageContainer>
      </main>
    );
  }

  if (
    query.page > 0 &&
    showtimesResult.data.totalPages > 0 &&
    showtimesResult.data.content.length === 0
  ) {
    redirect(
      buildShowtimesHref(query, {
        page: showtimesResult.data.totalPages - 1,
      }),
    );
  }

  const optionsErrors = [movieOptionsResult.error, cinemaOptionsResult.error]
    .filter((error): error is unknown => Boolean(error))
    .map((error) =>
      error instanceof Error ? error.message : "Filter options are unavailable.",
    );

  return (
    <main>
      <header className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_68%_0%,#391018_0%,transparent_46%)]">
        <PageContainer className="py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--qs-primary)]">
            Your next great movie experience
          </p>
          <h1 className="qs-display mt-3">
            Find <span className="text-[var(--qs-primary)]">Showtimes</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--qs-text-muted)]">
            Choose a movie, cinema, and date to find active future showtimes.
          </p>
        </PageContainer>
      </header>

      <PageContainer className="py-8 sm:py-12">
        <ShowtimeFilters
          cinemas={cinemaOptionsResult.data}
          movies={movieOptionsResult.data}
          optionsError={optionsErrors[0]}
          query={query}
        />

        <section aria-labelledby="showtime-results-heading" className="mt-10">
          <div className="mb-5">
            <h2
              className="border-l-4 border-[var(--qs-primary)] pl-3 text-2xl font-bold tracking-tight sm:text-3xl"
              id="showtime-results-heading"
            >
              Available Showtimes
            </h2>
            <p className="mt-1 text-sm text-[var(--qs-text-muted)]">
              Times are shown in Myanmar time.
            </p>
          </div>

          {showtimesResult.data.content.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                  href="/showtimes"
                >
                  Clear filters
                </Link>
              }
              description="Try another movie, cinema, or date."
              title="No showtimes found"
            />
          ) : (
            <div className="space-y-4">
              {showtimesResult.data.content.map((showtime) => (
                <ShowtimeCard key={showtime.showtimeId} showtime={showtime} />
              ))}
            </div>
          )}
        </section>

        <ShowtimePagination
          currentPage={showtimesResult.data.page}
          query={query}
          totalElements={showtimesResult.data.totalElements}
          totalPages={showtimesResult.data.totalPages}
        />
      </PageContainer>
    </main>
  );
}

async function loadShowtimes(
  query: ShowtimeQuery,
): Promise<
  | { data: PaginatedResponse<Showtime>; ok: true }
  | { error: unknown; ok: false }
> {
  try {
    const response = await getShowtimes({
      cinemaId: query.cinemaId,
      date: query.date,
      movieId: query.movieId,
      page: query.page,
      size: SHOWTIMES_PER_PAGE,
    });
    return { data: response.data, ok: true };
  } catch (error) {
    return { error, ok: false };
  }
}

async function loadMovieOptions(): Promise<{
  data: Movie[];
  error?: unknown;
}> {
  try {
    const response = await getMovies({ page: 0, size: SELECTOR_LIMIT });
    return { data: response.data.content };
  } catch (error) {
    return { data: [], error };
  }
}

async function loadCinemaOptions(): Promise<{
  data: Cinema[];
  error?: unknown;
}> {
  try {
    const response = await getCinemas({ page: 0, size: SELECTOR_LIMIT });
    return { data: response.data.content };
  } catch (error) {
    return { data: [], error };
  }
}
