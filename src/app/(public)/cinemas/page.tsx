import Link from "next/link";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CinemaFilters } from "@/features/cinemas/components/cinema-filters";
import { CinemaPagination } from "@/features/cinemas/components/cinema-pagination";
import { buildCinemasHref, parseCinemaQuery } from "@/features/cinemas/query";
import type { CinemaQuery } from "@/features/cinemas/query";
import type { Cinema } from "@/features/cinemas/types";
import { HomeCinemaCard } from "@/features/home/components/home-cinema-card";
import { getCinemas } from "@/lib/api/cinemas";
import type { PaginatedResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const CINEMAS_PER_PAGE = 9;

type CinemasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CinemasPage({ searchParams }: CinemasPageProps) {
  const query = parseCinemaQuery(await searchParams);
  const result = await loadCinemas(query);

  if (!result.ok) {
    const description =
      result.error instanceof Error
        ? result.error.message
        : "Cinemas could not be loaded right now.";

    return (
      <main>
        <PageContainer className="py-16">
          <ErrorState
            action={
              <Link
                className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                href="/cinemas"
              >
                Try again
              </Link>
            }
            description={description}
            title="Unable to load cinemas"
          />
        </PageContainer>
      </main>
    );
  }

  if (
    query.page > 0 &&
    result.data.totalPages > 0 &&
    result.data.content.length === 0
  ) {
    redirect(buildCinemasHref(query, { page: result.data.totalPages - 1 }));
  }

  return (
    <main>
      <header className="border-b border-[var(--qs-border)] bg-[radial-gradient(circle_at_68%_0%,#391018_0%,transparent_46%)]">
        <PageContainer className="py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--qs-primary)]">
            Big stories deserve a bigger screen
          </p>
          <h1 className="qs-display mt-3">
            Find a <span className="text-[var(--qs-primary)]">Cinema</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--qs-text-muted)]">
            Discover active QuickSeat cinemas and choose where your next movie
            experience begins.
          </p>
        </PageContainer>
      </header>

      <PageContainer className="py-8 sm:py-12">
        <CinemaFilters query={query} />
        <div className="mt-9">
          {result.data.content.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                  href="/cinemas"
                >
                  Clear filters
                </Link>
              }
              description="Try changing the cinema name or city filter."
              title="No cinemas found"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.content.map((cinema) => (
                <HomeCinemaCard
                  cinema={cinema}
                  key={cinema.id}
                  showShowtimesAction
                />
              ))}
            </div>
          )}
        </div>
        <CinemaPagination
          currentPage={result.data.page}
          query={query}
          totalElements={result.data.totalElements}
          totalPages={result.data.totalPages}
        />
      </PageContainer>
    </main>
  );
}

async function loadCinemas(
  query: CinemaQuery,
): Promise<
  | { data: PaginatedResponse<Cinema>; ok: true }
  | { error: unknown; ok: false }
> {
  try {
    const response = await getCinemas({
      city: query.city,
      page: query.page,
      search: query.search,
      size: CINEMAS_PER_PAGE,
    });
    return { data: response.data, ok: true };
  } catch (error) {
    return { error, ok: false };
  }
}
