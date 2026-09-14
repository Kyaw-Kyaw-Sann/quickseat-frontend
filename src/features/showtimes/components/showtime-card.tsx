import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Showtime } from "@/features/showtimes/types";
import {
  formatMyanmarDate,
  formatMyanmarTime,
} from "@/lib/formatters/date-time";
import { formatMMK } from "@/lib/formatters/currency";

type ShowtimeCardProps = {
  showtime: Showtime;
};

export function ShowtimeCard({ showtime }: ShowtimeCardProps) {
  return (
    <Card className="grid gap-5 overflow-hidden p-0 md:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.8fr)_auto] md:items-stretch">
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--qs-primary)]">
          {formatMyanmarDate(showtime.startTime)}
        </p>
        <Link
          className="mt-2 inline-block text-xl font-bold text-[var(--qs-text)] transition hover:text-[var(--qs-primary)] sm:text-2xl"
          href={`/movies/${showtime.movieId}`}
        >
          {showtime.movieTitle}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--qs-text-muted)]">
          <span className="font-semibold text-[var(--qs-text)]">
            {formatMyanmarTime(showtime.startTime)}
          </span>
          <span aria-hidden="true">→</span>
          <span>{formatMyanmarTime(showtime.endTime)}</span>
          <span aria-hidden="true">·</span>
          <span>{showtime.screenName}</span>
        </div>
        <Link
          className="mt-3 inline-block text-sm text-[var(--qs-text-muted)] transition hover:text-[var(--qs-text)]"
          href={`/cinemas/${showtime.cinemaId}`}
        >
          {showtime.cinemaName}
        </Link>
      </div>

      <dl className="grid grid-cols-2 border-y border-[var(--qs-border)] md:border-x md:border-y-0">
        <div className="flex flex-col justify-center p-4 sm:p-5">
          <dt className="text-xs uppercase tracking-wider text-[var(--qs-text-muted)]">
            Normal seat
          </dt>
          <dd className="mt-1 font-semibold text-[var(--qs-text)]">
            {formatMMK(showtime.normalPrice)}
          </dd>
        </div>
        <div className="flex flex-col justify-center border-l border-[var(--qs-border)] p-4 sm:p-5">
          <dt className="text-xs uppercase tracking-wider text-[var(--qs-text-muted)]">
            Couple seat
          </dt>
          <dd className="mt-1 font-semibold text-[var(--qs-amber)]">
            {formatMMK(showtime.couplePrice)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center p-5 pt-0 md:p-5">
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--qs-primary)] px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,39,69,0.24)] transition hover:bg-[var(--qs-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)] md:w-auto"
          href={`/showtimes/${showtime.showtimeId}`}
        >
          Select Showtime <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </Card>
  );
}
