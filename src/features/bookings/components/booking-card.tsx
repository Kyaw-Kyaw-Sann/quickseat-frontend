"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import { withReturnTo } from "@/features/auth/return-path";
import type { BookingListItem } from "@/features/bookings/types";
import { TicketAccessAction } from "@/features/tickets/components/ticket-access-action";
import { getPaymentSummary } from "@/lib/api/bookings";
import { formatMMK } from "@/lib/formatters/currency";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type BookingAction = "payment";

export function BookingCard({
  booking,
  onVerificationRequired,
  returnHref,
}: {
  booking: BookingListItem;
  onVerificationRequired: () => void;
  returnHref: string;
}) {
  const router = useRouter();
  const actionLock = useRef(false);
  const [activeAction, setActiveAction] = useState<BookingAction | null>(null);
  const [actionError, setActionError] = useState("");

  async function continuePayment() {
    if (actionLock.current) return;
    actionLock.current = true;
    setActiveAction("payment");
    setActionError("");

    try {
      const response = await getPaymentSummary(booking.bookingReference);
      const summary = response.data;

      if (
        summary.bookingStatus === "PENDING" &&
        summary.canPay &&
        summary.remainingSeconds > 0
      ) {
        router.push(
          `/checkout/payment/${encodeURIComponent(booking.bookingReference)}`,
        );
        return;
      }

      setActionError(
        `This booking is no longer payable. Current status: ${summary.bookingStatus}.`,
      );
    } catch (error) {
      handleActionError(error);
    } finally {
      actionLock.current = false;
      setActiveAction(null);
    }
  }

  function handleActionError(error: unknown) {
    if (isVerificationRequiredError(error)) {
      onVerificationRequired();
      return;
    }

    setActionError(
      error instanceof Error
        ? error.message
        : "The booking action could not be completed.",
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
            Booking reference
          </p>
          <p className="mt-1 break-all font-mono font-bold text-[var(--qs-text)]">
            {booking.bookingReference}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={booking.category === "UPCOMING" ? "primary" : "neutral"}>
            {booking.category}
          </Badge>
          {booking.status === "USED" ? <Badge tone="neutral">ENTRY USED</Badge> : null}
        </div>
        <h2 className="mt-4 text-xl font-bold">{booking.movieTitle}</h2>
        <div className="mt-5 border-y border-[var(--qs-border)] py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
            Backend total
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--qs-primary)]">
            {formatMMK(booking.totalAmount)}
          </p>
        </div>

        <div className="mt-auto pt-5">
          <Link
            className="mb-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[#565661] hover:bg-[#2a2a31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
            href={withReturnTo(
              `/bookings/${encodeURIComponent(booking.bookingReference)}`,
              returnHref,
            )}
          >
            View details
          </Link>
          <BookingActions
            activeAction={activeAction}
            booking={booking}
            onContinuePayment={continuePayment}
            onVerificationRequired={onVerificationRequired}
          />
          {actionError ? (
            <p className="mt-3 text-sm text-[#ff9999]" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function BookingActions({
  activeAction,
  booking,
  onContinuePayment,
  onVerificationRequired,
}: {
  activeAction: BookingAction | null;
  booking: BookingListItem;
  onContinuePayment: () => Promise<void>;
  onVerificationRequired: () => void;
}) {
  switch (booking.status) {
    case "PENDING":
      return (
        <Button
          aria-busy={activeAction === "payment"}
          className="w-full"
          disabled={activeAction !== null}
          onClick={() => void onContinuePayment()}
        >
          {activeAction === "payment" ? "Checking payment…" : "Continue payment"}
        </Button>
      );
    case "CONFIRMED":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[#565661] hover:bg-[#2a2a31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
            href={`/checkout/confirmation/${encodeURIComponent(booking.bookingReference)}`}
          >
            Confirmation
          </Link>
          <TicketAccessAction
            bookingReference={booking.bookingReference}
            onVerificationRequired={onVerificationRequired}
          />
        </div>
      );
    case "EXPIRED":
      return (
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[#565661] hover:bg-[#2a2a31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
          href="/showtimes"
        >
          Browse showtimes
        </Link>
      );
    case "CANCELLED":
      return <ReadOnlyLabel>Cancelled booking · read only</ReadOnlyLabel>;
    case "USED":
      return <ReadOnlyLabel>Used booking · read only</ReadOnlyLabel>;
    default:
      return <ReadOnlyLabel>Unsupported lifecycle · read only</ReadOnlyLabel>;
  }
}

function ReadOnlyLabel({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface-raised)] px-4 py-3 text-center text-sm text-[var(--qs-text-muted)]">
      {children}
    </p>
  );
}
