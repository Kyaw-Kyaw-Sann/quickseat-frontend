"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import {
  clearActiveSeatHold,
  readActiveSeatHold,
  updateActiveSeatHoldDetail,
} from "@/features/seat-holds/active-seat-hold";
import type { SeatHold, SeatHoldDetail } from "@/features/seat-holds/types";
import {
  formatCountdown,
  useAuthoritativeCountdown,
} from "@/features/seat-holds/use-authoritative-countdown";
import { isApiRequestError } from "@/lib/api/errors";
import { getSeatHold, releaseSeatHold } from "@/lib/api/seat-holds";
import { formatMMK } from "@/lib/formatters/currency";
import { formatMyanmarDateTime } from "@/lib/formatters/date-time";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SeatHoldCheckoutProps = {
  bookingReference: string;
  showtimeId?: number;
};

type HoldViewState =
  | "loading"
  | "ready"
  | "expired"
  | "verification"
  | "not-found"
  | "error";

export function SeatHoldCheckout(props: SeatHoldCheckoutProps) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <SeatHoldCheckoutContent {...props} />
    </AuthGuard>
  );
}

function SeatHoldCheckoutContent({
  bookingReference,
  showtimeId: routeShowtimeId,
}: SeatHoldCheckoutProps) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const [viewState, setViewState] = useState<HoldViewState>("loading");
  const [detail, setDetail] = useState<SeatHoldDetail | null>(null);
  const [holdSnapshot, setHoldSnapshot] = useState<SeatHold | null>(null);
  const [showtimeId, setShowtimeId] = useState(routeShowtimeId);
  const [authoritativeRemainingSeconds, setAuthoritativeRemainingSeconds] =
    useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const synchronizeHold = useCallback(async (preserveExpiredOnError = false) => {
    try {
      const response = await getSeatHold(bookingReference);
      const authoritativeDetail = response.data;
      const activeHold = updateActiveSeatHoldDetail(authoritativeDetail);

      markEmailVerified();
      setDetail(authoritativeDetail);
      setHoldSnapshot(activeHold?.hold ?? null);
      setShowtimeId((current) => current ?? activeHold?.showtimeId);
      setAuthoritativeRemainingSeconds(
        Math.max(0, authoritativeDetail.remainingSeconds),
      );
      setErrorMessage("");

      if (
        authoritativeDetail.status !== "PENDING" ||
        authoritativeDetail.remainingSeconds <= 0
      ) {
        clearActiveSeatHold(bookingReference);
        setViewState("expired");
      } else {
        setViewState("ready");
      }
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      if (isApiRequestError(error) && error.status === 404) {
        clearActiveSeatHold(bookingReference);
        if (!preserveExpiredOnError) setViewState("not-found");
        return;
      }

      if (isApiRequestError(error) && error.status === 409) {
        clearActiveSeatHold(bookingReference);
        setViewState("expired");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The seat hold could not be loaded.",
      );
      if (!preserveExpiredOnError) setViewState("error");
    }
  }, [bookingReference, markEmailVerified]);

  const handleCountdownElapsed = useCallback(() => {
    clearActiveSeatHold(bookingReference);
    setViewState("expired");
    void synchronizeHold(true);
  }, [bookingReference, synchronizeHold]);

  const remainingSeconds = useAuthoritativeCountdown({
    active: viewState === "ready",
    remainingSeconds: authoritativeRemainingSeconds,
    onElapsed: handleCountdownElapsed,
  });

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const activeHold = readActiveSeatHold(bookingReference);
      setHoldSnapshot(activeHold?.hold ?? null);
      setShowtimeId((current) => current ?? activeHold?.showtimeId);
      void synchronizeHold();
    }, 0);

    return () => window.clearTimeout(initialize);
  }, [bookingReference, synchronizeHold]);

  useEffect(() => {
    if (viewState !== "ready") return;
    const resync = window.setInterval(() => void synchronizeHold(), 60_000);
    return () => window.clearInterval(resync);
  }, [synchronizeHold, viewState]);

  async function handleRelease() {
    if (isReleasing) return;
    setIsReleasing(true);
    setErrorMessage("");

    try {
      await releaseSeatHold(bookingReference);
      clearActiveSeatHold(bookingReference);
      navigateToFreshSeatMap();
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setReleaseOpen(false);
        setViewState("verification");
      } else if (isApiRequestError(error) && error.status === 409) {
        setReleaseOpen(false);
        clearActiveSeatHold(bookingReference);
        setViewState("expired");
        void synchronizeHold(true);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The seat hold could not be released.",
        );
        setReleaseOpen(false);
      }
    } finally {
      setIsReleasing(false);
    }
  }

  function navigateToFreshSeatMap() {
    router.push(getSeatMapPath(showtimeId));
    router.refresh();
  }

  return (
    <main className="bg-[radial-gradient(circle_at_50%_0%,rgba(120,8,29,0.2),transparent_34%)]">
      <PageContainer className="py-10 sm:py-14">
        {viewState === "loading" ? <HoldSkeleton /> : null}

        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => {
                setViewState("loading");
                void synchronizeHold();
              }}
            />
          </div>
        ) : null}

        {viewState === "not-found" ? (
          <ErrorState
            action={
              <Button onClick={() => router.push("/showtimes")}>
                Browse showtimes
              </Button>
            }
            description="This seat hold does not exist or is not available to this account."
            title="Seat hold not found"
          />
        ) : null}

        {viewState === "error" ? (
          <ErrorState
            action={<Button onClick={() => void synchronizeHold()}>Try again</Button>}
            description={errorMessage}
            title="Unable to load reservation"
          />
        ) : null}

        {viewState === "expired" ? (
          <ExpiredHold
            onChooseAgain={navigateToFreshSeatMap}
          />
        ) : null}

        {viewState === "ready" && detail ? (
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--qs-primary)]">
                    Seats reserved
                  </p>
                  <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                    Checkout is ready
                  </h1>
                </div>
                <StatusBadge status={detail.status} />
              </div>

              <dl className="mt-8 grid gap-5 border-y border-[var(--qs-border)] py-6 sm:grid-cols-2">
                <Detail label="Booking reference" value={detail.bookingReference} />
                <Detail
                  label="Backend total"
                  value={
                    holdSnapshot
                      ? formatMMK(holdSnapshot.totalAmount)
                      : "Available in payment summary"
                  }
                />
                <Detail
                  label="Reservation expires"
                  value={formatMyanmarDateTime(detail.expiresAt)}
                />
                <Detail
                  label="Held seat units"
                  value={
                    holdSnapshot
                      ? holdSnapshot.selectedSeats.length > 0
                        ? String(holdSnapshot.selectedSeats.length)
                        : "Preserved for checkout"
                      : "Restored from backend"
                  }
                />
              </dl>

              <p className="mt-6 text-sm leading-6 text-[var(--qs-text-muted)]">
                Your seats are held by QuickSeat. The backend controls the
                expiry time; this screen never extends your reservation.
              </p>

              {errorMessage ? (
                <p
                  className="mt-5 rounded-lg border border-[#6d2428] bg-[#351112] p-3 text-sm text-[#ff9999]"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}
            </Card>

            <Card className="h-fit lg:sticky lg:top-24">
              <p className="text-sm font-medium text-[var(--qs-text-muted)]">
                Reservation expires in
              </p>
              <p
                aria-live="polite"
                className="mt-2 font-mono text-4xl font-bold text-[var(--qs-amber)]"
              >
                {formatCountdown(remainingSeconds)}
              </p>
              <p className="mt-3 text-xs text-[var(--qs-text-muted)]">
                Display timer only · synchronized with QuickSeat
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() =>
                  router.push(
                    getPaymentPath(detail.bookingReference, showtimeId),
                  )
                }
              >
                Continue to demo payment
              </Button>
              <Button
                className="mt-3 w-full"
                onClick={() => setReleaseOpen(true)}
                variant="danger"
              >
                Release seats
              </Button>
            </Card>
          </div>
        ) : null}
      </PageContainer>

      <Dialog
        onOpenChange={setReleaseOpen}
        open={releaseOpen}
        title="Release reserved seats?"
      >
        <p className="text-sm leading-6 text-[var(--qs-text-muted)]">
          This cancels the pending reservation and makes its seats available
          to other customers.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={isReleasing}
            onClick={() => setReleaseOpen(false)}
            variant="secondary"
          >
            Keep reservation
          </Button>
          <Button
            disabled={isReleasing}
            onClick={() => void handleRelease()}
            variant="danger"
          >
            {isReleasing ? "Releasing…" : "Release seats"}
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function ExpiredHold({ onChooseAgain }: { onChooseAgain: () => void }) {
  return (
    <Card className="mx-auto max-w-xl border-[#6d2428] py-10 text-center">
      <StatusBadge status="EXPIRED" />
      <h1 className="mt-4 text-2xl font-bold">Your seat reservation expired</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--qs-text-muted)]">
        We released these seats so other customers can book them. Return to the
        refreshed seat map to choose again.
      </p>
      <Button className="mt-6" onClick={onChooseAgain}>
        Choose seats again
      </Button>
    </Card>
  );
}

function HoldSkeleton() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]" role="status">
      <Card className="space-y-5 p-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-36 w-full" />
      </Card>
      <Card className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-11 w-full" />
      </Card>
      <span className="sr-only">Loading seat hold…</span>
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

function getSeatMapPath(showtimeId?: number): string {
  return showtimeId ? `/showtimes/${showtimeId}` : "/showtimes";
}

function getPaymentPath(
  bookingReference: string,
  showtimeId?: number,
): string {
  const path = `/checkout/payment/${encodeURIComponent(bookingReference)}`;
  return showtimeId ? `${path}?showtimeId=${showtimeId}` : path;
}
