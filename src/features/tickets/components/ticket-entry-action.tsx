"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import { rememberTicketBookingReference } from "@/features/tickets/ticket-context";
import { generateTicket } from "@/lib/api/tickets";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function TicketEntryAction({
  bookingReference,
}: {
  bookingReference: string;
}) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const submissionLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleTicketEntry() {
    if (submissionLock.current) return;

    submissionLock.current = true;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await generateTicket(bookingReference);
      const ticket = response.data;

      if (!ticket.ticketToken || !ticket.bookingReference) {
        throw new Error("QuickSeat returned an invalid ticket response.");
      }

      markEmailVerified();
      rememberTicketBookingReference(
        ticket.ticketToken,
        ticket.bookingReference,
      );
      router.push(`/tickets/${encodeURIComponent(ticket.ticketToken)}`);
    } catch (error) {
      if (isVerificationRequiredError(error)) {
        setVerificationRequired(true);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The ticket could not be prepared.",
        );
      }
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  if (verificationRequired && user) {
    return (
      <div className="mt-5">
        <VerificationRequired
          email={user.email}
          onTryAgain={() => {
            setVerificationRequired(false);
            void handleTicketEntry();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <Button
        aria-busy={isSubmitting}
        className="w-full"
        disabled={isSubmitting}
        onClick={() => void handleTicketEntry()}
      >
        {isSubmitting ? "Preparing ticket…" : "Get ticket"}
      </Button>
      {errorMessage ? (
        <p className="mt-3 text-sm text-[#ff9999]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
