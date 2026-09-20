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
import type {
  PaymentResult,
  PaymentSummary,
} from "@/features/bookings/types";
import {
  clearActiveSeatHold,
  readActiveSeatHold,
} from "@/features/seat-holds/active-seat-hold";
import {
  formatCountdown,
  useAuthoritativeCountdown,
} from "@/features/seat-holds/use-authoritative-countdown";
import { getPaymentSummary, submitMockPayment } from "@/lib/api/bookings";
import { isApiRequestError } from "@/lib/api/errors";
import type { FieldErrors } from "@/lib/api/types";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PaymentCheckoutProps = {
  bookingReference: string;
  showtimeId?: number;
};

type PaymentViewState =
  | "loading"
  | "ready"
  | "failed"
  | "success"
  | "expired"
  | "unavailable"
  | "verification"
  | "not-found"
  | "conflict"
  | "error";

export function PaymentCheckout(props: PaymentCheckoutProps) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <PaymentCheckoutContent {...props} />
    </AuthGuard>
  );
}

function PaymentCheckoutContent({
  bookingReference,
  showtimeId: routeShowtimeId,
}: PaymentCheckoutProps) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const submissionLock = useRef(false);
  const [viewState, setViewState] = useState<PaymentViewState>("loading");
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [showtimeId, setShowtimeId] = useState(routeShowtimeId);
  const [authoritativeRemainingSeconds, setAuthoritativeRemainingSeconds] =
    useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isNetworkError, setIsNetworkError] = useState(false);

  const applySummary = useCallback(
    (nextSummary: PaymentSummary, payableState: "ready" | "failed" = "ready") => {
      markEmailVerified();
      setSummary(nextSummary);
      setAuthoritativeRemainingSeconds(
        Math.max(0, nextSummary.remainingSeconds),
      );
      setErrorMessage("");
      setFieldErrors({});
      setIsNetworkError(false);

      if (
        nextSummary.bookingStatus === "CONFIRMED" &&
        nextSummary.paymentStatus === "SUCCESS"
      ) {
        clearActiveSeatHold(bookingReference);
        setViewState("success");
        router.replace(
          `/checkout/confirmation/${encodeURIComponent(bookingReference)}`,
        );
        return false;
      }

      if (
        nextSummary.bookingStatus === "PENDING" &&
        nextSummary.canPay &&
        nextSummary.remainingSeconds > 0
      ) {
        setViewState(payableState);
        return true;
      }

      clearActiveSeatHold(bookingReference);
      setViewState(
        nextSummary.remainingSeconds <= 0 ||
          nextSummary.bookingStatus === "EXPIRED"
          ? "expired"
          : "unavailable",
      );
      return false;
    },
    [bookingReference, markEmailVerified, router],
  );

  const handleRequestError = useCallback(
    (error: unknown, preserveExpiredOnError = false) => {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      if (isApiRequestError(error) && error.status === 404) {
        clearActiveSeatHold(bookingReference);
        if (!preserveExpiredOnError) setViewState("not-found");
        return;
      }

      const requestError = isApiRequestError(error) ? error : null;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The payment request could not be completed.",
      );
      setFieldErrors(requestError?.fieldErrors ?? {});
      setIsNetworkError(Boolean(requestError?.isNetworkError));

      if (requestError?.status === 409) {
        setViewState("conflict");
      } else if (!preserveExpiredOnError) {
        setViewState("error");
      }
    },
    [bookingReference],
  );

  const synchronizeSummary = useCallback(
    async (preserveExpiredOnError = false) => {
      try {
        const response = await getPaymentSummary(bookingReference);
        applySummary(response.data);
        return response.data;
      } catch (error) {
        handleRequestError(error, preserveExpiredOnError);
        return null;
      }
    },
    [applySummary, bookingReference, handleRequestError],
  );

  const handleCountdownElapsed = useCallback(() => {
    clearActiveSeatHold(bookingReference);
    setViewState("expired");
    void synchronizeSummary(true);
  }, [bookingReference, synchronizeSummary]);

  const remainingSeconds = useAuthoritativeCountdown({
    active: viewState === "ready" || viewState === "failed",
    remainingSeconds: authoritativeRemainingSeconds,
    onElapsed: handleCountdownElapsed,
  });

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const activeHold = readActiveSeatHold(bookingReference);
      setShowtimeId((current) => current ?? activeHold?.showtimeId);
      void synchronizeSummary();
    }, 0);

    return () => window.clearTimeout(initialize);
  }, [bookingReference, synchronizeSummary]);

  useEffect(() => {
    if (viewState !== "ready" && viewState !== "failed") return;
    const resync = window.setInterval(() => void synchronizeSummary(), 60_000);
    return () => window.clearInterval(resync);
  }, [synchronizeSummary, viewState]);

  useEffect(() => {
    if (viewState !== "ready" && viewState !== "failed") return;

    function resynchronizeWhenVisible() {
      if (document.visibilityState === "visible") void synchronizeSummary();
    }

    document.addEventListener("visibilitychange", resynchronizeWhenVisible);
    window.addEventListener("focus", resynchronizeWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", resynchronizeWhenVisible);
      window.removeEventListener("focus", resynchronizeWhenVisible);
    };
  }, [synchronizeSummary, viewState]);

  async function handlePayment() {
    if (submissionLock.current || isPaying || remainingSeconds <= 0) {
      return;
    }

    submissionLock.current = true;
    setIsPaying(true);
    setMessage("");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const latestSummaryResponse = await getPaymentSummary(bookingReference);
      const latestSummary = latestSummaryResponse.data;

      if (!applySummary(latestSummary)) return;

      const response = await submitMockPayment(bookingReference, {
        successful: true,
      });
      const result = response.data;
      setPaymentResult(result);
      setMessage(response.message);

      if (
        result.bookingStatus === "CONFIRMED" &&
        result.paymentStatus === "SUCCESS"
      ) {
        clearActiveSeatHold(bookingReference);
        setViewState("success");
        router.replace(
          `/checkout/confirmation/${encodeURIComponent(bookingReference)}`,
        );
        return;
      }

      if (
        result.bookingStatus === "PENDING" &&
        result.paymentStatus === "FAILED"
      ) {
        const refreshed = await getPaymentSummary(bookingReference);
        const canRetry = applySummary(refreshed.data, "failed");
        if (canRetry) setViewState("failed");
        return;
      }

      setErrorMessage(
        response.message ||
          "QuickSeat returned a payment state that cannot continue.",
      );
      setViewState("unavailable");
    } catch (error) {
      handleRequestError(error);
    } finally {
      submissionLock.current = false;
      setIsPaying(false);
    }
  }

  function navigateToFreshSeatMap() {
    router.push(showtimeId ? `/showtimes/${showtimeId}` : "/showtimes");
    router.refresh();
  }

  const payable =
    Boolean(summary?.canPay) &&
    summary?.bookingStatus === "PENDING" &&
    remainingSeconds > 0 &&
    !isPaying;

  return (
    <main>
      <PageContainer className="py-10 sm:py-14">
        {viewState === "loading" ? <PaymentSkeleton /> : null}

        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => {
                setViewState("loading");
                void synchronizeSummary();
              }}
            />
          </div>
        ) : null}

        {viewState === "not-found" ? (
          <ErrorState
            action={<Button onClick={() => router.push("/showtimes")}>Browse showtimes</Button>}
            description="This booking does not exist or is not available to this account."
            title="Payment booking not found"
          />
        ) : null}

        {viewState === "error" ? (
          <RequestErrorState
            description={errorMessage}
            fieldErrors={fieldErrors}
            onRetry={() => void synchronizeSummary()}
            title={isNetworkError ? "Connection problem" : "Unable to load payment"}
          />
        ) : null}

        {viewState === "conflict" ? (
          <RequestErrorState
            description={errorMessage}
            fieldErrors={fieldErrors}
            onRetry={() => void synchronizeSummary()}
            title="Payment state changed"
          />
        ) : null}

        {viewState === "expired" ? (
          <ExpiredPayment onChooseAgain={navigateToFreshSeatMap} />
        ) : null}

        {viewState === "unavailable" ? (
          <ErrorState
            action={<Button onClick={() => void synchronizeSummary()}>Refresh status</Button>}
            description={
              errorMessage ||
              `This ${summary?.bookingStatus.toLowerCase() ?? "booking"} booking cannot accept payment.`
            }
            title="Payment unavailable"
          />
        ) : null}

        {viewState === "success" ? (
          <PaymentSuccess
            bookingReference={bookingReference}
            paymentResult={paymentResult}
            summary={summary}
          />
        ) : null}

        {(viewState === "ready" || viewState === "failed") && summary ? (
          <PaymentPanel
            isPaying={isPaying}
            fieldErrors={fieldErrors}
            message={message}
            onPay={handlePayment}
            payable={payable}
            remainingSeconds={remainingSeconds}
            summary={summary}
            viewState={viewState}
          />
        ) : null}
      </PageContainer>
    </main>
  );
}

function PaymentPanel({
  isPaying,
  fieldErrors,
  message,
  onPay,
  payable,
  remainingSeconds,
  summary,
  viewState,
}: {
  isPaying: boolean;
  fieldErrors: FieldErrors;
  message: string;
  onPay: () => Promise<void>;
  payable: boolean;
  remainingSeconds: number;
  summary: PaymentSummary;
  viewState: "ready" | "failed";
}) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="p-6 shadow-none sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--qs-amber)]">Demo payment</p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              Complete your booking
            </h1>
            <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
              QuickSeat uses a mock payment system for this project.
            </p>
          </div>
          <StatusBadge status={summary.bookingStatus} />
        </div>

        <dl className="mt-8 grid gap-5 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
          <Detail label="Booking reference" value={summary.bookingReference} />
          <Detail label="Amount" value={formatMMK(summary.totalAmount)} />
          <Detail
            label="Payment status"
            value={summary.paymentStatus ?? "NOT ATTEMPTED"}
          />
          <Detail
            label="Expires"
            value={formatMyanmarDateTime(summary.expiresAt)}
          />
        </dl>

        {viewState === "failed" ? (
          <div className="mt-6 rounded-lg border border-[#6d2428] bg-[#351112] p-4" role="alert">
            <p className="font-semibold text-[#ff9999]">Payment simulation failed</p>
            <p className="mt-1 text-sm text-[var(--qs-text-muted)]">
              {message || "Your booking remains pending. You may retry manually before it expires."}
            </p>
          </div>
        ) : null}

        {Object.keys(fieldErrors).length > 0 ? (
          <FieldErrorList fieldErrors={fieldErrors} />
        ) : null}

        <div className="mt-7">
          <Button
            className="w-full"
            disabled={!payable}
            onClick={() => void onPay()}
          >
            {isPaying ? "Processing payment..." : "Pay Now"}
          </Button>
        </div>
      </Card>

      <Card className="h-fit border-l-2 border-l-[var(--qs-amber)] shadow-none lg:sticky lg:top-24">
        <p className="text-sm font-medium text-[var(--qs-text-muted)]">
          Reservation expires in
        </p>
        <p
          aria-live="polite"
          className="mt-2 font-mono text-4xl font-semibold tabular-nums"
        >
          {formatCountdown(remainingSeconds)}
        </p>
        <p className="mt-3 text-xs text-[var(--qs-text-muted)]">
          Backend-controlled · display timer only
        </p>
        <div className="mt-6 border-t border-[var(--qs-border)] pt-5">
          <p className="text-sm text-[var(--qs-text-muted)]">Backend total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMMK(summary.totalAmount)}
          </p>
        </div>
      </Card>
    </div>
  );
}

function PaymentSuccess({
  bookingReference,
  paymentResult,
  summary,
}: {
  bookingReference: string;
  paymentResult: PaymentResult | null;
  summary: PaymentSummary | null;
}) {
  const amount = paymentResult?.amount ?? summary?.totalAmount;

  return (
    <Card
      className="mx-auto max-w-2xl border-[#35543f] py-10 text-center"
      data-confirmation-booking-reference={bookingReference}
    >
      <StatusBadge status="CONFIRMED" />
      <h1 className="mt-4 text-3xl font-bold">Payment successful</h1>
      <p className="mt-3 text-sm text-[var(--qs-text-muted)]">
        QuickSeat confirmed your booking. No ticket has been generated yet.
      </p>
      <dl className="mx-auto mt-7 grid max-w-lg gap-4 border-y border-[var(--qs-border)] py-5 text-left sm:grid-cols-2">
        <Detail label="Booking reference" value={bookingReference} />
        <Detail
          label="Amount"
          value={amount === undefined ? "Confirmed by backend" : formatMMK(amount)}
        />
        {paymentResult?.paymentReference ? (
          <Detail label="Payment reference" value={paymentResult.paymentReference} />
        ) : null}
        <Detail label="Payment status" value="SUCCESS" />
      </dl>
      <p className="mt-6 text-xs text-[var(--qs-text-muted)]">
        Opening your backend-confirmed booking details&hellip;
      </p>
    </Card>
  );
}

function ExpiredPayment({ onChooseAgain }: { onChooseAgain: () => void }) {
  return (
    <Card className="mx-auto max-w-xl border-[#6d2428] py-10 text-center">
      <StatusBadge status="EXPIRED" />
      <h1 className="mt-4 text-2xl font-bold">Reservation expired</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--qs-text-muted)]">
        QuickSeat can no longer accept payment for this reservation. Choose
        seats again to start a new hold.
      </p>
      <Button className="mt-6" onClick={onChooseAgain}>
        Choose seats again
      </Button>
    </Card>
  );
}

function RequestErrorState({
  description,
  fieldErrors,
  onRetry,
  title,
}: {
  description: string;
  fieldErrors: FieldErrors;
  onRetry: () => void;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <ErrorState
        action={<Button onClick={onRetry}>Try again</Button>}
        description={description}
        title={title}
      />
      {Object.keys(fieldErrors).length > 0 ? (
        <FieldErrorList fieldErrors={fieldErrors} />
      ) : null}
    </div>
  );
}

function FieldErrorList({ fieldErrors }: { fieldErrors: FieldErrors }) {
  return (
    <div className="mt-5 rounded-lg border border-[#6d2428] bg-[#351112] p-4" role="alert">
      <p className="text-sm font-semibold text-[#ff9999]">Request details</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#ffb0b0]">
        {Object.entries(fieldErrors).map(([field, error]) => (
          <li key={field}>
            <span className="font-medium">{field}:</span> {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" role="status">
      <Card className="space-y-5 p-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-11 w-full" />
      </Card>
      <Card className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-16 w-full" />
      </Card>
      <span className="sr-only">Loading payment summary…</span>
    </div>
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
