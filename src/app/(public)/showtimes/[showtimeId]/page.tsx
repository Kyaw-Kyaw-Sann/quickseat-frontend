import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SeatSelection } from "@/features/showtimes/components/seat-selection";
import type { ShowtimeSeatMap } from "@/features/showtimes/types";
import { isApiRequestError } from "@/lib/api/errors";
import { getShowtimeSeats } from "@/lib/api/showtimes";

export const dynamic = "force-dynamic";

type ShowtimeSeatPageProps = {
  params: Promise<{ showtimeId: string }>;
};

export default async function ShowtimeSeatPage({ params }: ShowtimeSeatPageProps) {
  const { showtimeId: rawShowtimeId } = await params;
  const showtimeId = Number(rawShowtimeId);

  if (!Number.isSafeInteger(showtimeId) || showtimeId <= 0) notFound();

  const result = await loadSeatMap(showtimeId);

  if (!result.ok) {
    if (isApiRequestError(result.error) && result.error.status === 404) notFound();

    return (
      <main>
        <PageContainer className="py-12 sm:py-16">
          <ErrorState
            action={
              <Link
                className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                href={`/showtimes/${showtimeId}`}
              >
                Try again
              </Link>
            }
            description={
              result.error instanceof Error
                ? result.error.message
                : "The seat map could not be loaded right now."
            }
            title="Unable to load seats"
          />
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="bg-[radial-gradient(circle_at_12%_22%,rgba(120,8,29,0.18),transparent_32%)]">
      <PageContainer className="py-8 sm:py-12">
        <Link
          className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--qs-text-muted)] transition hover:text-[var(--qs-text)]"
          href="/showtimes"
        >
          ← Back to showtimes
        </Link>

        {result.data.seats.length === 0 ? (
          <EmptyState
            action={
              <Link
                className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                href="/showtimes"
              >
                Browse other showtimes
              </Link>
            }
            description="This showtime does not have a seat inventory yet."
            title="No seats available"
          />
        ) : (
          <SeatSelection seatMap={result.data} />
        )}
      </PageContainer>
    </main>
  );
}

async function loadSeatMap(
  showtimeId: number,
): Promise<
  | { data: ShowtimeSeatMap; ok: true }
  | { error: unknown; ok: false }
> {
  try {
    const response = await getShowtimeSeats(showtimeId);
    return { data: response.data, ok: true };
  } catch (error) {
    return { error, ok: false };
  }
}
