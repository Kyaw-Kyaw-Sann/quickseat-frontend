"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import type { BookingDetail } from "@/features/bookings/types";
import { clearActiveSeatHold } from "@/features/seat-holds/active-seat-hold";
import { TicketEntryAction } from "@/features/tickets/components/ticket-entry-action";
import { getBookingDetail } from "@/lib/api/bookings";
import { isApiRequestError } from "@/lib/api/errors";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type BookingConfirmationProps = {
  bookingReference: string;
};

type ConfirmationViewState =
  | "loading"
  | "detail"
  | "verification"
  | "not-found"
  | "error";

export function BookingConfirmation(props: BookingConfirmationProps) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <BookingConfirmationContent {...props} />
    </AuthGuard>
  );
}

function BookingConfirmationContent({
  bookingReference,
}: BookingConfirmationProps) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const [viewState, setViewState] =
    useState<ConfirmationViewState>("loading");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNetworkError, setIsNetworkError] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      const response = await getBookingDetail(bookingReference);
      const authoritativeBooking = response.data;

      markEmailVerified();
      setBooking(authoritativeBooking);
      setErrorMessage("");
      setIsNetworkError(false);
      setViewState("detail");

      if (authoritativeBooking.status !== "PENDING") {
        clearActiveSeatHold(bookingReference);
      }
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      if (isApiRequestError(error) && error.status === 404) {
        setViewState("not-found");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The booking confirmation could not be loaded.",
      );
      setIsNetworkError(
        isApiRequestError(error) && error.isNetworkError,
      );
      setViewState("error");
    }
  }, [bookingReference, markEmailVerified]);

  useEffect(() => {
    const initialize = window.setTimeout(() => void loadBooking(), 0);
    return () => window.clearTimeout(initialize);
  }, [loadBooking]);

  return (
    <main>
      <PageContainer className="py-10 sm:py-14">
        {viewState === "loading" ? <ConfirmationSkeleton /> : null}

        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => {
                setViewState("loading");
                void loadBooking();
              }}
            />
          </div>
        ) : null}

        {viewState === "not-found" ? (
          <ErrorState
            action={
              <Button onClick={() => router.push("/movies")}>
                Browse movies
              </Button>
            }
            description="This booking does not exist or is not available to this account."
            title="Booking not found"
          />
        ) : null}

        {viewState === "error" ? (
          <ErrorState
            action={<Button onClick={() => void loadBooking()}>Try again</Button>}
            description={errorMessage}
            title={
              isNetworkError
                ? "Connection problem"
                : "Unable to load confirmation"
            }
          />
        ) : null}

        {viewState === "detail" && booking ? (
          <BookingLifecycleView booking={booking} />
        ) : null}
      </PageContainer>
    </main>
  );
}

function BookingLifecycleView({ booking }: { booking: BookingDetail }) {
  switch (booking.status) {
    case "CONFIRMED":
      return <ConfirmedBooking booking={booking} />;
    case "PENDING":
      return <PendingBooking booking={booking} />;
    case "CANCELLED":
      return (
        <NonConfirmedBooking
          booking={booking}
          description="This booking was cancelled and cannot be used to generate a ticket."
          title="Booking cancelled"
        />
      );
    case "EXPIRED":
      return (
        <NonConfirmedBooking
          booking={booking}
          description="The reservation expired before payment was confirmed. Choose another showtime to book again."
          title="Booking expired"
        />
      );
    case "USED":
      return (
        <NonConfirmedBooking
          booking={booking}
          browseHref="/movies"
          browseLabel="Browse more movies"
          description="This booking has already been used for cinema entry."
          title="Booking already used"
        />
      );
    default:
      return (
        <NonConfirmedBooking
          booking={booking}
          description={`QuickSeat returned the booking status “${booking.status}”. No confirmation or ticket action is available for this state.`}
          title="Booking status unavailable"
        />
      );
  }
}

function ConfirmedBooking({ booking }: { booking: BookingDetail }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl">
      <Card className="overflow-hidden p-0 shadow-none">
        <div className="border-b border-[var(--qs-border)] px-6 py-8 sm:px-10 sm:py-10">
          <div>
            <StatusBadge status={booking.status} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Booking confirmed
          </h1>
          <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
            Your payment and cinema booking were confirmed by QuickSeat.
          </p>
        </div>

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--qs-primary)]">
              Booking reference
            </p>
            <p className="mt-2 break-all font-mono text-2xl font-bold sm:text-3xl">
              {booking.bookingReference}
            </p>

            <dl className="mt-8 grid gap-5 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
              <Detail label="Movie" value={booking.movieTitle} />
              <Detail label="Cinema" value={booking.cinemaName} />
              <Detail label="Screen" value={booking.screenName} />
              <Detail
                label="Showtime"
                value={formatMyanmarDateTime(booking.startTime)}
              />
              <Detail label="Category" value={booking.category} />
              <Detail label="Total paid" value={formatMMK(booking.totalAmount)} />
            </dl>

            <SeatUnits seats={booking.seats} />
          </div>

          <aside className="h-fit border-l-2 border-l-[var(--qs-primary)] bg-[var(--qs-surface-raised)] p-5">
            <p className="text-sm font-semibold">Your booking is ready</p>
            <p className="mt-2 text-sm leading-6 text-[var(--qs-text-muted)]">
              Generate or open your backend-issued cinema ticket.
            </p>
            <TicketEntryAction bookingReference={booking.bookingReference} />
            <Button
              className="mt-3 w-full"
              onClick={() => router.push("/movies")}
              variant="secondary"
            >
              Browse more movies
            </Button>
          </aside>
        </div>
      </Card>
    </div>
  );
}

function PendingBooking({ booking }: { booking: BookingDetail }) {
  const router = useRouter();

  return (
    <LifecycleCard
      action={
        <Button
          onClick={() =>
            router.push(
              `/checkout/payment/${encodeURIComponent(booking.bookingReference)}`,
            )
          }
        >
          Return to payment
        </Button>
      }
      booking={booking}
      description="QuickSeat has not confirmed payment for this booking. The payment page will revalidate whether it is still payable."
      title="Booking is still pending"
    />
  );
}

function NonConfirmedBooking({
  booking,
  browseHref = "/showtimes",
  browseLabel = "Browse showtimes",
  description,
  title,
}: {
  booking: BookingDetail;
  browseHref?: string;
  browseLabel?: string;
  description: string;
  title: string;
}) {
  const router = useRouter();

  return (
    <LifecycleCard
      action={
        <Button onClick={() => router.push(browseHref)}>{browseLabel}</Button>
      }
      booking={booking}
      description={description}
      title={title}
    />
  );
}

function LifecycleCard({
  action,
  booking,
  description,
  title,
}: {
  action: ReactNode;
  booking: BookingDetail;
  description: string;
  title: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl p-6 text-center sm:p-9">
      <StatusBadge status={booking.status} />
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--qs-text-muted)]">
        {description}
      </p>
      <dl className="mt-7 grid gap-4 border-y border-[var(--qs-border)] py-5 text-left sm:grid-cols-2">
        <Detail label="Booking reference" value={booking.bookingReference} />
        <Detail label="Movie" value={booking.movieTitle} />
        <Detail label="Showtime" value={formatMyanmarDateTime(booking.startTime)} />
        <Detail label="Amount" value={formatMMK(booking.totalAmount)} />
      </dl>
      <div className="mt-7">{action}</div>
    </Card>
  );
}

function SeatUnits({ seats }: { seats: unknown[] }) {
  return (
    <section className="mt-7" aria-labelledby="confirmed-seat-units">
      <h2 className="font-semibold" id="confirmed-seat-units">
        Selected seats
      </h2>
      {seats.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {seats.map((seat, index) => (
            <li
              className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-3 py-2 text-sm"
              key={getSeatKey(seat, index)}
            >
              {getSeatLabel(seat, index)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
          Seat item details were not included in this booking response.
        </p>
      )}
    </section>
  );
}

function getSeatLabel(seat: unknown, index: number): string {
  return typeof seat === "string" || typeof seat === "number"
    ? String(seat)
    : `Seat unit ${index + 1}`;
}

function getSeatKey(seat: unknown, index: number): string {
  return `${getSeatLabel(seat, index)}-${index}`;
}

function ConfirmationSkeleton() {
  return (
    <Card className="mx-auto max-w-5xl space-y-6 p-8" role="status">
      <div className="grid place-items-center gap-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <span className="sr-only">Loading booking confirmation…</span>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}
