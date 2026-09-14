import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import type { Cinema } from "@/features/cinemas/types";
import { Artwork } from "@/features/home/components/artwork";
import { getCinema } from "@/lib/api/cinemas";
import { isApiRequestError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

type CinemaDetailPageProps = {
  params: Promise<{ cinemaId: string }>;
};

export default async function CinemaDetailPage({
  params,
}: CinemaDetailPageProps) {
  const { cinemaId: rawCinemaId } = await params;
  const cinemaId = Number(rawCinemaId);

  if (!Number.isSafeInteger(cinemaId) || cinemaId <= 0) notFound();

  const result = await loadCinema(cinemaId);
  if (result.kind === "not-found") notFound();

  if (result.kind === "error") {
    const description =
      result.error instanceof Error
        ? result.error.message
        : "Cinema details could not be loaded right now.";

    return (
      <main>
        <PageContainer className="py-16">
          <ErrorState
            action={
              <Link
                className="text-sm font-semibold text-[var(--qs-primary)] hover:underline"
                href="/cinemas"
              >
                Back to cinemas
              </Link>
            }
            description={description}
            title="Unable to load this cinema"
          />
        </PageContainer>
      </main>
    );
  }

  const cinema = result.cinema;

  return (
    <main>
      <section
        aria-labelledby="cinema-name"
        className="relative min-h-[32rem] overflow-hidden border-b border-[var(--qs-border)]"
      >
        <div className="absolute inset-0">
          <Artwork
            alt={`${cinema.name} exterior`}
            className="object-center"
            priority
            sizes="100vw"
            src={cinema.imageUrl}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,7,0.98)_0%,rgba(5,5,7,0.82)_42%,rgba(5,5,7,0.28)_78%,rgba(5,5,7,0.55)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--qs-background)] via-transparent to-black/20" />
        </div>

        <PageContainer className="relative flex min-h-[32rem] items-end py-12 sm:items-center sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--qs-primary)]">
              Cinema experience reimagined
            </p>
            <h1 className="qs-display mt-3" id="cinema-name">
              {cinema.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="primary">{cinema.city}</Badge>
              <Badge tone="success">Open for booking</Badge>
            </div>
            <address className="mt-6 max-w-xl not-italic text-white/75">
              <p className="text-base sm:text-lg">{cinema.address}</p>
              {cinema.phone ? (
                <a
                  className="mt-2 inline-block text-sm text-white transition hover:text-[var(--qs-primary)]"
                  href={`tel:${cinema.phone}`}
                >
                  {cinema.phone}
                </a>
              ) : null}
            </address>
            <Link
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--qs-primary)] px-5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,39,69,0.28)] transition hover:bg-[var(--qs-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
              href={`/showtimes?cinemaId=${cinema.id}`}
            >
              See Showtimes <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}

async function loadCinema(
  cinemaId: number,
): Promise<
  | { cinema: Cinema; kind: "success" }
  | { error: unknown; kind: "error" }
  | { kind: "not-found" }
> {
  try {
    const response = await getCinema(cinemaId);
    return { cinema: response.data, kind: "success" };
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) {
      return { kind: "not-found" };
    }
    return { error, kind: "error" };
  }
}
