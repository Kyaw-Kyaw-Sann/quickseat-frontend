"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import { BookingDetailSkeleton } from "@/features/bookings/components/booking-detail-skeleton";
import type { BookingDetail } from "@/features/bookings/types";
import { clearActiveSeatHold } from "@/features/seat-holds/active-seat-hold";
import { TicketAccessAction } from "@/features/tickets/components/ticket-access-action";
import {
  cancelBooking,
  getBookingDetail,
  getPaymentSummary,
} from "@/lib/api/bookings";
import { isApiRequestError } from "@/lib/api/errors";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type BookingDetailPageProps = {
  bookingReference: string;
  returnHref: string;
};

type DetailViewState =
  | "loading"
  | "detail"
  | "verification"
  | "not-found"
  | "error";

type PaymentEligibility = "idle" | "loading" | "payable" | "unavailable" | "error";

export function BookingDetailPage(props: BookingDetailPageProps) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <BookingDetailContent {...props} />
    </AuthGuard>
  );
}

function BookingDetailContent({
  bookingReference,
  returnHref,
}: BookingDetailPageProps) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const cancellationLock = useRef(false);
  const loadSequence = useRef(0);
  const [viewState, setViewState] = useState<DetailViewState>("loading");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [paymentEligibility, setPaymentEligibility] =
    useState<PaymentEligibility>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationNetworkError, setCancellationNetworkError] =
    useState(false);
  const [cancellationConflict, setCancellationConflict] = useState(false);

  const checkPaymentEligibility = useCallback(async () => {
    setPaymentEligibility("loading");
    setPaymentMessage("");

    try {
      const response = await getPaymentSummary(bookingReference);
      const summary = response.data;
      markEmailVerified();

      if (
        summary.bookingStatus === "PENDING" &&
        summary.canPay &&
        summary.remainingSeconds > 0
      ) {
        setPaymentEligibility("payable");
        setPaymentMessage("Backend confirms that this booking is currently payable.");
      } else {
        setPaymentEligibility("unavailable");
        setPaymentMessage(
          `Payment is unavailable for the current ${summary.bookingStatus} lifecycle state.`,
        );
      }
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      const requestError = isApiRequestError(error) ? error : null;
      setPaymentEligibility(requestError?.isNetworkError ? "error" : "unavailable");
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "Payment eligibility could not be checked.",
      );
    }
  }, [bookingReference, markEmailVerified]);

  const loadBooking = useCallback(async () => {
    const requestId = ++loadSequence.current;
    setViewState("loading");

    try {
      const response = await getBookingDetail(bookingReference);
      if (requestId !== loadSequence.current) return;

      const authoritativeBooking = response.data;
      markEmailVerified();
      setBooking(authoritativeBooking);
      setErrorMessage("");
      setIsNetworkError(false);
      setViewState("detail");

      if (authoritativeBooking.status === "PENDING") {
        void checkPaymentEligibility();
      } else {
        setPaymentEligibility("idle");
        setPaymentMessage("");
        clearActiveSeatHold(bookingReference);
      }
    } catch (error) {
      if (requestId !== loadSequence.current) return;

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
          : "The booking details could not be loaded.",
      );
      setIsNetworkError(isApiRequestError(error) && error.isNetworkError);
      setViewState("error");
    }
  }, [bookingReference, checkPaymentEligibility, markEmailVerified]);

  useEffect(() => {
    const initialize = window.setTimeout(() => void loadBooking(), 0);
    return () => window.clearTimeout(initialize);
  }, [loadBooking]);

  async function handleCancellation() {
    if (cancellationLock.current) return;
    cancellationLock.current = true;
    setIsCancelling(true);
    setCancellationMessage("");
    setCancellationError("");
    setCancellationNetworkError(false);
    setCancellationConflict(false);

    try {
      const response = await cancelBooking(bookingReference);
      markEmailVerified();
      setCancelDialogOpen(false);
      await loadBooking();
      setCancellationMessage(response.message);
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setCancelDialogOpen(false);
        setViewState("verification");
      } else {
        const requestError = isApiRequestError(error) ? error : null;
        const message =
          error instanceof Error
            ? error.message
            : "The booking could not be cancelled.";

        if (requestError?.status === 409) {
          setCancelDialogOpen(false);
          await loadBooking();
        }

        setCancellationError(message);
        setCancellationNetworkError(Boolean(requestError?.isNetworkError));
        setCancellationConflict(requestError?.status === 409);
      }
    } finally {
      cancellationLock.current = false;
      setIsCancelling(false);
    }
  }

  return (
    <main>
      <PageContainer className="py-10 sm:py-14">
        {viewState === "loading" ? <BookingDetailSkeleton /> : null}

        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => void loadBooking()}
            />
          </div>
        ) : null}

        {viewState === "not-found" ? (
          <ErrorState
            action={<Button onClick={() => router.push(returnHref)}>Back to bookings</Button>}
            description="This booking does not exist or is not available to this account."
            title="Booking not found"
          />
        ) : null}

        {viewState === "error" ? (
          <ErrorState
            action={<Button onClick={() => void loadBooking()}>Try again</Button>}
            description={errorMessage}
            title={isNetworkError ? "Connection problem" : "Unable to load booking"}
          />
        ) : null}

        {viewState === "detail" && booking ? (
          <BookingDetailView
            booking={booking}
            cancellationConflict={cancellationConflict}
            cancellationError={cancellationError}
            cancellationMessage={cancellationMessage}
            cancellationNetworkError={cancellationNetworkError}
            isCancelling={isCancelling}
            onCancel={() => setCancelDialogOpen(true)}
            onCheckPayment={() => void checkPaymentEligibility()}
            onVerificationRequired={() => setViewState("verification")}
            paymentEligibility={paymentEligibility}
            paymentMessage={paymentMessage}
            returnHref={returnHref}
          />
        ) : null}
      </PageContainer>

      <Dialog
        onOpenChange={(open) => {
          if (!isCancelling) setCancelDialogOpen(open);
        }}
        open={cancelDialogOpen}
        title="Cancel this booking?"
      >
        <p className="text-sm leading-6 text-[var(--qs-text-muted)]">
          QuickSeat will ask the backend to cancel this booking and release any
          eligible seats. Payment records may remain as historical records;
          cancellation does not promise a refund.
        </p>
        {cancellationError ? (
          <div className="mt-4 rounded-lg border border-[#6d2428] bg-[#351112] p-3" role="alert">
            <p className="text-sm font-semibold text-[#ff9999]">
              {cancellationNetworkError
                ? "Connection problem"
                : cancellationConflict
                  ? "Booking state changed"
                  : "Cancellation failed"}
            </p>
            <p className="mt-1 text-sm text-[#ffb0b0]">{cancellationError}</p>
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            disabled={isCancelling}
            onClick={() => setCancelDialogOpen(false)}
            variant="secondary"
          >
            Keep booking
          </Button>
          <Button
            aria-busy={isCancelling}
            disabled={isCancelling}
            onClick={() => void handleCancellation()}
            variant="danger"
          >
            {isCancelling ? "Cancelling…" : "Cancel booking"}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function BookingDetailView({
  booking,
  cancellationConflict,
  cancellationError,
  cancellationMessage,
  cancellationNetworkError,
  isCancelling,
  onCancel,
  onCheckPayment,
  onVerificationRequired,
  paymentEligibility,
  paymentMessage,
  returnHref,
}: {
  booking: BookingDetail;
  cancellationConflict: boolean;
  cancellationError: string;
  cancellationMessage: string;
  cancellationNetworkError: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  onCheckPayment: () => void;
  onVerificationRequired: () => void;
  paymentEligibility: PaymentEligibility;
  paymentMessage: string;
  returnHref: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
        href={returnHref}
      >
        ← Back to bookings
      </Link>

      <Card className="mt-4 overflow-hidden p-0 shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--qs-border)] px-6 py-7 sm:px-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--qs-primary)]">
              Booking reference
            </p>
            <h1 className="mt-2 break-all font-mono text-2xl font-bold sm:text-3xl">
              {booking.bookingReference}
            </h1>
          </div>
          <StatusBadge status={booking.status} />
        </header>

        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={booking.category === "UPCOMING" ? "primary" : "neutral"}>
                {booking.category}
              </Badge>
              {booking.status === "USED" ? <Badge tone="neutral">ENTRY USED</Badge> : null}
            </div>

            <dl className="mt-6 grid gap-5 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
              <Detail label="Movie" value={booking.movieTitle} />
              <Detail label="Cinema" value={booking.cinemaName} />
              <Detail label="Screen" value={booking.screenName} />
              <Detail label="Showtime" value={formatMyanmarDateTime(booking.startTime)} />
              <Detail label="Category" value={booking.category} />
              <Detail label="Backend total" value={formatMMK(booking.totalAmount)} />
            </dl>

            <SeatUnits seats={booking.seats} />

            {cancellationMessage ? (
              <p className="mt-6 rounded-lg border border-[#35543f] bg-[#102219] p-4 text-sm text-[#9be4b6]" role="status">
                {cancellationMessage}
              </p>
            ) : null}
            {cancellationError ? (
              <div className="mt-6 rounded-lg border border-[#6d2428] bg-[#351112] p-4" role="alert">
                <p className="font-semibold text-[#ff9999]">
                  {cancellationNetworkError
                    ? "Connection problem"
                    : cancellationConflict
                      ? "Booking state changed"
                      : "Cancellation failed"}
                </p>
                <p className="mt-1 text-sm text-[#ffb0b0]">{cancellationError}</p>
              </div>
            ) : null}
          </div>

          <LifecycleActions
            booking={booking}
            isCancelling={isCancelling}
            onCancel={onCancel}
            onCheckPayment={onCheckPayment}
            onVerificationRequired={onVerificationRequired}
            paymentEligibility={paymentEligibility}
            paymentMessage={paymentMessage}
          />
        </div>
      </Card>
    </div>
  );
}

function LifecycleActions({
  booking,
  isCancelling,
  onCancel,
  onCheckPayment,
  onVerificationRequired,
  paymentEligibility,
  paymentMessage,
}: {
  booking: BookingDetail;
  isCancelling: boolean;
  onCancel: () => void;
  onCheckPayment: () => void;
  onVerificationRequired: () => void;
  paymentEligibility: PaymentEligibility;
  paymentMessage: string;
}) {
  const router = useRouter();
  const panelClass = "h-fit rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] p-5 lg:sticky lg:top-24";

  if (booking.status === "PENDING") {
    return (
      <aside className={panelClass}>
        <h2 className="font-semibold">Pending booking</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--qs-text-muted)]">
          {paymentMessage || "Checking current payment eligibility with QuickSeat…"}
        </p>
        {paymentEligibility === "payable" ? (
          <Button
            className="mt-5 w-full"
            onClick={() =>
              router.push(
                `/checkout/payment/${encodeURIComponent(booking.bookingReference)}`,
              )
            }
          >
            Continue payment
          </Button>
        ) : null}
        {paymentEligibility === "loading" ? (
          <Button className="mt-5 w-full" disabled>Checking payment…</Button>
        ) : null}
        {paymentEligibility === "error" ? (
          <Button className="mt-5 w-full" onClick={onCheckPayment} variant="secondary">
            Check payment again
          </Button>
        ) : null}
        <Button
          className="mt-3 w-full"
          disabled={isCancelling}
          onClick={onCancel}
          variant="danger"
        >
          Cancel booking
        </Button>
        <BackendEligibilityNote />
      </aside>
    );
  }

  if (booking.status === "CONFIRMED") {
    return (
      <aside className={panelClass}>
        <h2 className="font-semibold">Confirmed booking</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--qs-text-muted)]">
          Open your confirmation or ask QuickSeat for the existing ticket.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--qs-border)] bg-[var(--qs-background)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[#565661] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
          href={`/checkout/confirmation/${encodeURIComponent(booking.bookingReference)}`}
        >
          Booking confirmation
        </Link>
        <div className="mt-3">
          <TicketAccessAction
            bookingReference={booking.bookingReference}
            onVerificationRequired={onVerificationRequired}
          />
        </div>
        <Button
          className="mt-3 w-full"
          disabled={isCancelling}
          onClick={onCancel}
          variant="danger"
        >
          Cancel booking
        </Button>
        <BackendEligibilityNote />
      </aside>
    );
  }

  if (booking.status === "EXPIRED") {
    return (
      <aside className={panelClass}>
        <ReadOnlyState description="This reservation expired and no longer accepts payment or cancellation." title="Booking expired" />
        <Link
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--qs-primary)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
          href="/showtimes"
        >
          Browse showtimes
        </Link>
      </aside>
    );
  }

  if (booking.status === "CANCELLED") {
    return (
      <aside className={panelClass}>
        <ReadOnlyState description="This booking was cancelled. Payment, ticket generation, and cancellation actions are disabled." title="Booking cancelled" />
      </aside>
    );
  }

  if (booking.status === "USED") {
    return (
      <aside className={panelClass}>
        <ReadOnlyState description="This booking has already been used for cinema entry and is now read only." title="Booking already used" />
      </aside>
    );
  }

  return (
    <aside className={panelClass}>
      <ReadOnlyState
        description={`QuickSeat returned the booking status “${booking.status}”. No lifecycle action is available for this state.`}
        title="Unknown booking status"
      />
    </aside>
  );
}

function BackendEligibilityNote() {
  return (
    <p className="mt-4 text-xs leading-5 text-[var(--qs-text-muted)]">
      Cancellation eligibility is verified by the backend when submitted.
    </p>
  );
}

function ReadOnlyState({ description, title }: { description: string; title: string }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--qs-text-muted)]">{description}</p>
    </div>
  );
}

function SeatUnits({ seats }: { seats: unknown[] }) {
  return (
    <section aria-labelledby="booking-detail-seats" className="mt-7">
      <h2 className="font-semibold" id="booking-detail-seats">Selected seats</h2>
      {seats.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {seats.map((seat, index) => (
            <li
              className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-3 py-2 text-sm"
              key={`${getSeatLabel(seat, index)}-${index}`}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}
