"use client";

import { Button } from "@/components/ui/button";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import { rememberTicketBookingReference } from "@/features/tickets/ticket-context";
import { isApiRequestError } from "@/lib/api/errors";
import { getTicketByBookingReference } from "@/lib/api/tickets";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function TicketAccessAction({
  bookingReference,
  onVerificationRequired,
}: {
  bookingReference: string;
  onVerificationRequired: () => void;
}) {
  const router = useRouter();
  const requestLock = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleTicketAccess() {
    if (requestLock.current) return;
    requestLock.current = true;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getTicketByBookingReference(bookingReference);
      const ticket = response.data;

      if (!ticket.ticketToken || !ticket.bookingReference) {
        throw new Error("QuickSeat returned an invalid ticket response.");
      }

      rememberTicketBookingReference(
        ticket.ticketToken,
        ticket.bookingReference,
      );
      router.push(`/tickets/${encodeURIComponent(ticket.ticketToken)}`);
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        onVerificationRequired();
      } else if (isApiRequestError(error) && error.status === 404) {
        router.push(
          `/checkout/confirmation/${encodeURIComponent(bookingReference)}`,
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The ticket could not be retrieved.",
        );
      }
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        aria-busy={isLoading}
        className="w-full"
        disabled={isLoading}
        onClick={() => void handleTicketAccess()}
      >
        {isLoading ? "Finding ticket…" : "View ticket"}
      </Button>
      {errorMessage ? (
        <p className="mt-2 text-sm text-[#ff9999]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
