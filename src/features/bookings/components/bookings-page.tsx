"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAuth } from "@/features/auth/auth-provider";
import { VerificationRequired } from "@/features/auth/verification-required";
import { isVerificationRequiredError } from "@/features/auth/verification-errors";
import { BookingCard } from "@/features/bookings/components/booking-card";
import { BookingFilters } from "@/features/bookings/components/booking-filters";
import { BookingListSkeleton } from "@/features/bookings/components/booking-list-skeleton";
import { BookingPagination } from "@/features/bookings/components/booking-pagination";
import {
  buildBookingsHref,
  type BookingQuery,
} from "@/features/bookings/query";
import type { BookingListItem } from "@/features/bookings/types";
import { getBookings } from "@/lib/api/bookings";
import { isApiRequestError } from "@/lib/api/errors";
import type { PaginatedResponse } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type BookingsViewState = "loading" | "ready" | "verification" | "error";

export function BookingsPage({ query }: { query: BookingQuery }) {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <BookingsPageContent query={query} />
    </AuthGuard>
  );
}

function BookingsPageContent({ query }: { query: BookingQuery }) {
  const router = useRouter();
  const { markEmailVerified, user } = useAuth();
  const requestSequence = useRef(0);
  const [viewState, setViewState] = useState<BookingsViewState>("loading");
  const [bookings, setBookings] =
    useState<PaginatedResponse<BookingListItem> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNetworkError, setIsNetworkError] = useState(false);

  const loadBookings = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setViewState("loading");

    try {
      const response = await getBookings({
        category: query.category === "ALL" ? undefined : query.category,
        date: query.date || undefined,
        page: query.page,
        size: query.size,
        status: query.status === "ALL" ? undefined : query.status,
      });

      if (requestId !== requestSequence.current) return;

      const result = response.data;
      const lastValidPage = Math.max(0, result.totalPages - 1);
      if (
        query.page > 0 &&
        (query.page >= result.totalPages || result.content.length === 0)
      ) {
        router.replace(buildBookingsHref(query, { page: lastValidPage }));
        return;
      }

      markEmailVerified();
      setBookings(result);
      setErrorMessage("");
      setIsNetworkError(false);
      setViewState("ready");
    } catch (error) {
      if (requestId !== requestSequence.current) return;

      if (isVerificationRequiredError(error)) {
        setViewState("verification");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Your bookings could not be loaded.",
      );
      setIsNetworkError(isApiRequestError(error) && error.isNetworkError);
      setViewState("error");
    }
  }, [
    markEmailVerified,
    query,
    router,
  ]);

  useEffect(() => {
    const initialize = window.setTimeout(() => void loadBookings(), 0);
    return () => window.clearTimeout(initialize);
  }, [loadBookings]);

  function showVerificationRequired() {
    setViewState("verification");
  }

  return (
    <main>
      <header>
        <PageContainer className="py-8 sm:py-12">
          <div className="max-w-3xl border-b border-[var(--qs-border)] pb-6 sm:pb-7">
            <h1 className="qs-heading">My Bookings</h1>
            <p className="mt-2 text-sm text-[var(--qs-text-muted)] sm:text-base">
              Review your booking statuses and continue available actions.
            </p>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="pb-8 pt-0 sm:pb-12">
        {viewState === "verification" && user ? (
          <div className="mx-auto max-w-xl">
            <VerificationRequired
              email={user.email}
              onTryAgain={() => void loadBookings()}
            />
          </div>
        ) : (
          <>
            <BookingFilters query={query} />

            <div className="mt-8">
              {viewState === "loading" ? <BookingListSkeleton /> : null}

              {viewState === "error" ? (
                <ErrorState
                  action={<Button onClick={() => void loadBookings()}>Try again</Button>}
                  description={errorMessage}
                  title={isNetworkError ? "Connection problem" : "Unable to load bookings"}
                />
              ) : null}

              {viewState === "ready" && bookings?.content.length === 0 ? (
                <EmptyState
                  action={
                    <Button onClick={() => router.push("/showtimes")}>
                      Browse showtimes
                    </Button>
                  }
                  description="No bookings match the selected status, category, and date filters."
                  title="No bookings found"
                />
              ) : null}

              {viewState === "ready" && bookings && bookings.content.length > 0 ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {bookings.content.map((booking) => (
                    <BookingCard
                      booking={booking}
                      key={booking.bookingReference}
                      onVerificationRequired={showVerificationRequired}
                      returnHref={buildBookingsHref(query)}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {viewState === "ready" && bookings ? (
              <BookingPagination
                currentPage={bookings.page}
                query={query}
                totalElements={bookings.totalElements}
                totalPages={bookings.totalPages}
              />
            ) : null}
          </>
        )}
      </PageContainer>
    </main>
  );
}
