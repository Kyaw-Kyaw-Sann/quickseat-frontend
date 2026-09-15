import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeaturedMovieHero } from "@/features/home/components/featured-movie-hero";
import { HomeCinemaCard } from "@/features/home/components/home-cinema-card";
import { HomeMovieCard } from "@/features/home/components/home-movie-card";
import { HomeSectionHeading } from "@/features/home/components/home-section-heading";
import type { Movie } from "@/features/movies/types";
import { getCinemas } from "@/lib/api/cinemas";
import { getNowShowingMovies, getUpcomingMovies } from "@/lib/api/movies";

export const dynamic = "force-dynamic";

const HOME_MOVIE_LIMIT = 6;
const HOME_UPCOMING_LIMIT = 4;
const HOME_CINEMA_LIMIT = 4;

function errorDescription(reason: unknown, resource: string): string {
  if (reason instanceof Error && reason.message) return reason.message;
  return `We could not load ${resource} right now. Please try again.`;
}

function RetryLink() {
  return (
    <Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href="/">
      Try again
    </Link>
  );
}

function releaseDateTimestamp(releaseDate: Movie["releaseDate"]): number | null {
  if (!releaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) return null;

  const [year, month, day] = releaseDate.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? timestamp
    : null;
}

function selectFeaturedMovie(movies: Movie[]): Movie | undefined {
  const nowShowingMovies = movies.filter(
    (movie) => movie.active && movie.status === "NOW_SHOWING",
  );
  const datedMovies = nowShowingMovies
    .map((movie) => ({ movie, timestamp: releaseDateTimestamp(movie.releaseDate) }))
    .filter((entry): entry is { movie: Movie; timestamp: number } => entry.timestamp !== null);

  if (datedMovies.length === 0) return nowShowingMovies[0];

  return datedMovies.reduce(
    (latest, entry) => entry.timestamp > latest.timestamp ? entry : latest,
  ).movie;
}

export default async function Home() {
  const [nowShowingResult, upcomingResult, cinemasResult] = await Promise.allSettled([
    getNowShowingMovies({ page: 0, size: HOME_MOVIE_LIMIT }),
    getUpcomingMovies({ page: 0, size: HOME_UPCOMING_LIMIT }),
    getCinemas({ page: 0, size: HOME_CINEMA_LIMIT }),
  ]);

  const nowShowing = nowShowingResult.status === "fulfilled" ? nowShowingResult.value.data.content : [];
  const upcoming = upcomingResult.status === "fulfilled" ? upcomingResult.value.data.content : [];
  const cinemas = cinemasResult.status === "fulfilled" ? cinemasResult.value.data.content : [];
  const featuredMovie = selectFeaturedMovie(nowShowing);

  return (
    <main>
      {featuredMovie ? (
        <FeaturedMovieHero movie={featuredMovie} />
      ) : nowShowingResult.status === "rejected" ? (
        <PageContainer className="py-12">
          <ErrorState title="Featured movie unavailable" description={errorDescription(nowShowingResult.reason, "the featured movie")} action={<RetryLink />} />
        </PageContainer>
      ) : (
        <PageContainer className="py-12">
          <EmptyState title="No featured movie yet" description="There are no now-showing movies available at the moment." />
        </PageContainer>
      )}

      <PageContainer className="space-y-16 py-12 sm:py-16">
        <section aria-labelledby="now-showing-heading">
          <HomeSectionHeading headingId="now-showing-heading" title="Now Showing" description="Great stories, now on the big screen." href="/movies?status=NOW_SHOWING" linkLabel="View all" />
          {nowShowingResult.status === "rejected" ? (
            <ErrorState title="Now showing movies unavailable" description={errorDescription(nowShowingResult.reason, "now-showing movies")} action={<RetryLink />} />
          ) : nowShowing.length === 0 ? (
            <EmptyState title="No movies are showing" description="Please check back soon for the latest cinema schedule." />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-6">
              {nowShowing.map((movie) => <HomeMovieCard key={movie.id} movie={movie} />)}
            </div>
          )}
        </section>

        <section aria-labelledby="upcoming-heading">
          <HomeSectionHeading headingId="upcoming-heading" title="Upcoming" description="More incredible journeys are coming soon." href="/movies?status=UPCOMING" linkLabel="View all" />
          {upcomingResult.status === "rejected" ? (
            <ErrorState title="Upcoming movies unavailable" description={errorDescription(upcomingResult.reason, "upcoming movies")} action={<RetryLink />} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="No upcoming movies" description="New upcoming releases will appear here when they are announced." />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {upcoming.map((movie) => <HomeMovieCard key={movie.id} movie={movie} upcoming />)}
            </div>
          )}
        </section>

        <section aria-labelledby="cinemas-heading">
          <HomeSectionHeading headingId="cinemas-heading" title="Browse by Cinema" description="Find your next big-screen experience." href="/cinemas" linkLabel="View all" />
          {cinemasResult.status === "rejected" ? (
            <ErrorState title="Cinemas unavailable" description={errorDescription(cinemasResult.reason, "cinemas")} action={<RetryLink />} />
          ) : cinemas.length === 0 ? (
            <EmptyState title="No cinemas available" description="Active QuickSeat cinemas will appear here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cinemas.map((cinema) => <HomeCinemaCard key={cinema.id} cinema={cinema} />)}
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
