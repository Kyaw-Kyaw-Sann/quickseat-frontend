import Link from "next/link";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { HomeMovieCard } from "@/features/home/components/home-movie-card";
import { MovieFilters } from "@/features/movies/components/movie-filters";
import { MoviePagination } from "@/features/movies/components/movie-pagination";
import { buildMoviesHref, parseMovieQuery } from "@/features/movies/query";
import type { MovieQuery } from "@/features/movies/query";
import type { Movie } from "@/features/movies/types";
import { getMovies, getNowShowingMovies, getUpcomingMovies } from "@/lib/api/movies";
import type { PaginatedResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const MOVIES_PER_PAGE = 12;

type MoviesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const query = parseMovieQuery(await searchParams);
  const result = await loadMovies(query);

  if (!result.ok) {
    const description = result.error instanceof Error ? result.error.message : "Movies could not be loaded right now.";
    return (
      <main>
        <PageContainer className="py-16">
          <ErrorState title="Unable to load movies" description={description} action={<Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href="/movies">Try again</Link>} />
        </PageContainer>
      </main>
    );
  }

  if (query.page > 0 && result.data.totalPages > 0 && result.data.content.length === 0) {
    redirect(buildMoviesHref(query, { page: result.data.totalPages - 1 }));
  }

  const movies = result.data.content;

  return (
    <main>
      <header className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_72%_0%,#351019_0%,transparent_45%)]">
        <PageContainer className="py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--qs-primary)]">Discover extraordinary stories</p>
          <h1 className="qs-display mt-3">Browse <span className="text-[var(--qs-primary)]">Movies</span></h1>
          <p className="mt-4 max-w-2xl text-[var(--qs-text-muted)]">From now-showing films to upcoming releases, find your next cinema experience at QuickSeat.</p>
        </PageContainer>
      </header>

      <PageContainer className="py-8 sm:py-12">
        <MovieFilters query={query} />
        <div className="mt-9">
          {movies.length === 0 ? (
            <EmptyState
              title="No movies found"
              description="Try changing the title, status, or language filter."
              action={<Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href="/movies">Clear filters</Link>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {movies.map((movie) => <HomeMovieCard key={movie.id} movie={movie} upcoming={movie.status === "UPCOMING"} />)}
            </div>
          )}
        </div>
        <MoviePagination currentPage={result.data.page} query={query} totalElements={result.data.totalElements} totalPages={result.data.totalPages} />
      </PageContainer>
    </main>
  );
}

async function loadMovies(query: MovieQuery): Promise<{ data: PaginatedResponse<Movie>; ok: true } | { error: unknown; ok: false }> {
  try {
    const response = query.status === "NOW_SHOWING"
      ? await getNowShowingMovies({ language: query.language, page: query.page, search: query.search, size: MOVIES_PER_PAGE })
      : query.status === "UPCOMING"
        ? await getUpcomingMovies({ language: query.language, page: query.page, search: query.search, size: MOVIES_PER_PAGE })
        : await getMovies({ language: query.language, page: query.page, search: query.search, size: MOVIES_PER_PAGE });

    return { data: response.data, ok: true };
  } catch (error) {
    return { error, ok: false };
  }
}
